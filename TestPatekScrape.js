import puppeteer from 'puppeteer';

const reference = '5726-1A-014';
const url = `https://www.patek.com/en/collection/nautilus/${reference}`;

console.log(`Launching browser for: ${url}`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage();

await page.goto(url, {
  waitUntil: 'networkidle2',
  timeout: 0
});

// ✅ Try to accept cookies if button exists
try {
  await page.click('button#accept-cookie', { timeout: 3000 });
  console.log('✅ Accepted cookies.');
} catch (e) {
  console.log('ℹ️ No cookie banner.');
}

// ✅ Wait for the whole body to load fully
await page.waitForSelector('body', { timeout: 15000 });

// ✅ Get full text and extract first $xx,xxx pattern
const pageText = await page.evaluate(() => document.body.innerText);
const priceMatch = pageText.match(/\$\d{1,3}(,\d{3})+/);

if (priceMatch) {
  console.log(`✅ Real price for ${reference}: ${priceMatch[0]}`);
} else {
  console.log('❌ Price pattern not found in page text.');
}

await browser.close();
