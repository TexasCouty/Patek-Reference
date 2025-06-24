import puppeteer from 'puppeteer';
import fs from 'fs';

const raw = fs.readFileSync('patek_refs.json', 'utf-8');
const refs = JSON.parse(raw);

console.log(`✅ Loaded ${refs.length} references from patek_refs.json`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
});

for (const item of refs) {
  const ref = item.reference;
  const urlRef = ref.replace(/\//g, '-');
  const url = `https://www.patek.com/en/collection/nautilus/${urlRef}`;

  console.log(`🔍 Scraping: ${url}`);

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

  const pageText = await page.evaluate(() => document.body.innerText);
  const priceMatch = pageText.match(/\$\d{1,3}(,\d{3})+/);
  const price = priceMatch ? priceMatch[0] : "Unavailable";

  item.retail_price = price;

  console.log(`✅ ${ref} → ${price}`);

  await page.close();
}

await browser.close();

// ✅ Save the updated JSON
fs.writeFileSync('patek_refs.json', JSON.stringify(refs, null, 2));
console.log('✅ Updated patek_refs.json with fresh prices for all references!');
