const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  page.on('response', async resp => {
    if (resp.url().includes('supabase') && resp.url().includes('auth')) {
      let body = '';
      try { body = await resp.text(); } catch {}
      console.log(`[AUTH] ${resp.status()} -> ${body.slice(0, 300)}`);
    }
  });

  await page.goto('http://localhost:8081/(auth)/login', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);

  const inputs = await page.locator('input').all();
  await inputs[0].click();
  await page.keyboard.type('test@newmomcircle.app', { delay: 50 });
  await page.waitForTimeout(300);
  await inputs[1].click();
  await page.keyboard.type('Test1234!', { delay: 50 });
  await page.waitForTimeout(300);
  console.log('Credentials typed');

  // Get the button bounding box
  const btnEl = page.locator('text=Log In').first();
  const box = await btnEl.boundingBox();
  console.log('Button box:', JSON.stringify(box));

  if (box) {
    // Use mouse click at exact coordinates
    await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
    console.log('Mouse clicked at', box.x + box.width/2, box.y + box.height/2);
  }

  await page.waitForTimeout(2000);

  // If no network request, try dispatching a click event via JS
  const url1 = page.url();
  console.log('URL after click:', url1);

  if (url1.includes('login')) {
    console.log('Still on login, trying JS dispatch...');
    // Find the button by text and dispatch events
    await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent === 'Log In') {
          let el = node.parentElement;
          // Walk up to find the pressable div
          while (el && el.tagName !== 'BODY') {
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            el = el.parentElement;
          }
          break;
        }
      }
    });
    console.log('JS events dispatched');
  }

  await page.waitForTimeout(8000);
  console.log('Final URL:', page.url());
  await page.screenshot({ path: 'C:/tmp/after_login2.png' });

  await browser.close();
  console.log('Done');
})().catch(e => { console.error(e.message); process.exit(1); });
