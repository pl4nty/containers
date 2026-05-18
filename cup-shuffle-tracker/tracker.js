// Cup-shuffle tracker — pure JS computer vision pipeline.
// All exports operate on plain typed arrays so the same code can be unit-tested
// from a Node.js harness without a DOM.

export const CFG = {
  procW: 320,
  procH: 180,
  // Mask thresholds (HSV, h in [0,360), s/v in [0,1])
  red:    { hLo: 320, hHi: 22,  sMin: 0.50, vMin: 0.50 },
  yellow: { hLo: 35,  hHi: 95,  sMin: 0.40, vMin: 0.50 },
  blue:   { hLo: 195, hHi: 250, sMin: 0.55, vMin: 0.45 },
  // Blob filters (at processing resolution)
  cup:  { minArea: 220, maxArea: 9000, minAR: 0.40, maxAR: 2.4 },
  ball: { minArea: 18,  maxArea: 600,  minAR: 0.55, maxAR: 1.8 },
  // Spatial constraints (fractions of frame size)
  cupCropY: 0.45,   // any pixel above this y is removed from the cup mask
  cupYMin: 0.45,
  cupYMax: 0.88,
  cupXMin: 0.05,
  cupXMax: 0.78,
  ballYMin: 0.45,
  ballYMax: 0.92,
  ballXMin: 0.10,
  ballXMax: 0.78,
  // Centroid tracker (used only before lock)
  matchDist: 90,
  maxMissingFramesUnlocked: 8,
  // Phase 1: ball must persist for N frames before we accept it
  minBallFrames: 3,
  // Slot tracker
  slotToleranceFrac: 0.42,  // tolerance = slotSpacing * frac (capped)
  slotToleranceMax: 16,
  slotEmptyMinFrames: 2,    // a slot must be empty this many frames to count
  swapCommitFrames: 2,      // all slots occupied this long after a swap to commit it
  // Stop detection (frames of stable+all-occupied)
  stopFrames: 30,           // ~1s @ 30fps
  minTrackFrames: 8,
};

// ---- Color classification ----
// Code: 0 = background, 1 = cup-red, 2 = ball-yellow, 3 = ball-blue
export function classifyPixel(r, g, b) {
  const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
  if (max < 40) return 0;
  const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
  const d = max - min;
  const v = max / 255;
  const s = d === 0 ? 0 : d / max;
  if (s < 0.30) return 0;
  let h;
  if (d === 0) h = 0;
  else if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;

  const { red, yellow, blue } = CFG;
  // red wraps the 0/360 boundary
  if (s >= red.sMin && v >= red.vMin && (h >= red.hLo || h <= red.hHi)) return 1;
  if (s >= yellow.sMin && v >= yellow.vMin && h >= yellow.hLo && h <= yellow.hHi) return 2;
  if (s >= blue.sMin && v >= blue.vMin && h >= blue.hLo && h <= blue.hHi) return 3;
  return 0;
}

// ---- Mask building ----
// Returns three Uint8Array masks (cup, yellow, blue) packed into one object.
export function buildMasks(imageData, w, h) {
  const data = imageData.data;
  const total = w * h;
  const cup = new Uint8Array(total);
  const yel = new Uint8Array(total);
  const blu = new Uint8Array(total);
  for (let p = 0; p < total; p++) {
    const i = p * 4;
    const c = classifyPixel(data[i], data[i + 1], data[i + 2]);
    if (c === 1) cup[p] = 1;
    else if (c === 2) yel[p] = 1;
    else if (c === 3) blu[p] = 1;
  }
  return { cup, yellow: yel, blue: blu };
}

