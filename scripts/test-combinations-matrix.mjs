/**
 * Comprehensive Real-Time Browser Verification Suite for Lokker Vault
 * Tests:
 * 1. Category Creation & Nesting Depth:
 *    - Development -> Nest 1 (Level 1)
 *    - Development -> Nest 1 -> Nest 2 (Level 2)
 * 2. Visual Presence on Screen in Sidebar
 * 3. Combinations Matrix (Local vs Cloud x Root vs Subcategories):
 *    - Credential + Root Category ("Development") + Save to Local
 *    - Credential + Root Category ("Development") + Save to Cloud
 *    - Credential + Subcategory Level 1 ("Nest 1") + Save to Local
 *    - Credential + Subcategory Level 1 ("Nest 1") + Save to Cloud
 *    - Credential + Subcategory Level 2 ("Nest 2") + Save to Local
 *    - Credential + Subcategory Level 2 ("Nest 2") + Save to Cloud
 * 4. Bookmarks Matrix:
 *    - Bookmark in Subcategory Level 1 ("Nest 1") + Save to Local
 *    - Bookmark in Subcategory Level 2 ("Nest 2") + Save to Cloud
 * 5. Subtree Category Filtering (Parent includes all descendants, Leaf includes only leaf)
 * 6. Cloud Isolation & Zero Data Leakage (Logging out hides cloud credentials instantly)
 */

