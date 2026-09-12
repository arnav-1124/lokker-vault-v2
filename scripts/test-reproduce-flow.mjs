import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[BROWSER]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle0' });

  // Initialize vault if needed
  const isSetup = await page.evaluate(() => !!document.querySelector('#setup-password'));
  if (isSetup) {
    console.log('Setting up vault...');
    await page.type('#setup-password', 'MasterPass123!');
    await page.type('#setup-confirm-password', 'MasterPass123!');
    await page.click('#confirm-saved');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Initialize Encrypted Vault'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
  }

  // Create Nest 1 under Development via top + button
  console.log('Opening Category Manager via + button...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.getAttribute('title')?.toLowerCase().includes('manage categories')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('Creating Nest 1 under Development...');
  await page.type('#cat-name', 'Nest 1');
  await page.click('#cat-parent');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[data-slot="select-item"]'));
    const item = items.find(el => el.textContent?.includes('Development'));
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('form button')).find(b => b.textContent?.includes('Add'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Close modal
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Done');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Now inspect the sidebar DOM for Nest 1
  const nest1Info = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.group.relative'));
    return rows.map(r => ({
      text: r.textContent?.trim(),
      html: r.innerHTML
    }));
  });
  console.log('Sidebar rows count:', nest1Info.length);
  const nest1Row = nest1Info.find(r => r.text.includes('Nest 1'));
  console.log('Nest 1 row found?', !!nest1Row);

  // Now attempt to click 3-dot menu on Nest 1
  console.log('Attempting to click 3-dots on Nest 1...');
  const clickedDots = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.group.relative'));
    const r = rows.find(row => row.textContent?.includes('Nest 1'));
    if (!r) return { error: 'Nest 1 row not found' };
    const btn = r.querySelector('button[aria-haspopup="menu"]') || r.querySelector('button');
    // The 3-dot button is in the absolute container
    const menuBtn = r.querySelector('div.absolute button');
    if (!menuBtn) return { error: 'Menu button not found in Nest 1 row', html: r.innerHTML };
    menuBtn.click();
    return { success: true };
  });
  console.log('Clicked dots result:', JSON.stringify(clickedDots));
  await new Promise(r => setTimeout(r, 500));

  // Check if dropdown menu opened
  const menuItems = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
    return items.map(i => i.textContent?.trim());
  });
  console.log('Dropdown menu items:', menuItems);

  // Click "Add Subcategory"
  const clickedAddSub = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
    const item = items.find(i => i.textContent?.includes('Add Subcategory'));
    if (item) { item.click(); return true; }
    return false;
  });
  console.log('Clicked Add Subcategory?', clickedAddSub);
  await new Promise(r => setTimeout(r, 600));

  // Check what parent is selected in the modal
  const selectedParentInModal = await page.evaluate(() => {
    const selectTrigger = document.querySelector('#cat-parent');
    return selectTrigger ? selectTrigger.textContent?.trim() : null;
  });
  console.log('Selected parent in modal:', selectedParentInModal);

  // Now create "Nest 2"
  console.log('Creating "Nest 2" below Nest 1...');
  await page.type('#cat-name', 'Nest 2');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('form button')).find(b => b.textContent?.includes('Add'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Close modal
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Done');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Inspect sidebar categories again!
  const sidebarItemsAfter = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.group.relative'));
    return rows.map(r => r.textContent?.trim());
  });
  console.log('Sidebar items after adding Nest 2:', sidebarItemsAfter);

  // Check IndexedDB
  const dbCats = await page.evaluate(async () => {
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
  console.log('IndexedDB categories:', JSON.stringify(dbCats, null, 2));

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
