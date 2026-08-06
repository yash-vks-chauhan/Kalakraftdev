const { chromium } = require('playwright-core');
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell';
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    let body = {};
    if (url.includes('/api/products/usage-tags')) body = { tags: ['gifting'] };
    else if (url.includes('/api/products')) body = { products: [{ id: 1, name: 'Piece', slug: 'p1', shortDesc: '', price: 950, currency: 'INR', imageUrls: ['/images/DSC01322.JPG'], stockQuantity: 3, category: { id: 1, name: 'Clocks', slug: 'clocks' }, usageTags: [], avgRating: 4, ratingCount: 2 }] };
    else if (url.includes('/api/auth/me')) body = { user: null };
    else body = {};
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 200)); });
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 300)));
  await page.goto('http://localhost:3002/products', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const info = await page.evaluate(() => ({
    text: document.body.innerText.slice(0, 300),
    hasMobileClient: !!document.querySelector('[class*="productsMobile"]'),
    hasDesktopShell: !!document.querySelector('[class*="zinc-100"]'),
    mainChildren: document.querySelectorAll('main *').length,
    bodyClasses: document.body.className,
  }));
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