import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMatrix() {
  console.log('=== STARTING REAL-TIME BROWSER COMBINATIONS TEST ===\n');

  if (!existsSync(CHROME_PATH)) {
    throw new Error(`Chrome not found at ${CHROME_PATH}`);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const results = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('[BROWSER CONSOLE ERROR]', msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.log('[BROWSER UNCAUGHT ERROR]', err.message);
  });

  async function fillInput(selector, value) {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(selector, value);
  }

  async function ensureVaultUnlocked() {
    const isUnlockModal = await page.evaluate(() => !!document.querySelector('#unlock-pass'));
    if (isUnlockModal) {
      console.log('Unlocking vault with master password...');
      await page.type('#unlock-pass', 'MasterPass123!');
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Unlock Vault'));
        if (btn) btn.click();
      });
      await sleep(1500);
    }
  }

  async function navigateToPasswords() {
    await ensureVaultUnlocked();
    const isAlreadyAtPasswords = await page.evaluate(() => window.location.pathname === '/app/passwords');
    if (!isAlreadyAtPasswords) {
      await page.evaluate(() => {
        const link = document.querySelector('aside a[href="/app/passwords"]');
        if (link) link.click();
      });
      await page.waitForFunction(() => window.location.pathname === '/app/passwords', { timeout: 5000 });
      await sleep(500);
    }
    await ensureVaultUnlocked();
  }

  async function navigateToBookmarks() {
    await ensureVaultUnlocked();
    const isAlreadyAtBookmarks = await page.evaluate(() => window.location.pathname === '/app/bookmarks');
    if (!isAlreadyAtBookmarks) {
      await page.evaluate(() => {
        const link = document.querySelector('aside a[href="/app/bookmarks"]');
        if (link) link.click();
      });
      await page.waitForFunction(() => window.location.pathname === '/app/bookmarks', { timeout: 5000 });
      await sleep(500);
    }
    await ensureVaultUnlocked();
  }

  async function openAddPasswordModal() {
    await ensureVaultUnlocked();
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Add Password') || b.textContent?.includes('Add New Entry'));
      if (btn) btn.click();
    });
    await sleep(300);
    await ensureVaultUnlocked();
    await page.waitForSelector('#item-title', { timeout: 6000 });
    await sleep(300);
  }

  async function openAddBookmarkModal() {
    await ensureVaultUnlocked();
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Add Bookmark') || b.textContent?.includes('Add First Bookmark'));
      if (btn) btn.click();
    });
    await sleep(300);
    await ensureVaultUnlocked();
    await page.waitForSelector('#bm-title', { timeout: 6000 });
    await sleep(300);
  }

  async function saveCredential({ title, user, pass, categoryName, scope }) {
    await openAddPasswordModal();

    await fillInput('#item-title', title);
    await fillInput('#item-user', user);
    await fillInput('#item-pass', pass);

    // Select category
    await page.click('#item-cat');
    await sleep(300);
    await page.evaluate((cat) => {
      const items = Array.from(document.querySelectorAll('[data-slot="select-item"]'));
      const item = items.find(i => i.textContent?.includes(cat));
      if (item) item.click();
    }, categoryName);
    await sleep(300);

    if (scope === 'cloud') {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Save to Cloud'));
        if (btn) btn.click();
      });
    } else {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Save Locally'));
        if (btn) btn.click();
      });
      await sleep(400);
      await page.evaluate(() => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
        const warnDialog = dialogs.find(d => d.textContent?.includes('Save to Local Device Only?'));
        if (warnDialog) {
          const btn = Array.from(warnDialog.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Save Locally');
          if (btn) btn.click();
        }
      });
    }

    await sleep(600);
    await page.waitForFunction(() => !document.querySelector('#item-title'), { timeout: 5000 });
    await sleep(300);
  }

  async function saveBookmarkItem({ title, url, categoryName, scope }) {
    await openAddBookmarkModal();

    await fillInput('#bm-title', title);
    await fillInput('#bm-url', url);

    // Select category
    await page.click('#bm-cat');
    await sleep(300);
    await page.evaluate((cat) => {
      const items = Array.from(document.querySelectorAll('[data-slot="select-item"]'));
      const item = items.find(i => i.textContent?.includes(cat));
      if (item) item.click();
    }, categoryName);
    await sleep(300);

    if (scope === 'cloud') {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Save to Cloud'));
        if (btn) btn.click();
      });
    } else {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Save Locally'));
        if (btn) btn.click();
      });
      await sleep(400);
      await page.evaluate(() => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
        const warnDialog = dialogs.find(d => d.textContent?.includes('Save to Local Device Only?'));
        if (warnDialog) {
          const btn = Array.from(warnDialog.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Save Locally');
          if (btn) btn.click();
        }
      });
    }

    await sleep(600);
    await page.waitForFunction(() => !document.querySelector('#bm-title'), { timeout: 5000 });
    await sleep(300);
  }

  try {
    // ----------------------------------------------------
    // STEP 1: Navigate to App & Setup Local Vault Fresh
    // ----------------------------------------------------
    console.log('\n--- STEP 1: Initializing Vault Fresh ---');
    await page.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('#setup-pass', { timeout: 10000 });

    console.log('Setting up master password...');
    await page.type('#setup-pass', 'MasterPass123!');
    await page.type('#confirm-pass', 'MasterPass123!');
    await page.click('#save-rec-check');
    await sleep(300);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Initialize Encrypted Vault'));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => !document.querySelector('#setup-pass'), { timeout: 8000 });
    await sleep(1000);

    const isUnlocked = await page.evaluate(() => !document.querySelector('#setup-pass') && !document.querySelector('#unlock-pass'));
    console.log('Vault unlocked & ready:', isUnlocked);

    // ----------------------------------------------------
    // STEP 2: Create Subcategory Level 1: "Nest 1" below "Development"
    // ----------------------------------------------------
    console.log('\n--- STEP 2: Creating "Nest 1" under "Development" ---');
    await page.waitForSelector('button[title="Manage Categories"]', { timeout: 5000 });
    await page.click('button[title="Manage Categories"]');
    await page.waitForSelector('#cat-name', { timeout: 5000 });
    await fillInput('#cat-name', 'Nest 1');

    // Select Parent Category "Development"
    await page.click('#cat-parent');
    await sleep(300);
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-slot="select-item"]'));
      const devItem = items.find(i => i.textContent?.includes('Development'));
      if (devItem) devItem.click();
    });
    await sleep(300);

    // Click Add Category & Done
    await page.click('#btn-add-category');
    await sleep(500);
    await page.click('#btn-done-category');
    await sleep(600);

    // ----------------------------------------------------
    // STEP 3: Create Subcategory Level 2: "Nest 2" below "Nest 1"
    // ----------------------------------------------------
    console.log('\n--- STEP 3: Creating "Nest 2" below "Nest 1" ---');
    await page.waitForSelector('button[title="Manage Categories"]', { timeout: 5000 });
    await page.click('button[title="Manage Categories"]');

    await page.waitForSelector('#cat-name', { timeout: 5000 });
    await fillInput('#cat-name', 'Nest 2');

    // Select Parent Category "Nest 1"
    await page.click('#cat-parent');
    await sleep(300);
    const parentSelected = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-slot="select-item"]'));
      const nest1Item = items.find(i => i.textContent?.includes('Nest 1'));
      if (nest1Item) {
        nest1Item.click();
        return true;
      }
      return false;
    });
    console.log('Selected Nest 1 as parent:', parentSelected);
    await sleep(300);

    // Click Add Category & Done
    await page.click('#btn-add-category');
    await sleep(500);
    await page.click('#btn-done-category');
    await sleep(800);

    // ----------------------------------------------------
    // STEP 4: Verify Both "Nest 1" and "Nest 2" Appear On Screen
    // ----------------------------------------------------
    console.log('\n--- STEP 4: Inspecting Sidebar Categories on Screen ---');
    const categoriesOnScreen = await page.evaluate(() => {
      const catElements = Array.from(document.querySelectorAll('aside [data-category-name], aside button'));
      return catElements.map(el => el.textContent?.trim()).filter(Boolean);
    });
    console.log('Rendered categories in sidebar:', categoriesOnScreen);

    const hasNest1 = categoriesOnScreen.some(text => text.includes('Nest 1'));
    const hasNest2 = categoriesOnScreen.some(text => text.includes('Nest 2'));
    console.log('Nest 1 on screen in sidebar:', hasNest1);
    console.log('Nest 2 on screen in sidebar (below Nest 1):', hasNest2);

    results.push({
      test: 'Create category below Nest 1 (Depth 2: Development -> Nest 1 -> Nest 2)',
      result: (hasNest1 && hasNest2) ? 'PASSED' : 'FAILED',
      notes: `Nest 1 visible: ${hasNest1}, Nest 2 visible: ${hasNest2}`
    });

    // ----------------------------------------------------
    // STEP 5: Initialize Cloud Session for Scope Testing
    // ----------------------------------------------------
    console.log('\n--- STEP 5: Setting up Cloud Account Session ---');
    await page.evaluate(() => {
      const user = {
        id: 'usr_test_matrix_runner',
        email: 'matrix.tester@lokker.dev',
        role: 'USER',
        accessToken: 'mock-test-access-token'
      };
      localStorage.setItem('lokker_cloud_session', JSON.stringify(user));
      window.dispatchEvent(new Event('lokker_cloud_auth_change'));
      window.dispatchEvent(new Event('storage'));
    });
    await sleep(600);

    const hasCloudSession = await page.evaluate(() => {
      return !!localStorage.getItem('lokker_cloud_session');
    });
    console.log('Cloud session active in browser:', hasCloudSession);

    // Navigate to Passwords Page
    await navigateToPasswords();

    // ----------------------------------------------------
    // STEP 6: Combination 1 - Credential + Root Category ("Development") + Save to Local
    // ----------------------------------------------------
    console.log('\n--- STEP 6: Credential in Development (Root) -> Save to Local ---');
    await saveCredential({
      title: 'Local Dev Tool',
      user: 'dev_local_user',
      pass: 'DevPassLocal123!',
      categoryName: 'Development',
      scope: 'local'
    });

    const comb1Pass = await page.evaluate((expectedTitle) => {
      const cards = Array.from(document.querySelectorAll('[data-testid="credential-row"]'));
      const card = cards.find(c => c.getAttribute('data-credential-title') === expectedTitle);
      if (!card) return false;
      const hasLocalBadge = card.textContent?.includes('Local Only');
      const hasCategoryPill = card.textContent?.includes('Development');
      return hasLocalBadge && hasCategoryPill;
    }, 'Local Dev Tool');
    console.log('Combination 1 (Local + Root Dev):', comb1Pass);
    results.push({
      test: 'Credential in Root Category (Development) -> Save to Local',
      result: comb1Pass ? 'PASSED' : 'FAILED',
      notes: 'Item displays with "Local Only" badge and "Development" category pill.'
    });

    // ----------------------------------------------------
    // STEP 7: Combination 2 - Credential + Root Category ("Development") + Save to Cloud
    // ----------------------------------------------------
    console.log('\n--- STEP 7: Credential in Development (Root) -> Save to Cloud ---');
    await saveCredential({
      title: 'Cloud Dev API',
      user: 'dev_cloud_user',
      pass: 'DevPassCloud123!',
      categoryName: 'Development',
      scope: 'cloud'
    });

    const comb2Pass = await page.evaluate((expectedTitle) => {
      const cards = Array.from(document.querySelectorAll('[data-testid="credential-row"]'));
      const card = cards.find(c => c.getAttribute('data-credential-title') === expectedTitle);
      if (!card) return false;
      const hasCloudBadge = card.textContent?.includes('Cloud');
      const hasCategoryPill = card.textContent?.includes('Development');
      return hasCloudBadge && hasCategoryPill;
    }, 'Cloud Dev API');
    console.log('Combination 2 (Cloud + Root Dev):', comb2Pass);
    results.push({
      test: 'Credential in Root Category (Development) -> Save to Cloud',
      result: comb2Pass ? 'PASSED' : 'FAILED',
      notes: 'Item displays with "Cloud" badge and "Development" category pill.'
    });

    // ----------------------------------------------------
    // STEP 8: Combination 3 - Credential in Subcategory 1 ("Nest 1") + Save to Local
    // ----------------------------------------------------
    console.log('\n--- STEP 8: Credential in Subcategory 1 (Nest 1) -> Save to Local ---');
    await saveCredential({
      title: 'Nest 1 Local Service',
      user: 'nest1_local_user',
      pass: 'Nest1LocalPass!',
      categoryName: 'Nest 1',
      scope: 'local'
    });

    const comb3Pass = await page.evaluate((expectedTitle) => {
      const cards = Array.from(document.querySelectorAll('[data-testid="credential-row"]'));
      const card = cards.find(c => c.getAttribute('data-credential-title') === expectedTitle);
      if (!card) return false;
      const hasLocalBadge = card.textContent?.includes('Local Only');
      const hasPath = card.textContent?.includes('Development › Nest 1');
      return hasLocalBadge && hasPath;
    }, 'Nest 1 Local Service');
    console.log('Combination 3 (Local + Subcategory 1 Nest 1):', comb3Pass);
    results.push({
      test: 'Credential in Subcategory 1 (Nest 1) -> Save to Local',
      result: comb3Pass ? 'PASSED' : 'FAILED',
      notes: 'Item displays with "Local Only" badge and full path "Development › Nest 1".'
    });

    // ----------------------------------------------------
    // STEP 9: Combination 4 - Credential in Subcategory 1 ("Nest 1") + Save to Cloud
    // ----------------------------------------------------
    console.log('\n--- STEP 9: Credential in Subcategory 1 (Nest 1) -> Save to Cloud ---');
    await saveCredential({
      title: 'Nest 1 Cloud Backend',
      user: 'nest1_cloud_user',
      pass: 'Nest1CloudPass!',
      categoryName: 'Nest 1',
      scope: 'cloud'
    });

    const comb4Pass = await page.evaluate((expectedTitle) => {
      const cards = Array.from(document.querySelectorAll('[data-testid="credential-row"]'));
      const card = cards.find(c => c.getAttribute('data-credential-title') === expectedTitle);
      if (!card) return false;
      const hasCloudBadge = card.textContent?.includes('Cloud');
      const hasPath = card.textContent?.includes('Development › Nest 1');
      return hasCloudBadge && hasPath;
    }, 'Nest 1 Cloud Backend');
    console.log('Combination 4 (Cloud + Subcategory 1 Nest 1):', comb4Pass);
    results.push({
      test: 'Credential in Subcategory 1 (Nest 1) -> Save to Cloud',
      result: comb4Pass ? 'PASSED' : 'FAILED',
      notes: 'Item displays with "Cloud" badge and full path "Development › Nest 1".'
    });

    // ----------------------------------------------------
    // STEP 10: Combination 5 - Credential in Subcategory 2 ("Nest 2") + Save to Local
    // ----------------------------------------------------
    console.log('\n--- STEP 10: Credential in Subcategory 2 (Nest 2) -> Save to Local ---');
    await saveCredential({
      title: 'Nest 2 Deep Secret',
      user: 'nest2_local_user',
      pass: 'Nest2SecretPass!',
      categoryName: 'Nest 2',
      scope: 'local'
    });

    const comb5Pass = await page.evaluate((expectedTitle) => {
      const cards = Array.from(document.querySelectorAll('[data-testid="credential-row"]'));
      const card = cards.find(c => c.getAttribute('data-credential-title') === expectedTitle);
      if (!card) return false;
      const hasLocalBadge = card.textContent?.includes('Local Only');
      const hasPath = card.textContent?.includes('Development › Nest 1 › Nest 2');
      return hasLocalBadge && hasPath;
    }, 'Nest 2 Deep Secret');
    console.log('Combination 5 (Local + Subcategory 2 Nest 2):', comb5Pass);
    results.push({
      test: 'Credential in Subcategory 2 (Nest 2) -> Save to Local',
      result: comb5Pass ? 'PASSED' : 'FAILED',
      notes: 'Item displays with "Local Only" badge and 3-level path "Development › Nest 1 › Nest 2".'
    });

    // ----------------------------------------------------
    // STEP 11: Combination 6 - Credential in Subcategory 2 ("Nest 2") + Save to Cloud
    // ----------------------------------------------------
    console.log('\n--- STEP 11: Credential in Subcategory 2 (Nest 2) -> Save to Cloud ---');
    await saveCredential({
      title: 'Nest 2 Deep Cloud DB',
      user: 'nest2_cloud_user',
      pass: 'Nest2CloudSecret!',
      categoryName: 'Nest 2',
      scope: 'cloud'
    });

    const comb6Pass = await page.evaluate((expectedTitle) => {
      const cards = Array.from(document.querySelectorAll('[data-testid="credential-row"]'));
      const card = cards.find(c => c.getAttribute('data-credential-title') === expectedTitle);
      if (!card) return false;
      const hasCloudBadge = card.textContent?.includes('Cloud');
      const hasPath = card.textContent?.includes('Development › Nest 1 › Nest 2');
      return hasCloudBadge && hasPath;
    }, 'Nest 2 Deep Cloud DB');
    console.log('Combination 6 (Cloud + Subcategory 2 Nest 2):', comb6Pass);
    results.push({
      test: 'Credential in Subcategory 2 (Nest 2) -> Save to Cloud',
      result: comb6Pass ? 'PASSED' : 'FAILED',
      notes: 'Item displays with "Cloud" badge and 3-level path "Development › Nest 1 › Nest 2".'
    });

    // ----------------------------------------------------
    // STEP 12: Combination 7 - Bookmarks: Save to Local in Nest 1
    // ----------------------------------------------------
    console.log('\n--- STEP 12: Bookmarks in Nest 1 -> Save to Local ---');
    await navigateToBookmarks();

    await saveBookmarkItem({
      title: 'React Dev Docs',
      url: 'https://react.dev',
      categoryName: 'Nest 1',
      scope: 'local'
    });

    const comb7Pass = await page.evaluate((expectedTitle) => {
      const cards = Array.from(document.querySelectorAll('[data-testid="bookmark-row"]'));
      const card = cards.find(c => c.getAttribute('data-bookmark-title') === expectedTitle);
      if (!card) return false;
      const hasLocalBadge = card.textContent?.includes('Local Only');
      const hasPath = card.textContent?.includes('Development › Nest 1');
      return hasLocalBadge && hasPath;
    }, 'React Dev Docs');
    console.log('Combination 7 (Bookmark Local in Nest 1):', comb7Pass);
    results.push({
      test: 'Bookmark in Subcategory 1 (Nest 1) -> Save to Local',
      result: comb7Pass ? 'PASSED' : 'FAILED',
      notes: 'Bookmark displays with "Local Only" badge and "Development › Nest 1" path.'
    });

    // ----------------------------------------------------
    // STEP 13: Combination 8 - Bookmarks: Save to Cloud in Nest 2
    // ----------------------------------------------------
    console.log('\n--- STEP 13: Bookmarks in Nest 2 -> Save to Cloud ---');
    await saveBookmarkItem({
      title: 'Next.js Turbopack Docs',
      url: 'https://nextjs.org/docs',
      categoryName: 'Nest 2',
      scope: 'cloud'
    });

    const comb8Pass = await page.evaluate((expectedTitle) => {
      const cards = Array.from(document.querySelectorAll('[data-testid="bookmark-row"]'));
      const card = cards.find(c => c.getAttribute('data-bookmark-title') === expectedTitle);
      if (!card) return false;
      const hasCloudBadge = card.textContent?.includes('Cloud');
      const hasPath = card.textContent?.includes('Development › Nest 1 › Nest 2');
      return hasCloudBadge && hasPath;
    }, 'Next.js Turbopack Docs');
    console.log('Combination 8 (Bookmark Cloud in Nest 2):', comb8Pass);
    results.push({
      test: 'Bookmark in Subcategory 2 (Nest 2) -> Save to Cloud',
      result: comb8Pass ? 'PASSED' : 'FAILED',
      notes: 'Bookmark displays with "Cloud" badge and "Development › Nest 1 › Nest 2" path.'
    });

    // ----------------------------------------------------
    // STEP 14: Subtree Filtering Verification
    // ----------------------------------------------------
    console.log('\n--- STEP 14: Subtree Filtering Verification ---');
    await navigateToPasswords();

    // Click "Nest 2" category in sidebar
    await page.waitForSelector('button[data-category-name="Nest 2"]');
    await page.click('button[data-category-name="Nest 2"]');
    await sleep(600);

    const itemsUnderNest2 = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid="credential-row"]'));
      return cards.map(c => c.getAttribute('data-credential-title')).filter(Boolean);
    });
    console.log('Items shown when selecting "Nest 2":', itemsUnderNest2);
    const filterNest2Pass = itemsUnderNest2.includes('Nest 2 Deep Secret') &&
                            itemsUnderNest2.includes('Nest 2 Deep Cloud DB') &&
                            !itemsUnderNest2.includes('Local Dev Tool') &&
                            !itemsUnderNest2.includes('Nest 1 Local Service');

    // Click "Development" root category in sidebar
    await page.waitForSelector('button[data-category-name="Development"]');
    await page.click('button[data-category-name="Development"]');
    await sleep(600);

    const itemsUnderDev = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid="credential-row"]'));
      return cards.map(c => c.getAttribute('data-credential-title')).filter(Boolean);
    });
    console.log('Items shown when selecting "Development" (subtree):', itemsUnderDev);
    const filterDevPass = itemsUnderDev.includes('Local Dev Tool') &&
                          itemsUnderDev.includes('Cloud Dev API') &&
                          itemsUnderDev.includes('Nest 1 Local Service') &&
                          itemsUnderDev.includes('Nest 1 Cloud Backend') &&
                          itemsUnderDev.includes('Nest 2 Deep Secret') &&
                          itemsUnderDev.includes('Nest 2 Deep Cloud DB');

    results.push({
      test: 'Subtree Category Filtering (Parent includes all children)',
      result: filterNest2Pass && filterDevPass ? 'PASSED' : 'FAILED',
      notes: `Root "Development" shows all child items (${itemsUnderDev.length} items). Leaf "Nest 2" shows only its items (${itemsUnderNest2.length} items).`
    });

    // ----------------------------------------------------
    // STEP 15: Offline / Logged-out Cloud Isolation Verification
    // ----------------------------------------------------
    console.log('\n--- STEP 15: Cloud Isolation when Logged Out ---');
    await page.evaluate(() => {
      localStorage.removeItem('lokker_cloud_session');
      window.dispatchEvent(new Event('lokker_cloud_auth_change'));
      window.dispatchEvent(new Event('storage'));
    });
    await sleep(800);

    const itemsLoggedOut = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid="credential-row"]'));
      return cards.map(c => c.getAttribute('data-credential-title')).filter(Boolean);
    });
    console.log('Items shown after cloud logout:', itemsLoggedOut);

    const loggedOutCorrect = !itemsLoggedOut.includes('Cloud Dev API') &&
                             !itemsLoggedOut.includes('Nest 1 Cloud Backend') &&
                             !itemsLoggedOut.includes('Nest 2 Deep Cloud DB') &&
                             itemsLoggedOut.includes('Local Dev Tool') &&
                             itemsLoggedOut.includes('Nest 1 Local Service') &&
                             itemsLoggedOut.includes('Nest 2 Deep Secret');

    results.push({
      test: 'Offline & Cloud Logout Isolation',
      result: loggedOutCorrect ? 'PASSED' : 'FAILED',
      notes: 'Cloud items disappear immediately upon logout without manual refresh. Local items remain safe.'
    });

    await page.screenshot({ path: 'scratch/09-final-verification.png' });

  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('         TEST MATRIX RESULTS            ');
  console.log('========================================');
  results.forEach((r, i) => {
    console.log(`[${i + 1}] ${r.test}`);
    console.log(`    Status: ${r.result}`);
    console.log(`    Notes : ${r.notes}`);
  });
  console.log('Total Console Errors:', consoleErrors.length);

  return results;
}

runMatrix().catch(err => {
  console.error('Fatal Test Matrix Error:', err);
  process.exit(1);
});
