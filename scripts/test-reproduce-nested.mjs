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

  // Handle master password setup
  const isSetupModal = await page.evaluate(() => {
    return !!document.querySelector('#confirm-saved');
  });

  if (isSetupModal) {
    console.log('Setting up initial vault password...');
    await page.type('#setup-password', 'MasterPass123!');
    await page.type('#setup-confirm-password', 'MasterPass123!');
    // Check confirm saved checkbox
    await page.click('#confirm-saved');
    await new Promise(r => setTimeout(r, 200));

    // Submit
    const initBtn = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Initialize Encrypted Vault'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Clicked Initialize button?', initBtn);
    await new Promise(r => setTimeout(r, 1200));
  }

  // 2. Open Category Manager Modal
  console.log('2. Opening Category Manager Modal...');
  const clickedOpen = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.getAttribute('title')?.toLowerCase().includes('manage categories') ||
      b.textContent?.includes('Manage Categories')
    );
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Clicked Category Manager button?', clickedOpen);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scratch/03-cat-modal.png' });

  // 3. Create "Nest 1" under "Development"
  console.log('3. Creating "Nest 1" under "Development"...');
  await page.type('#cat-name', 'Nest 1');

  // Open Parent select
  await page.click('#cat-parent');
  await new Promise(r => setTimeout(r, 400));

  // Click Development in select
  const selectedDev = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[data-slot="select-item"]'));
    const item = items.find(el => el.textContent?.includes('Development'));
    if (item) { item.click(); return true; }
    return false;
  });
  console.log('Selected Development as parent?', selectedDev);
  await new Promise(r => setTimeout(r, 300));

  // Click Add
  const clickedAdd1 = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('form button')).find(b => b.textContent?.includes('Add'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Clicked Add for Nest 1?', clickedAdd1);
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/04-nest1-created.png' });

  // 4. Create "Nest 2" under "Nest 1"
  console.log('4. Creating "Nest 2" under "Nest 1"...');
  await page.type('#cat-name', 'Nest 2');

  // Open Parent select
  await page.click('#cat-parent');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'scratch/05-parent-dropdown.png' });

  // Inspect all select options
  const options = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-slot="select-item"]')).map(el => ({
      text: el.textContent?.trim(),
      val: el.getAttribute('data-value') || el.getAttribute('value')
    }));
  });
  console.log('Available parent options:', JSON.stringify(options, null, 2));

  // Click Nest 1 in select
  const selectedNest1 = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[data-slot="select-item"]'));
    const item = items.find(el => el.textContent?.includes('Nest 1'));
    if (item) { item.click(); return true; }
    return false;
  });
  console.log('Selected Nest 1 as parent?', selectedNest1);
  await new Promise(r => setTimeout(r, 300));

  // Click Add
  const clickedAdd2 = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('form button')).find(b => b.textContent?.includes('Add'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Clicked Add for Nest 2?', clickedAdd2);
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scratch/06-nest2-created.png' });

  // Check DB state right now
  const catsInDB = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const req = indexedDB.open('LokkerLocalVaultDB', 3);
      req.onsuccess = () => {
        const tx = req.result.transaction('categories', 'readonly');
        const storeReq = tx.objectStore('categories').getAll();
        storeReq.onsuccess = () => resolve(storeReq.result);
        storeReq.onerror = () => resolve({ error: storeReq.error });
      };
      req.onerror = () => resolve({ error: req.error });
    });
  });
  console.log('Categories in IndexedDB:', JSON.stringify(catsInDB, null, 2));

  // Close modal with Done
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Done');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch/07-sidebar-after-modal.png' });

  // Inspect sidebar categories
  const sidebarCategories = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('aside button, [data-slot="sidebar"] button'));
    return buttons.map(b => ({
      text: b.textContent?.trim(),
      title: b.getAttribute('title')
    })).filter(b => b.title || b.text);
  });
  console.log('Sidebar rendered items:', JSON.stringify(sidebarCategories, null, 2));

  await browser.close();
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
