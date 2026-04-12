# Opera Flow Reverse Engineering Notes

## What we know

### Architecture
- **Transport**: HTTPS relay through Opera's servers (`web.flow.opera.com`, `flow.opera.com`)
- **Not P2P**: all files pass through Opera's infrastructure (AES-encrypted, auto-deleted after 48h, 10 MB limit)
- **No account required**: authentication is purely device-pairing-based

### Pairing flow
1. Desktop browser navigates to `opera.com/connect` (or opens Flow sidebar)
2. A one-time QR code is displayed containing a pairing token
3. Mobile (Opera GX Android) scans the QR code
4. A 6-digit confirmation code appears on both devices
5. User confirms on both → shared AES key is exchanged (only once, never transmitted in plaintext again)

### Desktop extension
Opera ships a built-in extension called **"Opera Touch Background"** that:
- Is hidden from the extensions management page and cannot be disabled
- Has `externally_connectable` entry allowing `https://web.flow.opera.com/*` to send it messages
- Exposes at least two message actions:
  - `SEND_FILE` — uploads a file to Flow storage
  - `OPEN_FILE` — retrieves/opens a file from Flow storage
- (Source: Guardio Labs "MyFlaw" CVE research, Jan 2024)

The web UI at `web.flow.opera.com` calls the extension with:
```js
chrome.runtime.sendMessage(OPERA_EXTENSION_ID, { action: 'SEND_FILE', ... }, callback)
```

### What's still unknown (needs traffic capture)
- Exact REST API endpoints (upload/download/poll URLs)
- Authentication headers and token format
- Request/response JSON schema
- Pairing handshake protocol details
- The real Opera Touch Background extension ID

---

## How to capture the missing API details

### Option A: mitmproxy on desktop (recommended)

1. Install [mitmproxy](https://mitmproxy.org/) on your machine
2. Launch Opera desktop through the proxy:
   ```
   opera --proxy-server="http://127.0.0.1:8080"
   ```
3. Install mitmproxy's CA cert in Opera (Settings → Privacy & security → Manage certificates)
4. Open Opera's Flow panel and send a file from Opera GX Android
5. Inspect the captured HTTPS traffic in mitmproxy's web UI (`http://localhost:8081`)
6. Look for requests to `flow.opera.com` or `web.flow.opera.com`

### Option B: Android traffic capture

1. Root your Android device or use an emulator
2. Install mitmproxy CA cert as a system cert
3. Configure WiFi proxy to point at your machine running mitmproxy
4. Use Opera GX Android's Flow feature and capture the requests

### Option C: Read the web UI JS

The web page at `https://web.flow.opera.com` contains the JavaScript that calls both the
extension and the backend API. Open it in Opera's DevTools and read the source:
1. Open Opera → go to `https://web.flow.opera.com`
2. F12 → Sources → look for the main bundle JS
3. Search for `SEND_FILE`, `OPEN_FILE`, `fetch(`, `XMLHttpRequest`, or `opera.com`

### What to capture

For each of these actions, capture the full request and response:
- [ ] Pairing initiation (QR code generation)
- [ ] Pairing confirmation (6-digit code exchange)
- [ ] File upload (SEND_FILE)
- [ ] File polling/notification (how does desktop know a file arrived?)
- [ ] File download (OPEN_FILE)
- [ ] Session token refresh

---

## Chrome/Edge extension approach

Once the API is known, the `opera-flow-extension/` directory in this repo contains the
skeleton of a Chrome/Edge extension that:
1. Registers as a service worker
2. Declares `externally_connectable` for `web.flow.opera.com` (so the Flow web UI can talk to it)
3. Handles `SEND_FILE` and `OPEN_FILE` messages

**Verified**: the extension loads and runs correctly in Chrome (tested with
Google Chrome for Testing 146.0.7680.153 / puppeteer). Extension gets ID
`fdplncafihgnpjllkgbpfokocakmlhah` when loaded as an unpacked extension.

**Remaining blocker**: the Flow web UI at `web.flow.opera.com` targets the *real*
Opera Touch Background extension ID, not ours. Two paths forward:

1. **Override the extension ID** — pack the extension with the same key Opera uses
   (requires extracting Opera's private key from its installation, not feasible)

2. **Intercept at the web UI level** — inject a content script into
   `web.flow.opera.com` that patches `chrome.runtime.sendMessage` to redirect
   calls to our extension's ID. This is more practical.

3. **Implement the full backend API directly** — skip the web UI entirely and
   implement a standalone desktop client that talks to Opera's backend directly,
   triggered by OS-level notifications or a polling loop.

---

## References

- [Guardio Labs "MyFlaw" research (Jan 2024)](https://guard.io/labs/myflaw-cross-platform-0-day-rce-vulnerability-discovered-in-operas-browsers)
- [XSS in My Flow to RCE (2021)](https://medium.com/@renwa/stored-xss-in-my-flow-to-rce-in-opera-browser-2-51ccb2eae988)
- [Opera Flow security blog post](https://blogs.opera.com/security/2018/08/flow-seamless-secure-security-features-explained/)
- [Opera Help: My Flow](https://help.opera.com/en/touch/my-flow/)