// ---- Morphology ----
function dilateOnce(src, w, h, dst) {
  dst.fill(0);
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const i = row + x;
      if (
        src[i] || src[i - 1] || src[i + 1] ||
        src[i - w] || src[i + w]
      ) dst[i] = 1;
    }
  }
}
function erodeOnce(src, w, h, dst) {
  dst.fill(0);
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const i = row + x;
      if (
        src[i] && src[i - 1] && src[i + 1] &&
        src[i - w] && src[i + w]
      ) dst[i] = 1;
    }
  }
}
export function morphClose(mask, w, h, iters = 1) {
  const buf = new Uint8Array(mask.length);
  let src = mask, dst = buf;
  for (let i = 0; i < iters; i++) { dilateOnce(src, w, h, dst); [src, dst] = [dst, src]; }
  for (let i = 0; i < iters; i++) { erodeOnce(src, w, h, dst); [src, dst] = [dst, src]; }
  return src;
}
export function morphOpen(mask, w, h, iters = 1) {
  const buf = new Uint8Array(mask.length);
  let src = mask, dst = buf;
  for (let i = 0; i < iters; i++) { erodeOnce(src, w, h, dst); [src, dst] = [dst, src]; }
  for (let i = 0; i < iters; i++) { dilateOnce(src, w, h, dst); [src, dst] = [dst, src]; }
  return src;
}

// ---- Connected components (iterative flood fill) ----
export function findBlobs(mask, w, h) {
  const visited = new Uint8Array(w * h);
  const blobs = [];
  const stack = new Int32Array(w * h * 2);
  let sp = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx0 = y * w + x;
      if (!mask[idx0] || visited[idx0]) continue;
      let area = 0, sumX = 0, sumY = 0;
      let minX = x, maxX = x, minY = y, maxY = y;
      sp = 0;
      stack[sp++] = x; stack[sp++] = y;
      while (sp > 0) {
        const py = stack[--sp];
        const px = stack[--sp];
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const pi = py * w + px;
        if (visited[pi] || !mask[pi]) continue;
        visited[pi] = 1;
        area++;
        sumX += px; sumY += py;
        if (px < minX) minX = px; else if (px > maxX) maxX = px;
        if (py < minY) minY = py; else if (py > maxY) maxY = py;
        stack[sp++] = px - 1; stack[sp++] = py;
        stack[sp++] = px + 1; stack[sp++] = py;
        stack[sp++] = px; stack[sp++] = py - 1;
        stack[sp++] = px; stack[sp++] = py + 1;
      }
      blobs.push({
        cx: sumX / area, cy: sumY / area, area,
        x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1,
      });
    }
  }
  return blobs;
}

// ---- Split a merged blob whose width is much larger than the typical cup ----
// Returns an array of pseudo-blobs covering the same area, evenly spaced.
function splitWideBlob(b, typicalW) {
  const n = Math.max(1, Math.round(b.w / typicalW));
  if (n <= 1) return [b];
  const step = b.w / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = b.x + i * step;
    out.push({
      cx: x + step / 2,
      cy: b.cy,
      area: Math.round(b.area / n),
      x: Math.round(x),
      y: b.y,
      w: Math.round(step),
      h: b.h,
      split: true,
    });
  }
  return out;
}

// ---- Frame detection: cups and ball ----
export function detect(imageData, w, h, opts = {}) {
  const masks = buildMasks(imageData, w, h);
  // Stage spotlights paint thin vertical red streaks above the cups, fusing the
  // entire row of cups into one giant blob. Cropping the cup mask to the cup band
  // breaks those connections.
  const cropTop = Math.floor(CFG.cupCropY * h);
  for (let y = 0; y < cropTop; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) masks.cup[row + x] = 0;
  }
  // Clean up cup mask: open removes thin spotlight remnants, close fills holes.
  const cupMask = morphClose(morphOpen(masks.cup, w, h, 1), w, h, 1);

  let cupBlobs = findBlobs(cupMask, w, h).filter((b) => {
    if (b.area < CFG.cup.minArea || b.area > CFG.cup.maxArea) return false;
    const ar = b.w / b.h;
    if (ar < CFG.cup.minAR || ar > CFG.cup.maxAR) return false;
    if (b.cy < CFG.cupYMin * h || b.cy > CFG.cupYMax * h) return false;
    if (b.cx < CFG.cupXMin * w || b.cx > CFG.cupXMax * w) return false;
    return true;
  });
  // When the caller knows the typical cup width, split overly wide blobs
  // (two cups merged by morphological closing or visual overlap).
  if (opts.typicalCupW && opts.typicalCupW > 0) {
    const split = [];
    for (const b of cupBlobs) split.push(...splitWideBlob(b, opts.typicalCupW * 1.4));
    cupBlobs = split;
  }

  // Ball: take the largest acceptable blob, prefer yellow then blue
  let ball = null;
  for (const [color, src] of [['yellow', masks.yellow], ['blue', masks.blue]]) {
    const cleaned = morphClose(src, w, h, 1);
    const bs = findBlobs(cleaned, w, h).filter((b) => {
      if (b.area < CFG.ball.minArea || b.area > CFG.ball.maxArea) return false;
      const ar = b.w / b.h;
      if (ar < CFG.ball.minAR || ar > CFG.ball.maxAR) return false;
      if (b.cy < CFG.ballYMin * h || b.cy > CFG.ballYMax * h) return false;
      if (b.cx < CFG.ballXMin * w || b.cx > CFG.ballXMax * w) return false;
      return true;
    });
    if (bs.length) {
      bs.sort((a, b) => b.area - a.area);
      const cand = { ...bs[0], color };
      if (!ball || cand.area > ball.area) ball = cand;
    }
  }
  return { cups: cupBlobs, ball, masks };
}

