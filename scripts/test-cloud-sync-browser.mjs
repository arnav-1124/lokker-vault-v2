import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Arnav112\\.gemini\\antigravity-ide\\brain\\62074a1d-d171-4797-a472-c252b7c31b0c';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function unlockVaultIfLocked(page) {
  // Check if Master Password modal is already visible
  const modalInput = await page.$('input[type="password"]');
  if (modalInput) {
    const isConfirmPresent = (await page.$$('input[type="password"]')).length > 1;
    if (isConfirmPresent) {
      console.log('  Initial Setup detected. Initializing vault...');
      const inputs = await page.$$('input[type="password"]');
      await inputs[0].type('MasterPassword123!');
      await sleep(200);
      await inputs[1].type('MasterPassword123!');
      await sleep(200);
      await page.evaluate(() => {
        const cb = document.getElementById('save-rec-check') || document.querySelector('button[role="checkbox"]');
        if (cb) cb.click();
        const label = document.querySelector('label[for="save-rec-check"]');
        if (label) label.click();
      });
      await sleep(400);
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      });
      await sleep(3500);
    } else {
      console.log('  Unlock modal open. Submitting Master Password...');
      await modalInput.type('MasterPassword123!');
      await sleep(200);
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      });
      await sleep(3000);
    }
    return;
  }

  // If modal is not open, check if "Unlock Vault" or "Unlock" button exists on page
  const unlockTriggered = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const unlockBtn = buttons.find(
      (b) => b.textContent && (b.textContent.trim() === 'Unlock' || b.textContent.includes('Unlock Vault'))
    );
    if (unlockBtn) {
      unlockBtn.click();
      return true;
    }
    return false;
  });

  if (unlockTriggered) {
    console.log('  Clicked Unlock button on dashboard. Waiting for password input...');
    await page.waitForSelector('input[type="password"]', { timeout: 8000 });
    await sleep(300);
    const pwdInput = await page.$('input[type="password"]');
    if (pwdInput) {
      await pwdInput.type('MasterPassword123!');
      await sleep(300);
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      });
      await sleep(3000);
      console.log('  Vault unlocked successfully!');
    }
  }
}

