const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const pairBtn = document.getElementById('pairBtn');

function log(msg) {
  logEl.textContent += msg + '\n';
  logEl.scrollTop = logEl.scrollHeight;
}

// Ask the background worker for pairing status
chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (resp) => {
  if (chrome.runtime.lastError) {
    statusEl.textContent = 'Error: ' + chrome.runtime.lastError.message;
    return;
  }
  if (resp?.status === 'connected') {
    statusEl.textContent = 'Connected (device: ' + resp.deviceId + ')';
    statusEl.classList.add('connected');
  } else {
    statusEl.textContent = 'Not paired';
  }
});

pairBtn.addEventListener('click', () => {
  log('TODO: open web.flow.opera.com pairing page...');
  // Once the API is understood, this should open the pairing flow
  chrome.tabs.create({ url: 'https://web.flow.opera.com' });
});