// ---- Centroid tracker (only used during discovery, before the slot tracker takes over)
export class CupTracker {
  constructor() {
    this.cups = []; // {id, cx, cy, vx, vy, w, h, age, missing}
    this.nextId = 0;
    this.frame = 0;
  }

  update(detections) {
    this.frame++;
    const tracks = this.cups;
    for (const t of tracks) {
      t.px = t.cx + t.vx;
      t.py = t.cy + t.vy;
    }

    const N = tracks.length;
    const M = detections.length;
    const pairs = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M; j++) {
        const d = Math.hypot(tracks[i].px - detections[j].cx, tracks[i].py - detections[j].cy);
        pairs.push({ i, j, d });
      }
    }
    pairs.sort((a, b) => a.d - b.d);
    const usedT = new Uint8Array(N);
    const usedD = new Uint8Array(M);
    const assign = new Map();
    for (const { i, j, d } of pairs) {
      if (d > CFG.matchDist) break;
      if (usedT[i] || usedD[j]) continue;
      usedT[i] = 1; usedD[j] = 1;
      assign.set(i, j);
    }
    for (const [i, j] of assign) {
      const t = tracks[i];
      const d = detections[j];
      t.vx = 0.4 * t.vx + 0.6 * (d.cx - t.cx);
      t.vy = 0.4 * t.vy + 0.6 * (d.cy - t.cy);
      t.cx = d.cx; t.cy = d.cy; t.w = d.w; t.h = d.h;
      t.age = (t.age ?? 0) + 1;
      t.missing = 0;
    }
    for (let i = 0; i < N; i++) {
      if (!usedT[i]) {
        tracks[i].missing = (tracks[i].missing ?? 0) + 1;
      }
    }
    for (let j = 0; j < M; j++) {
      if (!usedD[j]) {
        const d = detections[j];
        tracks.push({
          id: this.nextId++,
          cx: d.cx, cy: d.cy, vx: 0, vy: 0, w: d.w, h: d.h,
          age: 1, missing: 0,
        });
      }
    }
    this.cups = tracks.filter((t) => t.missing < CFG.maxMissingFramesUnlocked);
  }

  get(id) { return this.cups.find((c) => c.id === id); }
}

