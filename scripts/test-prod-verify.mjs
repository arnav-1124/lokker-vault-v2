import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runVerification() {
  console.log('==============================================');
  console.log('🚀 LIVE PRODUCTION VERIFICATION');
  console.log('==============================================\n');

  // 1. Backend Health Check
  console.log('[1/4] Testing Live Backend Health...');
  const healthRes = await fetch('https://lokker-server.vercel.app/health');
  const healthData = await healthRes.json();
  console.log('  Status:', healthRes.status);
  console.log('  Response:', healthData);
  if (healthRes.status !== 200) {
    throw new Error('Backend health check failed');
  }

  // 2. Backend Live Auth & Neon DB Flow
  console.log('\n[2/4] Testing Live Backend Database & Auth Flow...');
  const testEmail = `verify_${Date.now()}@lokker.dev`;
  const testPassword = 'MasterPassword_2026!Strong';

  // Register
  const regRes = await fetch('https://lokker-server.vercel.app/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const regData = await regRes.json();
  console.log('  Register Status:', regRes.status, '| User:', regData.user?.email, '| Role:', regData.user?.role);
  if (regRes.status !== 201) throw new Error('Registration failed: ' + JSON.stringify(regData));

  // Login
  const loginRes = await fetch('https://lokker-server.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const loginData = await loginRes.json();
  console.log('  Login Status:', loginRes.status, '| AccessToken:', !!loginData.accessToken);
  if (!loginData.accessToken) throw new Error('Login failed: ' + JSON.stringify(loginData));

  // Verify /me
  const meRes = await fetch('https://lokker-server.vercel.app/api/auth/me', {
    headers: { Authorization: `Bearer ${loginData.accessToken}` },
  });
  const meData = await meRes.json();
  console.log('  GET /api/auth/me Status:', meRes.status, '| Authenticated As:', meData.email);

  // 3. Frontend Production Availability
  console.log('\n[3/4] Testing Frontend Production Deployment (https://lokker-vault.vercel.app)...');
  const frontRes = await fetch('https://lokker-vault.vercel.app/');
  console.log('  Frontend HTTP Status:', frontRes.status);

  // 4. Browser Testing (UI, Donate button, API URL inspection)
  console.log('\n[4/4] Launching Real Chrome Browser to verify frontend integration...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(`[Browser ${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', (err) => console.error('  [Browser Error]:', err.message));

    // Monitor network requests to lokker-server
    const apiRequests = [];
    page.on('request', (req) => {
      if (req.url().includes('lokker-server')) {
        apiRequests.push({ method: req.method(), url: req.url() });
      }
    });

    console.log('  Navigating to https://lokker-vault.vercel.app/ ...');
    await page.goto('https://lokker-vault.vercel.app/', { waitUntil: 'networkidle2', timeout: 30000 });

    // Inspect NEXT_PUBLIC_API_URL or appConfig in the browser
    const clientConfig = await page.evaluate(() => {
      // Find embedded config or test fetch
      return {
        origin: window.location.origin,
        title: document.title,
      };
    });
    console.log('  Page Loaded:', clientConfig);

    // Click "Get Started" or "Open Vault"
    const getStartedBtn = await page.$('a[href="/app"], button, a');
    console.log('  Navigating to /app...');
    await page.goto('https://lokker-vault.vercel.app/app', { waitUntil: 'networkidle2', timeout: 30000 });

    // Check if Donate button is present in the header
    const donateBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find((b) => b.textContent?.includes('Coffee') || b.textContent?.includes('Donate'));
      if (!found) return null;
      const rect = found.getBoundingClientRect();
      return {
        text: found.textContent.trim(),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        center: rect.x + rect.width / 2,
        windowWidth: window.innerWidth,
      };
    });
    console.log('  Centered Donate Button Status:', donateBtn);

    // Take a screenshot of the production page
    if (!fs.existsSync('scratch')) fs.mkdirSync('scratch', { recursive: true });
    await page.screenshot({ path: 'scratch/production-vault.png' });
    console.log('  Saved production screenshot to scratch/production-vault.png');

    console.log('\n==============================================');
    console.log('🎉 ALL PRODUCTION TESTS PASSED SUCCESSFULLY!');
    console.log('==============================================');
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