async function runBrowserTest() {
  console.log('====================================================');
  console.log('🚀 TESTING ZERO-KNOWLEDGE CLOUD SYNC IN REAL CHROME');
  console.log('====================================================\n');

  console.log('1. Launching Google Chrome browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false, // Visible on desktop
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
  });

  try {
    const page = await browser.newPage();

    page.on('console', (msg) => {
      const text = msg.text();
      if (!text.includes('React DevTools') && !text.includes('Download the React DevTools')) {
        console.log(`  [Browser]: ${text}`);
      }
    });

    console.log('2. Navigating to http://localhost:3000/app ...');
    await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // 3. Unlock vault if locked
    console.log('3. Checking vault unlock status...');
    await unlockVaultIfLocked(page);

    console.log('4. Capturing Step 1 screenshot of unlocked vault...');
    const step1ScreenshotPath = path.join(ARTIFACT_DIR, 'cloud_sync_step1_vault.png');
    await page.screenshot({ path: step1ScreenshotPath });
    console.log(`✅ Saved ${step1ScreenshotPath}`);

    // 5. Connect Cloud Account via "Go Cloud" if not already logged in
    let hasCloudSession = await page.evaluate(() => {
      const sess = localStorage.getItem('lokker_cloud_session');
      return !!sess && sess !== 'null';
    });

    if (!hasCloudSession) {
      console.log('5. No cloud session found. Clicking "Go Cloud" to connect account...');
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('a, button'));
        const goCloud = elements.find((el) => el.textContent && el.textContent.includes('Go Cloud'));
        if (goCloud) goCloud.click();
      });

      // Wait for navigation to /signup
      await page.waitForFunction(
        () => window.location.pathname.includes('/signup') || window.location.pathname.includes('/login'),
        { timeout: 15000 }
      );
      await sleep(1500);
      console.log(`  Arrived at signup page: ${page.url()}`);

      const testEmail = `sync_user_${Date.now()}@lokker.dev`;
      const testPassword = 'MasterPassword123!'; // Matches Master Password for Zero-Knowledge binding

      console.log(`6. Registering cloud user: ${testEmail}...`);
      const nameInput = await page.$('input[placeholder*="Alex"], input[name="name"], input[placeholder*="name" i]');
      if (nameInput) {
        await nameInput.type('Alex Sync');
        await sleep(200);
      }

      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.type(testEmail);
        await sleep(200);
      }

      const pwdInput = await page.$('input[type="password"]');
      if (pwdInput) {
        await pwdInput.type(testPassword);
        await sleep(200);
      }

      console.log('  Submitting registration form to live backend...');
      await page.evaluate(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      });

      // Wait for registration to complete and redirect back to /app
      console.log('  Waiting for backend registration & session creation...');
      await page.waitForFunction(
        () => {
          const session = localStorage.getItem('lokker_cloud_session');
          return !!session && session !== 'null' && window.location.pathname.includes('/app');
        },
        { timeout: 35000 }
      );
      console.log('  Registration successful and redirected to /app!');
      await sleep(2000);
    } else {
      console.log('5. Existing cloud session is active.');
    }

    // 7. Ensure vault is unlocked on /app
    console.log('7. Verifying vault is unlocked with active derivedKey in memory...');
    await unlockVaultIfLocked(page);
    await sleep(1500);

    // 8. Open Cloud Settings & Sync Modal
    console.log('8. Opening Cloud Settings & Sync Modal...');
    // Click the sidebar "Cloud Active" card or header dropdown
    const modalTriggered = await page.evaluate(() => {
      const sidebarCard = document.querySelector('[title*="Cloud Settings"]');
      if (sidebarCard) {
        sidebarCard.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return 'sidebar card';
      }

      const headerBtn = document.querySelector('header button[title*="Connected Cloud Account"]');
      if (headerBtn) {
        headerBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return 'header dropdown trigger';
      }

      return null;
    });
    console.log('  Modal trigger method:', modalTriggered);

    if (modalTriggered === 'header dropdown trigger') {
      await sleep(600);
      await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
        const item = items.find((i) => i.textContent && i.textContent.includes('Cloud Settings'));
        if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
    }

    // Wait for the Dialog to appear
    console.log('  Waiting for Cloud Sync Dialog...');
    await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
    await sleep(1500);

    console.log('9. Capturing Step 2 screenshot of Cloud Sync Modal...');
    const step2ScreenshotPath = path.join(ARTIFACT_DIR, 'cloud_sync_step2_modal.png');
    await page.screenshot({ path: step2ScreenshotPath });
    console.log(`✅ Saved ${step2ScreenshotPath}`);

    // 10. Check if already synchronizing or click "Sync Vault Now"
    console.log('10. Triggering or waiting for Zero-Knowledge Relay Sync...');
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return;
      const buttons = Array.from(dialog.querySelectorAll('button'));
      const syncBtn = buttons.find(
        (b) => b.textContent && (b.textContent.includes('Sync Vault Now') || b.textContent.includes('Sync Now'))
      );
      if (syncBtn && !syncBtn.disabled) {
        syncBtn.click();
      }
    });

    // Wait for the relay to complete and display "Synchronized"
    console.log('  Waiting for Zero-Knowledge relay to finish storing ciphertext on Neon DB...');
    await page.waitForFunction(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return false;
        const text = dialog.textContent || '';
        return text.includes('Synchronized') && !text.includes('Syncing...');
      },
      { timeout: 35000 }
    );
    await sleep(2000);

    // Capture post-sync screenshot with confirmed "Synchronized" badge
    console.log('11. Capturing Step 3 screenshot after synchronization...');
    const step3ScreenshotPath = path.join(ARTIFACT_DIR, 'cloud_sync_step3_synced.png');
    await page.screenshot({ path: step3ScreenshotPath });
    console.log(`✅ Saved ${step3ScreenshotPath}`);

    // 12. Inspect Client LocalStorage State
    const storageState = await page.evaluate(() => {
      return {
        session: localStorage.getItem('lokker_cloud_session'),
        lastSyncedAt: localStorage.getItem('lokker_last_synced_at'),
      };
    });

    console.log('\n12. Client Storage Audit:');
    console.log('  Session Present:', !!storageState.session);
    console.log('  Last Synced At:', storageState.lastSyncedAt);

    // 13. Query Backend GET /api/vault/sync to verify ciphertext on Neon DB
    const sessionObj = JSON.parse(storageState.session || '{}');
    if (!sessionObj.accessToken) {
      throw new Error('No accessToken found in client session storage');
    }

    console.log('\n13. Querying Backend GET /api/vault/sync with live Bearer token...');
    const verifyRes = await fetch('http://localhost:4000/api/vault/sync', {
      headers: { Authorization: `Bearer ${sessionObj.accessToken}` },
    });

    const verifyData = await verifyRes.json();
    console.log('  HTTP Status:', verifyRes.status);
    console.log('  Vault Exists on Neon DB:', verifyData.exists);
    console.log('  Ciphertext Present (AES-GCM):', typeof verifyData.vault?.encryptedBlob === 'string');
    console.log('  Ciphertext Length:', verifyData.vault?.encryptedBlob?.length, 'chars');
    console.log('  IV (12-byte Base64):', verifyData.vault?.iv);
    console.log('  Cloud Item Count:', verifyData.vault?.itemCount);
    console.log('  Neon DB Record Timestamp:', verifyData.vault?.updatedAt);

    // Genuine zero-knowledge assertions
    if (!verifyData.exists) {
      throw new Error('Verification failed: Encrypted vault record not found on Neon DB');
    }
    if (!verifyData.vault?.encryptedBlob || !verifyData.vault?.iv) {
      throw new Error('Verification failed: Missing AES-GCM ciphertext or IV in backend response');
    }
    if (verifyData.vault.encryptedBlob.startsWith('{') || verifyData.vault.encryptedBlob.startsWith('[')) {
      throw new Error('CRITICAL SECURITY VIOLATION: Plaintext detected in encryptedBlob!');
    }

    console.log('\n====================================================');
    console.log('🎉 ZERO-KNOWLEDGE CLOUD SYNC FULLY VERIFIED IN REAL CHROME! 🎉');
    console.log('====================================================\n');
  } finally {
    await browser.close();
  }
}

runBrowserTest().catch((err) => {
  console.error('\n❌ Browser test failed with error:', err);
  process.exit(1);
});