// ---- Slot tracker ----
// The arcade game returns cups to a fixed set of rest positions ("slots").
// Rather than try to track cup identity through the swap motion (where cups
// overlap and become visually indistinguishable), we just watch which slots
// are empty during the motion. Two slots that were both empty during a swap
// window must have been each other's swap partners; we permute the IDs in
// those slots accordingly. The ball ID stays put — only its slot index moves.
export class SlotTracker {
  constructor(slotPositions, slotCupIds, ballSlot, typicalCupW, baselineCy) {
    this.slotPositions = slotPositions.slice();          // x of each slot
    this.slotMap = slotCupIds.slice();                   // cup id at each slot
    this.ballSlot = ballSlot;
    this.typicalCupW = typicalCupW;
    this.baselineCy = baselineCy;
    this.frame = 0;
    this.state = 'stable';
    this.swapStartFrame = 0;
    this.swapEmptyCounts = new Array(slotPositions.length).fill(0);
    this.stableSinceSwap = 0;
    this.stableCount = 0;
    this.swapHistory = [];                               // [{slots, frame}], for debugging
    this.emptyStreak = new Array(slotPositions.length).fill(0);
    // Tolerance for "a cup is at this slot"
    let minSpacing = Infinity;
    const sp = [...slotPositions].sort((a, b) => a - b);
    for (let i = 1; i < sp.length; i++) {
      const d = sp[i] - sp[i - 1];
      if (d < minSpacing) minSpacing = d;
    }
    this.tolerance = Math.min(CFG.slotToleranceMax,
      Math.max(6, minSpacing * CFG.slotToleranceFrac));
    // More generous cy tolerance so a cup sitting slightly low/high still
    // registers as occupying its slot.
    this.cyTolerance = Math.max(20, typicalCupW * 1.0);
    // Don't trust swap detections until the cups have been observed in their
    // slots for a while — covers the moment the hiding cup is still settling
    // back to its slot.
    this.everStable = false;
  }

  // A cup occupies a slot only when it's centred near the slot's x AND its
  // centroid is near the resting floor y — a cup lifted up high during a
  // swap mustn't be counted as still sitting in its slot.
  computeOccupancy(detections) {
    const occ = new Array(this.slotPositions.length).fill(false);
    for (const d of detections) {
      if (Math.abs(d.cy - this.baselineCy) > this.cyTolerance) continue;
      let best = -1, bestDist = Infinity;
      for (let i = 0; i < this.slotPositions.length; i++) {
        const dist = Math.abs(d.cx - this.slotPositions[i]);
        if (dist < bestDist && dist <= this.tolerance) {
          bestDist = dist; best = i;
        }
      }
      if (best >= 0) occ[best] = true;
    }
    return occ;
  }

  applySwap(slots) {
    if (slots.length !== 2) return; // ignore complex permutations
    const [a, b] = slots;
    [this.slotMap[a], this.slotMap[b]] = [this.slotMap[b], this.slotMap[a]];
    if (this.ballSlot === a) this.ballSlot = b;
    else if (this.ballSlot === b) this.ballSlot = a;
    this.swapHistory.push({ slots: [a, b], frame: this.frame });
  }

