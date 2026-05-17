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
  // Tracker
  matchDist: 90,
  matchDistLocked: 110,    // permissive distance when fixed-N tracker is locked
  maxMissingFramesUnlocked: 8,
  // Phase 1: ball must persist for N frames before we accept it
  minBallFrames: 3,
  // Stop detection
  stopMoveThreshold: 1.8,  // px/frame mean |velocity| to count as moving
  stopFrames: 30,          // ~1s @ 30fps
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

// ---- Multi-object cup tracker ----
// Two modes:
//   unlocked: free to add / drop tracks (used while discovering cups)
//   locked: number of tracks is fixed; missing detections become extrapolations
export class CupTracker {
  constructor() {
    this.cups = []; // {id, cx, cy, vx, vy, w, h, age, missing}
    this.nextId = 0;
    this.frame = 0;
    this.locked = false;
  }

  lock() { this.locked = true; }

  update(detections) {
    this.frame++;
    const tracks = this.cups;
    for (const t of tracks) {
      t.px = t.cx + t.vx;
      t.py = t.cy + t.vy;
    }

    const N = tracks.length;
    const M = detections.length;
    const maxDist = this.locked ? CFG.matchDistLocked : CFG.matchDist;
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
      if (d > maxDist) break;
      if (usedT[i] || usedD[j]) continue;
      usedT[i] = 1; usedD[j] = 1;
      assign.set(i, j);
    }

    // Update matched
    for (const [i, j] of assign) {
      const t = tracks[i];
      const d = detections[j];
      const nvx = d.cx - t.cx;
      const nvy = d.cy - t.cy;
      t.vx = 0.4 * t.vx + 0.6 * nvx;
      t.vy = 0.4 * t.vy + 0.6 * nvy;
      t.cx = d.cx; t.cy = d.cy;
      t.w = d.w; t.h = d.h;
      t.age = (t.age ?? 0) + 1;
      t.missing = 0;
    }
    // Unmatched tracks: short-step extrapolation with strong velocity damping
    // so a missed detection never throws a ghost track across the frame.
    const maxStep = 4;
    for (let i = 0; i < N; i++) {
      if (!usedT[i]) {
        const t = tracks[i];
        let dx = t.vx, dy = t.vy;
        if (dx > maxStep) dx = maxStep; else if (dx < -maxStep) dx = -maxStep;
        if (dy > maxStep) dy = maxStep; else if (dy < -maxStep) dy = -maxStep;
        t.cx += dx;
        t.cy += dy;
        t.vx *= 0.3;
        t.vy *= 0.3;
        t.missing = (t.missing ?? 0) + 1;
      }
    }
    if (!this.locked) {
      // Spawn new tracks for unmatched detections
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
    // When locked: never add or drop tracks
  }

  meanSpeed() {
    if (!this.cups.length) return 0;
    let s = 0;
    for (const c of this.cups) s += Math.hypot(c.vx, c.vy);
    return s / this.cups.length;
  }

  get(id) { return this.cups.find((c) => c.id === id); }
}

// ---- Game state machine ----
export const PHASES = Object.freeze({
  IDLE: 'idle',
  LOOK_FOR_BALL: 'look_for_ball',
  WATCH_HIDE: 'watch_hide',
  TRACK: 'track',
  DONE: 'done',
});

export class GameTracker {
  constructor() { this.reset(); }

  reset() {
    this.phase = PHASES.IDLE;
    this.cupTracker = new CupTracker();
    this.ballColor = null;
    this.ballPos = null;
    this.ballCupId = null;
    this.stopCounter = 0;
    this.framesInPhase = 0;
    this.ballHistory = [];
    this.ballStreak = 0;
    this.trackFrames = 0;
    this.lastBall = null;
    this.typicalCupW = 0;
    this.baselineCups = []; // [{cx, cy}] sorted left-to-right at lock time
  }

  start() {
    this.reset();
    this.phase = PHASES.LOOK_FOR_BALL;
  }

