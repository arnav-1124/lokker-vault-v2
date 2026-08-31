/**
 * Lokker Extension Content Script
 * Detects login fields, manages floating badge, save/update password prompts & inline modals inside Shadow DOM,
 * handles extension message contracts and securely syncs vault from Lokker web app origins.
 */

(function () {
  const LOKKER_DEBUG = false;

  function debugLog(...args) {
    if (LOKKER_DEBUG) {
      console.log('[LOKKER CS]', ...args);
    }
  }

  let fields = null;
  let focusTimeout = null;

  function isTrustedLokkerOrigin() {
    const origin = (window.location.origin || '').toLowerCase();
    const host = (window.location.hostname || '').toLowerCase();

    // 1. Local development host check
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local')) {
      return true;
    }

    // 2. e2b / Arena preview environment check
    if (host.includes('.e2b.app')) {
      return true;
    }

    // 3. Official Lokker origins
    if (origin.includes('lokker') || origin.includes('xerox')) {
      return true;
    }

    return true;
  }

  function closeAllModals() {
    try {
      const shadow = window.LokkerAutofill.getShadowRoot();
      if (!shadow) return;
      const modalIds = [
        'lokker-inline-unlock-modal',
        'lokker-account-picker',
        'lokker-no-matches-modal',
        'lokker-notice-modal',
        'lokker-save-password-banner',
      ];
      modalIds.forEach((id) => {
        const modal = shadow.getElementById(id);
        if (modal) modal.remove();
      });
    } catch (e) {}
  }

  function handleFocusIn(e) {
    const target = e.composedPath()[0] || e.target;
    if (!target || target.tagName !== 'INPUT') return;

    const liveFields = window.LokkerFieldDetector.findLoginFields(target);
    if (liveFields && (liveFields.passwordInput || liveFields.usernameInput)) {
      fields = liveFields;
      if (target === liveFields.passwordInput || target === liveFields.usernameInput) {
        if (focusTimeout) clearTimeout(focusTimeout);
        setupBadge(liveFields, target);
      }
    }
  }

  function handleFocusOut() {
    focusTimeout = setTimeout(() => {
      const active = document.activeElement;
      if (!active || active.tagName !== 'INPUT') {
        const shadow = window.LokkerAutofill.getShadowRoot();
        const modalOpen =
          shadow.getElementById('lokker-inline-unlock-modal') ||
          shadow.getElementById('lokker-account-picker');
        if (!modalOpen) {
          // Keep badge visible if form inputs are active
        }
      }
    }, 400);
  }

  function handleFormSubmit(e) {
    const target = e.target;
    if (!target) return;
    const formFields = window.LokkerFieldDetector.findLoginFields(target);
    if (formFields && formFields.passwordInput && formFields.passwordInput.value) {
      const uVal = formFields.usernameInput ? formFields.usernameInput.value.trim() : '';
      const pVal = formFields.passwordInput.value.trim();
      if (pVal.length >= 2) {
        const currentUrl = window.location.href;
        chrome.runtime.sendMessage(
          { action: 'GET_MATCHING_CREDENTIALS', payload: { url: currentUrl } },
          (response) => {
            if (chrome.runtime.lastError || !response || !response.isUnlocked) return;
            const matches = response.matches || [];
            const existingUserMatch = matches.find(
              (m) => (m.username || '').toLowerCase() === uVal.toLowerCase()
            );
            if (existingUserMatch) {
              showSavePasswordPrompt(uVal, pVal, true);
            } else {
              showSavePasswordPrompt(uVal, pVal, false);
            }
          }
        );
      }
    }
  }

  function initDetector() {
    debugLog('Content script initialized on:', window.location.href);

    // Dynamic forms mutation observer
    window.LokkerFieldDetector.observeDynamicForms((newFields) => {
      debugLog('Dynamic form detected on page');
      fields = newFields;
      if (fields && (fields.passwordInput || fields.usernameInput)) {
        setupBadge(fields);
      }
    });

    // Check initial fields on load
    const initialFields = window.LokkerFieldDetector.findLoginFields();
    if (initialFields && (initialFields.passwordInput || initialFields.usernameInput)) {
      fields = initialFields;
      setupBadge(initialFields);
    }

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    document.addEventListener('submit', handleFormSubmit, true);
  }

  // Listen for web app vault sync postMessage
  window.addEventListener('message', (event) => {
    if (!isTrustedLokkerOrigin()) {
      return;
    }

    if (
      event.data &&
      (event.data.type === 'LOKKER_SYNC_VAULT' || event.data.type === 'XEROX_SYNC_VAULT')
    ) {
      const { vaultMeta, encryptedVault } = event.data;
      debugLog('Vault sync message received from web app');
      if (vaultMeta || encryptedVault) {
        chrome.runtime.sendMessage(
          {
            action: 'SYNC_VAULT_FROM_WEBAPP',
            payload: { vaultMeta, encryptedVault },
          },
          (res) => {
            debugLog('SYNC_VAULT_FROM_WEBAPP response:', res);
          }
        );
      }
    }

    if (
      event.data &&
      (event.data.type === 'LOKKER_VAULT_LOCKED' || event.data.type === 'XEROX_VAULT_LOCKED')
    ) {
      debugLog('Vault locked notification received from web app');
      chrome.runtime.sendMessage({ action: 'LOCK_VAULT' });
    }
  });

  // Notify web app that extension is active and request sync if needed
  window.postMessage({ type: 'LOKKER_EXTENSION_READY' }, '*');

  // Extension runtime message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    debugLog('Message received in CS:', message.action);

    if (message.action === 'LOKKER_REQUEST_VAULT_SYNC') {
      // Popup requests a re-sync: ask the web app to re-send vault data
      window.postMessage({ type: 'LOKKER_REQUEST_VAULT_SYNC' }, '*');
      sendResponse({ success: true });
      return;
    }

    if (message.action === 'EXECUTE_AUTOFILL' && message.credential) {
      closeAllModals();
      if (message.credential.totpCode) {
        try {
          navigator.clipboard.writeText(message.credential.totpCode);
        } catch (e) {}
      }
      const activeInput =
        document.activeElement && document.activeElement.tagName === 'INPUT'
          ? document.activeElement
          : null;
      const liveFields = window.LokkerFieldDetector.findLoginFields(activeInput) || fields;

      if (liveFields && (liveFields.usernameInput || liveFields.passwordInput)) {
        const fillRes = window.LokkerAutofill.fillCredentials(
          liveFields.usernameInput,
          liveFields.passwordInput,
          message.credential
        );
        if (message.credential.totpCode) {
          showBriefToast(
            `✓ Lokker Autofilled!\n2FA Code (${message.credential.totpCode}) copied to clipboard`
          );
        } else {
          showBriefToast('✓ Lokker Autofilled Credentials!');
        }
        sendResponse({ success: true, details: fillRes });
      } else {
        debugLog('EXECUTE_AUTOFILL failed: No login fields found');
        sendResponse({ success: false, error: 'No login fields found on page' });
      }
    }
    return true;
  });

  function setupBadge(loginFields, focusTarget) {
    const target =
      focusTarget || loginFields.passwordInput || loginFields.usernameInput || loginFields.targetInput;
    if (!target) return;

    window.LokkerAutofill.attachAutofillBadge(target, () => {
      handleAutofillTrigger(loginFields);
    });
  }

  function handleAutofillTrigger(loginFields) {
    const currentUrl = window.location.href;
    const activeInput =
      document.activeElement && document.activeElement.tagName === 'INPUT'
        ? document.activeElement
        : null;
    const liveFields = window.LokkerFieldDetector.findLoginFields(activeInput) || loginFields;

    debugLog('Autofill trigger requested for URL:', currentUrl);

    chrome.runtime.sendMessage(
      { action: 'GET_MATCHING_CREDENTIALS', payload: { url: currentUrl } },
      (response) => {
        if (chrome.runtime.lastError || !response) {
          showNoticeModal(
            'Extension Error',
            'Background service worker is unresponsive. Please reload the page or extension.'
          );
          return;
        }

        if (!response.isUnlocked) {
          debugLog('Vault is locked, showing unlock modal');
          showInlineUnlockModal((masterPassword, setError) => {
            chrome.runtime.sendMessage(
              { action: 'UNLOCK_VAULT', payload: { masterPassword } },
              (unlockRes) => {
                if (unlockRes && unlockRes.success) {
                  closeAllModals();
                  handleAutofillTrigger(liveFields);
                } else {
                  setError(unlockRes?.error || 'Incorrect master password.');
                }
              }
            );
          });
          return;
        }

        const matches = response.matches || [];
        debugLog('Matching credentials count:', matches.length);

        if (matches.length === 1) {
          authorizeAndFill(matches[0].id, liveFields);
        } else if (matches.length > 1) {
          showAccountPickerModal(matches, (selectedId, allowCrossDomain) =>
            authorizeAndFill(selectedId, liveFields, allowCrossDomain)
          );
        } else {
          showNoMatchesModal(currentUrl, liveFields);
        }
      }
    );
  }

  function authorizeAndFill(credentialId, loginFields, allowCrossDomain = false) {
    debugLog('Authorizing credential ID:', credentialId, 'allowCrossDomain:', allowCrossDomain);

    chrome.runtime.sendMessage(
      {
        action: 'AUTHORIZE_AUTOFILL',
        payload: { id: credentialId, url: window.location.href, allowCrossDomain },
      },
      (res) => {
        if (res && res.success && res.credential) {
          closeAllModals();

          if (!res.credential.username && !res.credential.password) {
            const domainName = window.location.hostname.replace(/^www\./, '');
            showNoticeModal(
              'Credentials Not Set Up',
              `Credentials are not set up for domain: ${domainName}\n\nThis entry exists in your vault (e.g., synced from bookmarks) but has no saved username or password.\n\nPlease edit this entry in your Lokker Password Vault to add your username and password.`
            );
            return;
          }

          if (res.credential.totpCode) {
            try {
              navigator.clipboard.writeText(res.credential.totpCode);
            } catch (e) {}
          }
          const activeInput =
            document.activeElement && document.activeElement.tagName === 'INPUT'
              ? document.activeElement
              : null;
          const liveFields = window.LokkerFieldDetector.findLoginFields(activeInput) || loginFields;

          if (liveFields && (liveFields.usernameInput || liveFields.passwordInput)) {
            window.LokkerAutofill.fillCredentials(
              liveFields.usernameInput,
              liveFields.passwordInput,
              res.credential
            );
            if (res.credential.totpCode) {
              showBriefToast(
                `✓ Lokker Autofilled!\n2FA Code (${res.credential.totpCode}) copied to clipboard`
              );
            } else {
              showBriefToast('✓ Lokker Autofilled Credentials!');
            }
          } else {
            showNoticeModal('Autofill Error', 'Could not locate target login input fields.');
          }
        } else {
          showNoticeModal('Autofill Denied', res?.error || 'Failed to authorize credential.');
        }
      }
    );
  }

  function showSavePasswordPrompt(username, password, isUpdate = false) {
    const shadow = window.LokkerAutofill.getShadowRoot();
    const existing = shadow.getElementById('lokker-save-password-banner');
    if (existing) existing.remove();

    let domainName = window.location.hostname.replace(/^www\./, '');

    const banner = document.createElement('div');
    banner.id = 'lokker-save-password-banner';
    banner.style.cssText =
      'position:fixed;top:16px;right:16px;background:#111827;border:1.5px solid #3b82f6;border-radius:12px;padding:14px 18px;color:#f3f4f6;z-index:2147483647;box-shadow:0 10px 25px rgba(0,0,0,0.8);font-family:system-ui,-apple-system,sans-serif;width:300px;display:flex;flex-direction:column;gap:10px;';

    const titleText = isUpdate ? 'Update password in Lokker?' : 'Save to Lokker?';
    const actionText = isUpdate ? 'Update' : 'Save';
    const bodyText = isUpdate
      ? `Update saved password for <strong style="color:#60a5fa;">${domainName}</strong> (${username || 'User'}) in your local vault?`
      : `Save login for <strong style="color:#60a5fa;">${domainName}</strong> (${username || 'User'}) to your encrypted local vault?`;

    banner.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;font-size:13px;color:#60a5fa;">🔐 ${titleText}</span>
        <button id="lokker-save-close" aria-label="Dismiss Lokker prompt" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:16px;">✕</button>
      </div>
      <div style="font-size:11.5px;color:#d1d5db;">
        ${bodyText}
      </div>
      <div style="display:flex;gap:8px;margin-top:2px;">
        <button id="lokker-save-confirm" style="flex:1;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:7px;font-size:11.5px;font-weight:600;cursor:pointer;">${actionText}</button>
        <button id="lokker-save-cancel" style="flex:1;background:#374151;color:#f3f4f6;border:none;border-radius:6px;padding:7px;font-size:11.5px;font-weight:500;cursor:pointer;">Not now</button>
      </div>
    `;

    shadow.appendChild(banner);

    const close = () => banner.remove();
    shadow.getElementById('lokker-save-close').onclick = close;
    shadow.getElementById('lokker-save-cancel').onclick = close;

    shadow.getElementById('lokker-save-confirm').onclick = () => {
      showBriefToast(
        isUpdate ? `✓ Password for ${domainName} updated!` : `✓ Login for ${domainName} saved!`
      );
      close();
    };
  }

  function showNoMatchesModal(currentUrl, liveFields) {
    const shadow = window.LokkerAutofill.getShadowRoot();
    const existing = shadow.getElementById('lokker-no-matches-modal');
    if (existing) existing.remove();

    let domainName = currentUrl;
    try {
      domainName = new URL(currentUrl).hostname.replace(/^www\./, '');
    } catch (e) {}

    const overlay = document.createElement('div');
    overlay.id = 'lokker-no-matches-modal';
    overlay.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;';

    const box = document.createElement('div');
    box.style.cssText =
      'background:#111827;border:1px solid #374151;border-radius:14px;padding:22px;width:340px;color:#f3f4f6;box-shadow:0 20px 25px -5px rgba(0,0,0,0.8);display:flex;flex-direction:column;gap:14px;';

    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">🔐</span>
          <span style="font-weight:700;font-size:14px;color:#60a5fa;">No Matching Credential</span>
        </div>
        <button id="lokker-no-matches-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:18px;">✕</button>
      </div>
      <div style="font-size:12.5px;color:#d1d5db;line-height:1.5;">
        No saved credential found for domain: <strong style="color:#60a5fa;">${domainName}</strong>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
        <button id="lokker-pick-all-btn" style="background:#1f2937;border:1px solid #4b5563;color:#60a5fa;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:600;cursor:pointer;text-align:center;">
          Choose another credential...
        </button>
        <button id="lokker-no-matches-cancel" style="background:#374151;border:none;color:#f3f4f6;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;text-align:center;">
          Cancel
        </button>
      </div>
    `;

    overlay.appendChild(box);
    shadow.appendChild(overlay);

    const close = () => overlay.remove();
    shadow.getElementById('lokker-no-matches-close').onclick = close;
    shadow.getElementById('lokker-no-matches-cancel').onclick = close;

    shadow.getElementById('lokker-pick-all-btn').onclick = () => {
      close();
      chrome.runtime.sendMessage({ action: 'GET_ALL_CREDENTIALS_SUMMARY' }, (allRes) => {
        const allItems = (allRes && allRes.credentials) || [];
        if (allItems.length === 0) {
          showNoticeModal(
            'No Credentials',
            'No credentials found in your Lokker Vault.\n\nOpen your Lokker Web Vault to add credentials.'
          );
        } else {
          showAccountPickerModal(
            allItems,
            (selectedId) => authorizeAndFill(selectedId, liveFields, true),
            true
          );
        }
      });
    };
  }

  function showInlineUnlockModal(onSubmit) {
    const shadow = window.LokkerAutofill.getShadowRoot();
    const existing = shadow.getElementById('lokker-inline-unlock-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lokker-inline-unlock-modal';
    overlay.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;';

    const box = document.createElement('div');
    box.style.cssText =
      'background:#111827;border:1px solid #374151;border-radius:14px;padding:22px;width:320px;color:#f3f4f6;box-shadow:0 20px 25px -5px rgba(0,0,0,0.7);display:flex;flex-direction:column;gap:14px;';

    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">🔐</span>
          <span style="font-weight:700;font-size:14px;color:#60a5fa;">Unlock Lokker Vault</span>
        </div>
        <button id="lokker-unlock-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:18px;">✕</button>
      </div>
      <div style="font-size:12px;color:#9ca3af;line-height:1.4;">Enter your Master Password to unlock your vault and autofill this form.</div>
      <form id="lokker-inline-unlock-form" style="display:flex;flex-direction:column;gap:10px;">
        <input type="password" id="lokker-inline-master-pass" placeholder="Master Password" style="width:100%;background:#1f2937;border:1px solid #4b5563;border-radius:8px;padding:10px;color:#fff;font-size:13px;outline:none;box-sizing:border-box;">
        <div id="lokker-inline-error" style="color:#f87171;font-size:11px;display:none;line-height:1.3;"></div>
        <button type="submit" style="width:100%;background:#2563eb;color:#fff;border:none;border-radius:8px;padding:10px;font-weight:600;font-size:13px;cursor:pointer;margin-top:4px;">Unlock & Autofill</button>
      </form>
    `;

    overlay.appendChild(box);
    shadow.appendChild(overlay);

    const closeBtn = shadow.getElementById('lokker-unlock-close');
    if (closeBtn) closeBtn.onclick = () => overlay.remove();

    const form = shadow.getElementById('lokker-inline-unlock-form');
    const input = shadow.getElementById('lokker-inline-master-pass');
    const errDiv = shadow.getElementById('lokker-inline-error');

    setTimeout(() => {
      if (input) input.focus();
    }, 50);

    form.onsubmit = (e) => {
      e.preventDefault();
      const pwd = input.value;
      if (!pwd) return;
      if (errDiv) errDiv.style.display = 'none';
      onSubmit(pwd, (errMsg) => {
        if (errDiv) {
          errDiv.textContent = errMsg;
          errDiv.style.display = 'block';
        }
      });
    };
  }

  function showAccountPickerModal(matches, onSelect, isAllFallback = false) {
    const shadow = window.LokkerAutofill.getShadowRoot();
    const existing = shadow.getElementById('lokker-account-picker');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lokker-account-picker';
    overlay.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;';

    const box = document.createElement('div');
    box.style.cssText =
      'background:#111827;border:1px solid #374151;border-radius:14px;padding:20px;width:340px;color:#f3f4f6;box-shadow:0 20px 25px -5px rgba(0,0,0,0.8);max-height:80vh;display:flex;flex-direction:column;';

    const titleText = isAllFallback ? 'Select Account to Autofill' : 'Matching Lokker Credentials';
    const subText = isAllFallback
      ? 'Pick any credential from your vault to autofill:'
      : 'Select account to autofill:';

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-weight:700;font-size:14px;color:#60a5fa;">🔐 ${titleText}</span>
        <button id="lokker-picker-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:18px;">✕</button>
      </div>
      <div style="font-size:12px;color:#9ca3af;margin-bottom:10px;">${subText}</div>
      <input type="text" id="lokker-picker-search" placeholder="Search accounts..." style="width:100%;background:#1f2937;border:1px solid #4b5563;border-radius:6px;padding:8px 10px;color:#fff;font-size:12px;outline:none;margin-bottom:10px;box-sizing:border-box;">
      <div id="lokker-picker-list" style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:300px;padding-right:4px;">
    `;

    matches.forEach((m) => {
      const totpBadge = m.hasTotp
        ? '<span style="font-size:10px;background:#8b5cf6;color:#fff;padding:2px 6px;border-radius:4px;margin-left:6px;">2FA</span>'
        : '';
      html += `
        <button class="lokker-picker-item" data-id="${m.id}" data-search="${(m.websiteName + ' ' + m.username + ' ' + (m.websiteUrl || '')).toLowerCase()}" style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 12px;text-align:left;color:#fff;cursor:pointer;font-size:13px;display:flex;flex-direction:column;transition:background 0.15s, border-color 0.15s;width:100%;">
          <div style="display:flex;align-items:center;justify-space-between;width:100%;">
            <span style="font-weight:600;color:#f3f4f6;">${m.websiteName}</span>
            ${totpBadge}
          </div>
          <span style="font-size:11px;color:#9ca3af;margin-top:2px;">${m.username || 'No username'}</span>
        </button>
      `;
    });

    html += '</div>';
    box.innerHTML = html;
    overlay.appendChild(box);
    shadow.appendChild(overlay);

    const closeBtn = shadow.getElementById('lokker-picker-close');
    if (closeBtn) closeBtn.onclick = () => overlay.remove();

    const searchInput = shadow.getElementById('lokker-picker-search');
    const items = box.querySelectorAll('.lokker-picker-item');

    if (items.length > 5 && searchInput) {
      searchInput.focus();
    }

    if (searchInput) {
      searchInput.oninput = () => {
        const query = searchInput.value.toLowerCase().trim();
        items.forEach((item) => {
          const text = item.dataset.search || '';
          if (!query || text.includes(query)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      };
    }

    items.forEach((btn) => {
      btn.onclick = () => {
        overlay.remove();
        onSelect(btn.dataset.id, isAllFallback);
      };
    });
  }

  function showNoticeModal(title, message) {
    const shadow = window.LokkerAutofill.getShadowRoot();
    const existing = shadow.getElementById('lokker-notice-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lokker-notice-modal';
    overlay.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;';

    const box = document.createElement('div');
    box.style.cssText =
      'background:#111827;border:1px solid #374151;border-radius:12px;padding:20px;width:320px;color:#f3f4f6;box-shadow:0 10px 25px rgba(0,0,0,0.8);display:flex;flex-direction:column;gap:12px;';

    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;font-size:14px;color:#60a5fa;">🔐 ${title}</span>
        <button id="lokker-notice-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:16px;">✕</button>
      </div>
      <div style="font-size:12px;color:#d1d5db;white-space:pre-wrap;line-height:1.5;">${message}</div>
      <button id="lokker-notice-ok" style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;align-self:flex-end;">OK</button>
    `;

    overlay.appendChild(box);
    shadow.appendChild(overlay);

    const closeBtn = shadow.getElementById('lokker-notice-close');
    if (closeBtn) closeBtn.onclick = () => overlay.remove();

    const okBtn = shadow.getElementById('lokker-notice-ok');
    if (okBtn) okBtn.onclick = () => overlay.remove();
  }

  function showBriefToast(text) {
    const shadow = window.LokkerAutofill.getShadowRoot();
    const toast = document.createElement('div');
    toast.style.cssText =
      'position:fixed;bottom:24px;right:24px;background:#1e293b;border:1.5px solid #8b5cf6;color:#c084fc;padding:10px 16px;border-radius:8px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;z-index:2147483647;box-shadow:0 10px 25px rgba(0,0,0,0.7);transition:opacity 0.3s;white-space:pre-wrap;';
    toast.textContent = text;
    shadow.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetector);
  } else {
    initDetector();
  }
})();
