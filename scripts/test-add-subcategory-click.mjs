import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[BROWSER ERROR]', err.message));

  console.log('1. Navigating to http://localhost:3000/app ...');
  await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle0' });

  // Check if setup modal is present or unlock if locked
  const isUnlock = await page.evaluate(() => {
    return !!document.querySelector('#unlock-password');
  });
  if (isUnlock) {
    console.log('Unlocking vault...');
    await page.type('#unlock-password', 'MasterPass123!');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1000));
  }

  // Hover over Nest 1 and click 3 dots
  console.log('Finding Nest 1 category row...');
  const foundNest1 = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.group.relative'));
    const nest1Row = rows.find(r => r.textContent?.includes('Nest 1'));
    if (!nest1Row) return false;
    
    // Find the 3 dots button in this row
    const btn = nest1Row.querySelector('button[aria-haspopup="menu"]');
    if (btn) {
      btn.click();
      return 'clicked-dots';
    }
    return 'found-row-no-btn';
  });
  console.log('Result of finding Nest 1 dots:', foundNest1);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'scratch/test-dots-menu.png' });

  // Click "Add Subcategory" in dropdown menu
  const clickedSub = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
    const item = items.find(el => el.textContent?.includes('Add Subcategory'));
    if (item) {
      item.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Add Subcategory menuitem?', clickedSub);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scratch/test-modal-opened-from-sub.png' });

  // Check what parent is selected in the modal
  const parentVal = await page.evaluate(() => {
    const trigger = document.querySelector('#cat-parent');
    return trigger ? trigger.textContent?.trim() : null;
  });
  console.log('Selected parent shown in modal:', parentVal);

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
