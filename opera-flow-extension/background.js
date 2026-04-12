// Opera Flow Bridge - background service worker
//
// Architecture note (from reverse engineering):
// - Opera desktop ships a built-in "Opera Touch Background" extension
// - The web UI at web.flow.opera.com communicates with that extension via
//   chrome.runtime.sendMessage(OPERA_EXT_ID, { action: ... })
// - The extension's externally_connectable manifest entry allows web.flow.opera.com to call it
// - Known actions: SEND_FILE, OPEN_FILE (from Guardio Labs CVE-2024 / MyFlaw research)
//
// To fully implement this extension you need to capture the actual API traffic
// from an Opera GX Android device. See REVERSE_ENGINEERING.md for the process.
//
// What we know so far:
//   Transport: HTTPS to Opera backend (web.flow.opera.com / flow.opera.com)
//   Auth: QR-code pairing with one-time token, AES symmetric key exchange
//   File limit: 10 MB, 48h retention
//   No account required

// ---- Message handler for web.flow.opera.com (externally_connectable) ----
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (!sender.url?.startsWith('https://web.flow.opera.com/')) {
    sendResponse({ error: 'Unauthorized origin' });
    return false;
  }

  const { action } = message;
  console.log('[Flow Bridge] External message:', action, message);

  switch (action) {
    case 'SEND_FILE':
      handleSendFile(message, sendResponse);
      return true; // async

    case 'OPEN_FILE':
      handleOpenFile(message, sendResponse);
      return true;

    case 'GET_STATUS':
      handleGetStatus(sendResponse);
      return true;

    default:
      sendResponse({ error: `Unknown action: ${action}` });
      return false;
  }
});

// ---- Stub handlers (fill in once API is captured) ----

async function handleSendFile(message, sendResponse) {
  // TODO: Implement once API endpoints are known from traffic capture.
  // Expected to upload file metadata + content to Opera's backend.
  // message likely contains: { action, fileData, fileName, mimeType, ... }
  console.log('[Flow Bridge] SEND_FILE stub:', message);
  sendResponse({ status: 'ok', stub: true });
}

async function handleOpenFile(message, sendResponse) {
  // TODO: Download a file from Flow storage and trigger a browser download.
  // message likely contains: { action, fileId, fileName, ... }
  console.log('[Flow Bridge] OPEN_FILE stub:', message);
  sendResponse({ status: 'ok', stub: true });
}

async function handleGetStatus(sendResponse) {
  const result = await chrome.storage.local.get(['paired', 'deviceId', 'sessionToken']);
  sendResponse({
    status: result.paired ? 'connected' : 'disconnected',
    deviceId: result.deviceId ?? null,
  });
}

console.log('[Flow Bridge] Service worker started. Extension ID:', chrome.runtime.id);
