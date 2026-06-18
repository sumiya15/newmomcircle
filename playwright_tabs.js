const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // Log in first
  page.on('response', async resp => {
    if (resp.url().includes('supabase') && resp.url().includes('auth/v1/token')) {
      console.log('[AUTH]', resp.status());
    }
  });

  await page.goto('http://localhost:8081/(auth)/login', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);

  const inputs = await page.locator('input').all();
  await inputs[0].click();
  await page.keyboard.type('test@newmomcircle.app', { delay: 40 });
  await inputs[1].click();
  await page.keyboard.type('Test1234!', { delay: 40 });

  // Dispatch click on Log In by walking up from text node
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent === 'Log In') {
        let el = node.parentElement;
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

  // Wait for navigation to feed
  await page.waitForURL('**/feed', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  console.log('On:', page.url());
  await page.screenshot({ path: 'C:/tmp/live_01_feed.png' });
  console.log('Feed screenshot saved');

  // Helper: click tab by text label
  async function clickTab(label, file) {
    // Tab labels might be truncated, use partial match
    const tabs = await page.locator('[role=tab]').all();
    let clicked = false;
    for (const tab of tabs) {
      const text = await tab.textContent();
      if (text && text.includes(label)) {
        await tab.click({ force: true });
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // Try finding text anywhere in the bottom nav
      await page.evaluate((lbl) => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent && node.textContent.includes(lbl)) {
            let el = node.parentElement;
            while (el) {
              el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
              el = el.parentElement;
              if (el && el.tagName === 'BODY') break;
            }
            break;
          }
        }
      }, label);
    }
    await page.waitForTimeout(3500);
    await page.screenshot({ path: file });
    console.log(`${label} screenshot saved -> ${file}`);
  }

  await clickTab('Journ', 'C:/tmp/live_02_journal.png');
  await clickTab('Toolbox', 'C:/tmp/live_03_toolbox.png');
  await clickTab('Safety', 'C:/tmp/live_04_safety.png');
  await clickTab('Resources', 'C:/tmp/live_05_resources.png');
  await clickTab('Profile', 'C:/tmp/live_06_profile.png');

  // Go back to journal and click Insights
  await clickTab('Journ', 'C:/tmp/live_07_journal2.png');
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent === 'Insights') {
        let el = node.parentElement;
        while (el && el.tagName !== 'BODY') {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          el = el.parentElement;
        }
        break;
      }
    }
  });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: 'C:/tmp/live_08_insights.png' });
  console.log('Insights screenshot saved');

  await browser.close();
  console.log('All screenshots done!');
})().catch(e => { console.error(e.message); process.exit(1); });
