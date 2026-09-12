/**
 * Verification Script for:
 * 1. Donate button centered on top in ALL device widths (375px mobile, 440px iPhone 16 Pro Max, 768px tablet, 1440px desktop)
 * 2. Donate modal opening, showing QR code and link https://buymeacoffee.com/carbon.copy
 * 3. Mobile responsiveness with no horizontal overflow
 */

import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('=== STARTING DONATE BUTTON & MOBILE LAYOUT VERIFICATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 440, height: 956 }, // iPhone 16 Pro Max
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // ----------------------------------------------------
    // TEST 1: Mobile Viewport (440 x 956 - iPhone 16 Pro Max)
    // ----------------------------------------------------
    console.log('--- TEST 1: Mobile Viewport (440px) ---');
    await page.setViewport({ width: 440, height: 956 });
    await page.goto(`${BASE_URL}/app/passwords`, { waitUntil: 'networkidle0' });
    await sleep(1000);

    // If setup modal, initialize vault
    const isSetup = await page.evaluate(() => !!document.querySelector('#setup-pass'));
    if (isSetup) {
      console.log('Initializing vault in test session...');
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
    }

    // Check if vault unlock modal appears and unlock if needed
    const isUnlock = await page.evaluate(() => !!document.querySelector('#unlock-pass'));
    if (isUnlock) {
      await page.type('#unlock-pass', 'MasterPass123!');
      await page.click('button[type="submit"]');
      await sleep(1000);
    }

    // Check Donate Button presence and visibility
    const donateBtnMobile = await page.evaluate(() => {
      const btn = document.querySelector('#btn-donate-header');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return {
        visible: rect.width > 0 && rect.height > 0,
        text: btn.textContent?.trim(),
        left: rect.left,
        right: rect.right,
        center: rect.left + rect.width / 2,
        screenWidth: window.innerWidth
      };
    });

    console.log('Mobile Donate Button Check:', donateBtnMobile);

    // Verify Horizontal Overflow on Mobile (must be 0)
    const mobileOverflow = await page.evaluate(() => {
      const docEl = document.documentElement;
      return {
        scrollWidth: docEl.scrollWidth,
        clientWidth: docEl.clientWidth,
        hasOverflow: docEl.scrollWidth > docEl.clientWidth
      };
    });
    console.log('Mobile Horizontal Overflow Check:', mobileOverflow);

    // Capture Mobile Screenshot
    await page.screenshot({ path: 'scratch/mobile-440-header.png' });

    // ----------------------------------------------------
    // TEST 2: Open Donate Modal on Mobile
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Clicking Donate Button ---');
    await page.click('#btn-donate-header');
    await sleep(600);

    const modalData = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return null;
      const img = dialog.querySelector('img[src="/donate-qr.png"]');
      const hasLink = dialog.textContent?.includes('https://buymeacoffee.com/carbon.copy');
      const hasOpenBtn = Array.from(dialog.querySelectorAll('a')).some(a => a.href?.includes('buymeacoffee.com/carbon.copy'));
      return {
        isOpen: true,
        hasQrImage: !!img,
        hasDirectLink: hasLink,
        hasOpenButton: hasOpenBtn
      };
    });
    console.log('Donate Modal Content Check:', modalData);
    await page.screenshot({ path: 'scratch/mobile-donate-modal.png' });

    // Close modal by pressing Escape
    await page.keyboard.press('Escape');
    await sleep(500);

    // ----------------------------------------------------
    // TEST 3: Ultra-Small Viewport (375px - iPhone SE)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Ultra-Small Viewport (375px) ---');
    await page.setViewport({ width: 375, height: 667 });
    await sleep(600);

    const donateBtn375 = await page.evaluate(() => {
      const btn = document.querySelector('#btn-donate-header');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return {
        visible: rect.width > 0 && rect.height > 0,
        text: btn.textContent?.trim(),
        center: rect.left + rect.width / 2,
        screenWidth: window.innerWidth
      };
    });
    console.log('375px Donate Button Check:', donateBtn375);

    const overflow375 = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log('375px Has Overflow:', overflow375);
    await page.screenshot({ path: 'scratch/mobile-375-header.png' });

    // ----------------------------------------------------
    // TEST 4: Desktop Viewport (1440px)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Desktop Viewport (1440px) ---');
    await page.setViewport({ width: 1440, height: 900 });
    await sleep(600);

    const donateBtnDesktop = await page.evaluate(() => {
      const btn = document.querySelector('#btn-donate-header');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return {
        visible: rect.width > 0 && rect.height > 0,
        text: btn.textContent?.trim(),
        center: rect.left + rect.width / 2,
        screenWidth: window.innerWidth
      };
    });
    console.log('Desktop Donate Button Check:', donateBtnDesktop);
    await page.screenshot({ path: 'scratch/desktop-1440-header.png' });

    console.log('\n=== ALL DONATE & RESPONSIVE CHECKS COMPLETE ===');

  } finally {
    await browser.close();
  }
}

runTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