  processFrame(imageData, w, h) {
    // Once we've reached DONE, freeze the tracker so the highlighted answer
    // doesn't drift as the user lifts the phone or the game animates.
    if (this.phase === PHASES.DONE) {
      return {
        phase: this.phase,
        cups: this.cupTracker.cups,
        detectedCups: [],
        ball: null,
        ballColor: this.ballColor,
        ballCupId: this.ballCupId,
        ballPos: this.ballPos,
        stopCounter: this.stopCounter,
        meanSpeed: 0,
        frame: this.cupTracker.frame,
        locked: true,
      };
    }
    const result = detect(imageData, w, h, {
      typicalCupW: this.typicalCupW,
    });
    this.cupTracker.update(result.cups);
    this.framesInPhase++;

    const { ball } = result;
    if (ball) this.lastBall = ball;

    if (this.phase === PHASES.LOOK_FOR_BALL) {
      // Require a few consecutive frames of the same colored ball
      if (ball) {
        if (this.ballColor === null) {
          this.ballColor = ball.color;
          this.ballStreak = 1;
        } else if (this.ballColor === ball.color) {
          this.ballStreak++;
        } else {
          // Different color seen; bias toward the larger one, reset streak
          this.ballColor = ball.color;
          this.ballStreak = 1;
        }
        this.ballPos = { x: ball.cx, y: ball.cy };
        this.ballHistory.push({ x: ball.cx, y: ball.cy, f: this.cupTracker.frame });
        if (this.ballHistory.length > 30) this.ballHistory.shift();

        if (this.ballStreak >= CFG.minBallFrames) {
          this.phase = PHASES.WATCH_HIDE;
          this.framesInPhase = 0;
        }
      } else {
        // Decay streak when we miss
        this.ballStreak = Math.max(0, this.ballStreak - 1);
        if (this.ballStreak === 0) this.ballColor = null;
      }
    } else if (this.phase === PHASES.WATCH_HIDE) {
      if (ball && ball.color === this.ballColor) {
        this.ballPos = { x: ball.cx, y: ball.cy };
        this.ballHistory.push({ x: ball.cx, y: ball.cy, f: this.cupTracker.frame });
        if (this.ballHistory.length > 30) this.ballHistory.shift();
        this.ballStreak = Math.min(this.ballStreak + 1, 30);
      } else {
        // Ball not seen this frame
        this.ballStreak = Math.max(0, this.ballStreak - 1);
      }
      // Once the ball has been gone for several frames, identify the ball cup
      if (this.ballStreak === 0 && this.ballPos && this.framesInPhase > 3) {
        // Use a centroid of the recent ball positions
        let sx = 0, sy = 0;
        for (const p of this.ballHistory) { sx += p.x; sy += p.y; }
        const refX = sx / Math.max(1, this.ballHistory.length);
        const refY = sy / Math.max(1, this.ballHistory.length);
        let best = null;
        let bestScore = Infinity;
        for (const c of this.cupTracker.cups) {
          if (c.missing > 2) continue;
          const dx = Math.abs(c.cx - refX);
          // Prefer cup whose x-center is close; tolerate cup being above the ball
          const score = dx + 0.1 * Math.max(0, c.cy - refY);
          if (score < bestScore) { bestScore = score; best = c; }
        }
        if (best && Math.abs(best.cx - refX) < 50) {
          this.ballCupId = best.id;
          // Record typical cup geometry from live tracks for split-wide-blob
          const widths = this.cupTracker.cups.filter((c) => c.missing <= 1).map((c) => c.w);
          if (widths.length) {
            widths.sort((a, b) => a - b);
            this.typicalCupW = widths[Math.floor(widths.length / 2)];
          }
          this.baselineCups = [...this.cupTracker.cups]
            .filter((c) => c.missing <= 1)
            .sort((a, b) => a.cx - b.cx)
            .map((c) => ({ id: c.id, cx: c.cx, cy: c.cy }));
          this.cupTracker.lock();
          this.phase = PHASES.TRACK;
          this.framesInPhase = 0;
          this.trackFrames = 0;
          this.stopCounter = 0;
        }
      }
    } else if (this.phase === PHASES.TRACK) {
      this.trackFrames++;
      const ms = this.cupTracker.meanSpeed();
      if (this.trackFrames >= CFG.minTrackFrames && ms < CFG.stopMoveThreshold) {
        this.stopCounter++;
        if (this.stopCounter >= CFG.stopFrames) {
          this.phase = PHASES.DONE;
        }
      } else {
        this.stopCounter = 0;
      }
    }

    return {
      phase: this.phase,
      cups: this.cupTracker.cups,
      detectedCups: result.cups,
      ball,
      ballColor: this.ballColor,
      ballCupId: this.ballCupId,
      ballPos: this.ballPos,
      stopCounter: this.stopCounter,
      meanSpeed: this.cupTracker.meanSpeed(),
      frame: this.cupTracker.frame,
      locked: this.cupTracker.locked,
    };
  }
}
