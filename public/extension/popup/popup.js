/**
 * Lokker Extension Popup Logic
 * Controls vault lock/unlock status, displays domain matches, and manages popup -> content script autofill triggers.
 */

// App origin comes from ../config.js (loaded before this module in popup.html).
const APP_ORIGIN = (self.LOKKER_EXT_CONFIG && self.LOKKER_EXT_CONFIG.appOrigin) || 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const unlockSection = document.getElementById('unlock-section');
  const unlockedSection = document.getElementById('unlocked-section');
  const masterPasswordInput = document.getElementById('master-password-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const lockBtn = document.getElementById('lock-btn');
  const openVaultBtn = document.getElementById('open-vault-btn');
  const errorMsg = document.getElementById('error-msg');
  const currentDomainEl = document.getElementById('current-domain');
  const credentialsContainer = document.getElementById('credentials-container');
  const noMatchesEl = document.getElementById('no-matches');
  const syncStatus = document.getElementById('sync-status');
  const syncNowBtn = document.getElementById('sync-now-btn');
  const badgeAllToggle = document.getElementById('badge-all-toggle');

  // Get current active tab
  let activeTab = null;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs && tabs[0];
  } catch (e) {}

  const currentUrl = activeTab?.url || '';

  // Check initial lock status
  checkStatus();

  // Badge visibility preference (off by default = only sites with matches)
  chrome.storage.local.get(['badgeAllSites'], (res) => {
    badgeAllToggle.checked = !!res?.badgeAllSites;
  });
  badgeAllToggle.addEventListener('change', () => {
    chrome.storage.local.set({ badgeAllSites: badgeAllToggle.checked });
  });

  function checkStatus() {
    chrome.runtime.sendMessage({ action: 'GET_LOCK_STATUS' }, (res) => {
      if (res && res.isUnlocked) {
        setUnlockedUI();
        loadMatchingCredentials();
      } else {
        setLockedUI(res?.hasVaultData);
        // If no vault data, try to trigger a sync from the Lokker web app tab
        if (!res?.hasVaultData) {
          requestSyncFromLokkerTab();
        }
      }
    });
  }

  function setSyncStatus(state, text) {
    syncStatus.className = 'sync-status' + (state ? ' ' + state : '');
    syncStatus.textContent = text;
  }

  function requestSyncFromLokkerTab(done) {
    setSyncStatus(null, 'Looking for an open Lokker Web Vault tab…');
    // Try to find an open Lokker web app tab and request a sync
    chrome.tabs.query(
      {
        url: [
          '*://localhost:*/*',
          '*://127.0.0.1:*/*',
          '*://0.0.0.0:*/*',
          'https://*.e2b.app/*',
          'https://*.vercel.app/*',
          'https://*.space-z.ai/*',
          'https://lokker.*/*',
          'https://*.lokker.*/*',
        ],
      },
      (tabs) => {
        if (tabs && tabs.length > 0) {
          let pending = tabs.length;
          for (const tab of tabs) {
            // Use executeScript to inject a window.postMessage call into the page
            // so the content script's window.addEventListener('message') picks it up
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                func: () => {
                  window.postMessage({ type: 'LOKKER_REQUEST_VAULT_SYNC' }, '*');
                },
              },
              () => {
                pending -= 1;
                if (pending <= 0) {
                  setSyncStatus(null, 'Sync requested — verifying…');
                  // After requesting sync, retry status check after a delay
                  setTimeout(() => {
                    checkStatus();
                    if (done) done();
                  }, 2000);
                }
              }
            );
          }
        } else {
          setSyncStatus(
            'disconnected',
            'Not connected. Open your Lokker Web Vault tab once (and unlock it) so the extension can sync your vault.'
          );
          if (done) done();
        }
      }
    );
  }

  syncNowBtn.addEventListener('click', () => {
    syncNowBtn.disabled = true;
    requestSyncFromLokkerTab(() => {
      syncNowBtn.disabled = false;
    });
  });

  function setLockedUI(hasVaultData = true) {
    statusBadge.className = 'status-badge locked';
    statusText.textContent = 'Locked';
    unlockSection.classList.remove('hidden');
    unlockedSection.classList.add('hidden');
    lockBtn.classList.add('hidden');
    if (!hasVaultData) {
      errorMsg.textContent = 'Vault data not synced yet. Open your Lokker Web Vault tab and unlock it first, then try again.';
      setSyncStatus('disconnected', 'Not connected to the Web Vault yet. Open and unlock the web vault once, then press "Sync Now".');
    } else {
      errorMsg.textContent = '';
      setSyncStatus('connected', 'Connected to Web Vault. Enter your master password to unlock.');
    }
  }

  function setUnlockedUI() {
    statusBadge.className = 'status-badge unlocked';
    statusText.textContent = 'Unlocked';
    unlockSection.classList.add('hidden');
    unlockedSection.classList.remove('hidden');
    lockBtn.classList.remove('hidden');
  }

  unlockBtn.addEventListener('click', () => {
    const pwd = masterPasswordInput.value.trim();
    if (!pwd) {
      errorMsg.textContent = 'Please enter your Master Password.';
      return;
    }

    errorMsg.textContent = 'Unlocking...';

    chrome.runtime.sendMessage(
      { action: 'UNLOCK_VAULT', payload: { masterPassword: pwd } },
      (res) => {
        if (res && res.success) {
          masterPasswordInput.value = '';
          setUnlockedUI();
          loadMatchingCredentials();
        } else {
          errorMsg.textContent = res?.error || 'Invalid Master Password.';
        }
      }
    );
  });

  masterPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') unlockBtn.click();
  });

  lockBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'LOCK_VAULT' }, () => {
      setLockedUI();
    });
  });

  openVaultBtn.addEventListener('click', () => {
    chrome.tabs.query(
      {
        url: [
          '*://localhost:*/*',
          '*://127.0.0.1:*/*',
          '*://0.0.0.0:*/*',
          'https://*.e2b.app/*',
          'https://*.vercel.app/*',
          'https://*.space-z.ai/*',
          'https://lokker.*/*',
          'https://*.lokker.*/*',
        ],
      },
      (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { active: true });
        } else {
          chrome.tabs.create({ url: APP_ORIGIN + '/app' });
        }
      }
    );
  });

  function loadMatchingCredentials() {
    currentDomainEl.textContent = 'Loading...';
    credentialsContainer.innerHTML = '';
    noMatchesEl.classList.add('hidden');

    chrome.runtime.sendMessage(
      { action: 'GET_MATCHING_CREDENTIALS', payload: { url: currentUrl } },
      (res) => {
        if (!res || !res.isUnlocked) {
          setLockedUI();
          return;
        }

        currentDomainEl.textContent = res.domain || 'Unknown Domain';

        if (!res.matches || res.matches.length === 0) {
          noMatchesEl.classList.remove('hidden');
          return;
        }

        res.matches.forEach((item) => {
          const card = document.createElement('div');
          card.className = 'credential-card';
          card.innerHTML = `
            <div class="cred-title">${escapeHtml(item.websiteName)}</div>
            <div class="cred-user">${escapeHtml(item.username)}</div>
            <button class="btn btn-autofill" data-id="${item.id}">
              <span>⚡</span> Autofill Credentials
            </button>
          `;

          const btn = card.querySelector('.btn-autofill');
          btn.addEventListener('click', () => {
            triggerAutofillInTab(item.id);
          });

          credentialsContainer.appendChild(card);
        });
      }
    );
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function triggerAutofillInTab(credentialId) {
    if (!activeTab || !activeTab.id) {
      alert('Cannot trigger autofill: No active browser tab.');
      return;
    }

    chrome.runtime.sendMessage(
      {
        action: 'AUTHORIZE_AUTOFILL',
        payload: { id: credentialId, url: currentUrl },
      },
      (res) => {
        if (res && res.success && res.credential) {
          sendAutofillMessageToTab(activeTab.id, res.credential);
        } else {
          alert(res?.error || 'Autofill authorization failed.');
        }
      }
    );
  }

  function sendAutofillMessageToTab(tabId, credential) {
    chrome.tabs.sendMessage(
      tabId,
      { action: 'EXECUTE_AUTOFILL', credential },
      async (res) => {
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          if (
            currentUrl.startsWith('http://') ||
            currentUrl.startsWith('https://') ||
            currentUrl.startsWith('file://')
          ) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId },
                files: [
                  'content/field-detector.js',
                  'content/autofill.js',
                  'content/content-script.js',
                ],
              });

              setTimeout(() => {
                chrome.tabs.sendMessage(
                  tabId,
                  { action: 'EXECUTE_AUTOFILL', credential },
                  (res2) => {
                    if (chrome.runtime.lastError || (res2 && !res2.success)) {
                      alert(res2?.error || 'Autofill could not locate login fields on target tab.');
                    } else {
                      window.close();
                    }
                  }
                );
              }, 100);
              return;
            } catch (e) {
              alert('Could not inject content script into target tab: ' + e.message);
              return;
            }
          } else {
            alert('Autofill is not supported on restricted browser pages (chrome:// or extension://).');
            return;
          }
        }

        if (res && res.success) {
          window.close();
        } else if (res && !res.success) {
          alert(res.error || 'Autofill could not locate login fields on target page.');
        } else {
          window.close();
        }
      }
    );
  }
});