  update(detections) {
    this.frame++;
    const occupied = this.computeOccupancy(detections);
    const allOccupied = occupied.every((o) => o);

    for (let i = 0; i < occupied.length; i++) {
      if (!occupied[i]) this.emptyStreak[i]++;
      else this.emptyStreak[i] = 0;
    }

    if (this.state === 'stable') {
      if (allOccupied) {
        this.stableCount++;
        if (this.stableCount >= 3) this.everStable = true;
      } else {
        this.stableCount = 0;
      }
      const trulyEmpty = [];
      for (let i = 0; i < this.emptyStreak.length; i++) {
        if (this.emptyStreak[i] >= CFG.slotEmptyMinFrames) trulyEmpty.push(i);
      }
      // A swap requires two slots emptying — a single missed detection on
      // one slot is not enough. Also don't trust this until we've actually
      // seen a stable arrangement at least once.
      if (this.everStable && trulyEmpty.length >= 2) {
        this.state = 'swapping';
        this.swapStartFrame = this.frame;
        this.swapEmptyCounts.fill(0);
        for (const i of trulyEmpty) this.swapEmptyCounts[i] = this.emptyStreak[i];
        this.stableSinceSwap = 0;
        this.stableCount = 0;
      }
    } else { // swapping
      for (let i = 0; i < occupied.length; i++) {
        if (!occupied[i]) this.swapEmptyCounts[i]++;
      }
      if (allOccupied) {
        this.stableSinceSwap++;
        if (this.stableSinceSwap >= CFG.swapCommitFrames) {
          // Pick the slots that were empty for the longest fraction of the
          // motion. This rejects slots that just had a brief detection glitch.
          const totalSwapFrames = this.frame - this.swapStartFrame;
          const minRatio = Math.max(0.35, CFG.slotEmptyMinFrames / Math.max(1, totalSwapFrames));
          const ranked = this.swapEmptyCounts
            .map((c, i) => ({ i, c, ratio: c / Math.max(1, totalSwapFrames) }))
            .filter((e) => e.c >= CFG.slotEmptyMinFrames && e.ratio >= minRatio)
            .sort((a, b) => b.c - a.c);
          // Take the top 2 — the swap involves exactly two slots.
          const slots = ranked.slice(0, 2).map((e) => e.i).sort((a, b) => a - b);
          if (slots.length === 2) this.applySwap(slots);
          this.state = 'stable';
          this.swapEmptyCounts.fill(0);
          this.stableSinceSwap = 0;
          this.stableCount = CFG.swapCommitFrames;
        }
      } else {
        this.stableSinceSwap = 0;
      }
    }

    return {
      occupied,
      emptySlots: occupied.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0),
      state: this.state,
      stableCount: this.stableCount,
      swapEmptyCounts: this.swapEmptyCounts.slice(),
    };
  }

  // For UI: a list of slot boxes
  renderSlots(cupHeight) {
    return this.slotPositions.map((sx, i) => ({
      cx: sx,
      cy: this.baselineCy ?? sx, // baselineCy set by GameTracker
      w: this.typicalCupW,
      h: cupHeight ?? this.typicalCupW,
      slot: i,
      cupId: this.slotMap[i],
      isBall: i === this.ballSlot,
    }));
  }
}

// ---- Game state machine ----
export const PHASES = Object.freeze({
  IDLE: 'idle',
  LOOK_FOR_BALL: 'look_for_ball',
  WATCH_HIDE: 'watch_hide',
  TRACK: 'track',
  DONE: 'done',
});

// median helper for cup geometry
function median(xs) {
  if (!xs.length) return 0;
  const a = [...xs].sort((p, q) => p - q);
  return a[a.length >> 1];
}

export class GameTracker {
  constructor() { this.reset(); }

  reset() {
    this.phase = PHASES.IDLE;
    this.cupTracker = new CupTracker();
    this.slotTracker = null;
    this.ballColor = null;
    this.ballPos = null;
    this.ballCupId = null;
    this.stopCounter = 0;
    this.framesInPhase = 0;
    this.ballHistory = [];
    this.ballStreak = 0;
    this.lastBall = null;
    this.typicalCupW = 0;
    this.typicalCupH = 0;
    this.baselineCy = 0;
    this.lastSlotState = null;
  }

  start() {
    this.reset();
    this.phase = PHASES.LOOK_FOR_BALL;
  }

  // Build the slot tracker from the current centroid tracks plus the ball position.
  _lockSlots(refX) {
    const cups = this.cupTracker.cups
      .filter((c) => c.missing <= 1)
      .sort((a, b) => a.cx - b.cx);
    if (cups.length < 2) return false;

    const slotPositions = cups.map((c) => c.cx);
    const slotMap = cups.map((c) => c.id);

    // Ball slot = the slot whose x is closest to where the ball was hidden
    let ballSlot = 0, bestDist = Infinity;
    for (let i = 0; i < slotPositions.length; i++) {
      const d = Math.abs(slotPositions[i] - refX);
      if (d < bestDist) { bestDist = d; ballSlot = i; }
    }

    this.typicalCupW = median(cups.map((c) => c.w));
    this.typicalCupH = median(cups.map((c) => c.h));
    this.baselineCy = median(cups.map((c) => c.cy));
    this.ballCupId = slotMap[ballSlot];

    this.slotTracker = new SlotTracker(slotPositions, slotMap, ballSlot,
      this.typicalCupW, this.baselineCy);
    return true;
  }

