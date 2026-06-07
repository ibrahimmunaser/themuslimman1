const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const screenshotDir = path.join(__dirname, 'playwright-screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

async function getGoldPrice(page) {
  try {
    // Try multiple selectors to find the gold total price
    const selectors = [
      '[class*="text-gold"][class*="font-bold"]',
      '[class*="gold"]',
      '.text-gold',
    ];
    for (const sel of selectors) {
      const els = await page.locator(sel).all();
      for (const el of els) {
        const text = await el.textContent().catch(() => '');
        if (text && text.includes('$')) return text.trim();
      }
    }
    // Fallback: scrape all text containing $ near "Total"
    const totalSection = await page.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll('*'));
      const prices = [];
      for (const el of allEls) {
        if (el.children.length === 0) {
          const text = el.textContent.trim();
          if (text.match(/^\$[\d,]+(\.\d{2})?$/)) {
            const style = window.getComputedStyle(el);
            const color = style.color;
            prices.push({ text, color, className: el.className });
          }
        }
      }
      return prices;
    });
    return JSON.stringify(totalSection);
  } catch (e) {
    return 'ERROR: ' + e.message;
  }
}

async function getTotalPrice(page) {
  try {
    // Look for Total label and nearby price
    const result = await page.evaluate(() => {
      // Find elements with "Total" text
      const allEls = Array.from(document.querySelectorAll('*'));
      const results = [];
      for (const el of allEls) {
        if (el.children.length === 0 && el.textContent.trim() === 'Total') {
          // Get parent and siblings
          const parent = el.parentElement;
          if (parent) {
            const siblings = Array.from(parent.querySelectorAll('*'));
            for (const sib of siblings) {
              if (sib.children.length === 0) {
                const t = sib.textContent.trim();
                if (t.match(/\$[\d,]+/)) {
                  const style = window.getComputedStyle(sib);
                  results.push({ text: t, color: style.color, className: sib.className });
                }
              }
            }
            // Also check grandparent
            const gp = parent.parentElement;
            if (gp) {
              const gpSibs = Array.from(gp.querySelectorAll('*'));
              for (const sib of gpSibs) {
                if (sib.children.length === 0) {
                  const t = sib.textContent.trim();
                  if (t.match(/\$[\d,]+/)) {
                    const style = window.getComputedStyle(sib);
                    results.push({ text: t, color: style.color, className: sib.className });
                  }
                }
              }
            }
          }
        }
      }
      // Also find all gold-colored prices
      const goldPrices = [];
      for (const el of allEls) {
        if (el.children.length === 0) {
          const t = el.textContent.trim();
          if (t.match(/^\$[\d,]+(\.\d{2})?$/) || t.match(/^\$[\d,]+$/)) {
            const style = window.getComputedStyle(el);
            const color = style.color;
            // Check if gold-ish (high red, medium-low green/blue)
            const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
              const [,r,g,b] = match.map(Number);
              if (r > 150 && g > 100 && b < 100) {
                goldPrices.push({ text: t, color, className: el.className });
              }
            }
            // Also check class names
            if (el.className && (el.className.includes('gold') || el.className.includes('amber') || el.className.includes('yellow'))) {
              goldPrices.push({ text: t, color, className: el.className });
            }
          }
        }
      }
      return { nearTotal: results, goldPrices };
    });
    return result;
  } catch(e) {
    return { error: e.message };
  }
}

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  console.log('\n=== TEST 1: individual + lifetime + ORTHODOX promo ===');
  await page.goto('http://localhost:3000/checkout?plan=individual&billing=lifetime&promo=ORTHODOX');
  
  // Wait for page to load
  try {
    await page.waitForSelector('text=Total', { timeout: 15000 });
    console.log('Found "Total" text on page');
  } catch(e) {
    console.log('Warning: "Total" text not found within 15s');
  }
  await page.waitForTimeout(1000);
  
  let priceData = await getTotalPrice(page);
  console.log('--- Initial state (individual) ---');
  console.log(JSON.stringify(priceData, null, 2));
  await page.screenshot({ path: path.join(screenshotDir, '1_individual_initial.png'), fullPage: false });
  console.log('Screenshot saved: 1_individual_initial.png');
  
  await page.waitForTimeout(3000);
  priceData = await getTotalPrice(page);
  console.log('--- After 3s wait (individual) ---');
  console.log(JSON.stringify(priceData, null, 2));
  await page.screenshot({ path: path.join(screenshotDir, '2_individual_after3s.png'), fullPage: false });
  console.log('Screenshot saved: 2_individual_after3s.png');
  
  // Click Family button
  console.log('\n--- Clicking Family button ---');
  try {
    await page.click('button:has-text("Family")');
    console.log('Clicked Family button');
  } catch(e) {
    console.log('Could not click "button:has-text(Family)", trying alternatives...');
    try {
      await page.click('text=Family');
      console.log('Clicked Family text');
    } catch(e2) {
      console.log('ERROR clicking Family:', e2.message);
    }
  }
  
  // Rapid screenshots every 100ms for 2 seconds
  const rapidPrices = [];
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(100);
    const p = await getTotalPrice(page);
    const ms = (i + 1) * 100;
    rapidPrices.push({ ms, data: p });
    const goldPrices = p.goldPrices ? p.goldPrices.map(x => x.text).join(', ') : 'none';
    const nearTotal = p.nearTotal ? p.nearTotal.map(x => x.text).filter((v,i,a) => a.indexOf(v)===i).join(', ') : 'none';
    console.log(`  ${ms}ms: gold=${goldPrices} | nearTotal=${nearTotal}`);
    if (i === 4 || i === 9 || i === 14 || i === 19) {
      await page.screenshot({ path: path.join(screenshotDir, `3_family_${ms}ms.png`), fullPage: false });
    }
  }
  
  await page.waitForTimeout(3000);
  priceData = await getTotalPrice(page);
  console.log('\n--- After 3s (family) ---');
  console.log(JSON.stringify(priceData, null, 2));
  await page.screenshot({ path: path.join(screenshotDir, '4_family_final.png'), fullPage: false });
  console.log('Screenshot saved: 4_family_final.png');
  
  // Check if $179 ever appeared
  const allPrices = rapidPrices.flatMap(rp => {
    const prices = [];
    if (rp.data.goldPrices) prices.push(...rp.data.goldPrices.map(x => x.text));
    if (rp.data.nearTotal) prices.push(...rp.data.nearTotal.map(x => x.text));
    return prices.map(p => ({ ms: rp.ms, price: p }));
  });
  const saw179 = allPrices.filter(x => x.price.includes('179'));
  console.log('\n--- Did $179 appear? ---');
  if (saw179.length > 0) {
    console.log('YES! $179 was seen at:', saw179.map(x => `${x.ms}ms`).join(', '));
  } else {
    console.log('NO - $179 was never observed during the rapid capture period');
  }
  
  // TEST 2: Family plan directly
  console.log('\n=== TEST 2: family + lifetime + ORTHODOX promo ===');
  await page.goto('http://localhost:3000/checkout?plan=family&billing=lifetime&promo=ORTHODOX');
  try {
    await page.waitForSelector('text=Total', { timeout: 15000 });
  } catch(e) {}
  await page.waitForTimeout(1000);
  
  priceData = await getTotalPrice(page);
  console.log('--- Family plan direct load ---');
  console.log(JSON.stringify(priceData, null, 2));
  await page.screenshot({ path: path.join(screenshotDir, '5_family_direct.png'), fullPage: false });
  console.log('Screenshot saved: 5_family_direct.png');
  
  await browser.close();
  console.log('\nDone! Screenshots saved to:', screenshotDir);
}

run().catch(e => {
  console.error('FATAL ERROR:', e);
  process.exit(1);
});
