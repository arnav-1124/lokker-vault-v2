import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[BROWSER ERROR]', err.message));

  console.log('Navigating to http://localhost:3000/app ...');
  await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle0' });

  // Check current URL and page content
  console.log('Current URL:', page.url());
  const title = await page.title();
  console.log('Page Title:', title);

  // Take screenshot of landing state
  await page.screenshot({ path: 'scratch/step1-landing.png' });

  // Check IndexedDB categories
  const categoriesInDB = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const req = indexedDB.open('LokkerLocalVaultDB', 3);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('categories')) {
          resolve({ error: 'no categories store' });
          return;
        }
        const tx = db.transaction('categories', 'readonly');
        const storeReq = tx.objectStore('categories').getAll();
        storeReq.onsuccess = () => resolve(storeReq.result);
        storeReq.onerror = () => resolve({ error: storeReq.error });
      };
      req.onerror = () => resolve({ error: req.error });
    });
  });
  console.log('Categories in IndexedDB:', JSON.stringify(categoriesInDB, null, 2));

  // Check categories rendered in sidebar DOM
  const sidebarCats = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('aside button, [data-slot="sidebar"] button'));
    return buttons.map(b => b.textContent?.trim()).filter(Boolean);
  });
  console.log('Buttons/Items in Sidebar:', sidebarCats);

  await browser.close();
}

main().catch(err => {
  console.error('Error running browser test:', err);
  process.exit(1);
});