  processFrame(imageData, w, h) {
    if (this.phase === PHASES.DONE) {
      // Freeze: keep showing the locked answer until reset
      const st = this.slotTracker;
      return {
        phase: this.phase,
        slots: st ? st.renderSlots(this.typicalCupH) : [],
        detectedCups: [],
        ball: null,
        ballColor: this.ballColor,
        ballCupId: this.ballCupId,
        ballSlot: st?.ballSlot ?? null,
        slotMap: st ? st.slotMap.slice() : [],
        swapHistory: st ? st.swapHistory.slice() : [],
        stopCounter: this.stopCounter,
        slotState: 'stable',
        frame: this.cupTracker.frame,
      };
    }

    const result = detect(imageData, w, h, {});
    this.framesInPhase++;
    const { ball } = result;
    if (ball) this.lastBall = ball;

    // Update centroid tracker only during discovery; once we've locked slots,
    // it's no longer used for matching, so we can stop feeding it.
    if (this.phase === PHASES.LOOK_FOR_BALL || this.phase === PHASES.WATCH_HIDE) {
      this.cupTracker.update(result.cups);
    }

    if (this.phase === PHASES.LOOK_FOR_BALL) {
      if (ball) {
        if (this.ballColor === null || this.ballColor === ball.color) {
          this.ballColor = ball.color;
          this.ballStreak++;
        } else {
          this.ballColor = ball.color;
          this.ballStreak = 1;
        }
        this.ballPos = { x: ball.cx, y: ball.cy };
        this.ballHistory.push({ x: ball.cx, y: ball.cy });
        if (this.ballHistory.length > 30) this.ballHistory.shift();
        if (this.ballStreak >= CFG.minBallFrames) {
          this.phase = PHASES.WATCH_HIDE;
          this.framesInPhase = 0;
        }
      } else {
        this.ballStreak = Math.max(0, this.ballStreak - 1);
        if (this.ballStreak === 0) this.ballColor = null;
      }
    } else if (this.phase === PHASES.WATCH_HIDE) {
      if (ball && ball.color === this.ballColor) {
        this.ballPos = { x: ball.cx, y: ball.cy };
        this.ballHistory.push({ x: ball.cx, y: ball.cy });
        if (this.ballHistory.length > 30) this.ballHistory.shift();
        this.ballStreak = Math.min(this.ballStreak + 1, 30);
      } else {
        this.ballStreak = Math.max(0, this.ballStreak - 1);
      }
      if (this.ballStreak === 0 && this.ballPos && this.framesInPhase > 3) {
        // Pick the ball slot by where the ball last sat (average of recent positions)
        let sx = 0;
        for (const p of this.ballHistory) sx += p.x;
        const refX = sx / Math.max(1, this.ballHistory.length);
        if (this._lockSlots(refX)) {
          this.phase = PHASES.TRACK;
          this.framesInPhase = 0;
          this.stopCounter = 0;
        }
      }
    } else if (this.phase === PHASES.TRACK) {
      this.lastSlotState = this.slotTracker.update(result.cups);
      // Done = slot tracker has been stable+all-occupied for stopFrames consecutive frames
      if (this.framesInPhase >= CFG.minTrackFrames &&
          this.lastSlotState.state === 'stable' &&
          this.lastSlotState.stableCount >= CFG.stopFrames) {
        this.phase = PHASES.DONE;
      }
      this.stopCounter = this.lastSlotState.stableCount;
    }

    const st = this.slotTracker;
    return {
      phase: this.phase,
      slots: st ? st.renderSlots(this.typicalCupH) : [],
      detectedCups: result.cups,
      ball,
      ballColor: this.ballColor,
      ballCupId: this.ballCupId,
      ballSlot: st?.ballSlot ?? null,
      slotMap: st ? st.slotMap.slice() : [],
      slotState: this.lastSlotState?.state ?? 'idle',
      emptySlots: this.lastSlotState?.emptySlots ?? [],
      swapHistory: st ? st.swapHistory.slice() : [],
      stopCounter: this.stopCounter,
      frame: this.cupTracker.frame,
      // Discovery-phase centroids (still useful before lock for the overlay)
      cups: this.phase === PHASES.TRACK || this.phase === PHASES.DONE
        ? []
        : this.cupTracker.cups,
    };
  }
}
