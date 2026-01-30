const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  
  const htmlPath = path.join(__dirname, 'public', 'og-image-template.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  await page.screenshot({
    path: path.join(__dirname, 'public', 'og-image.png'),
    type: 'png'
  });
  
  await browser.close();
  console.log('OG image generated: public/og-image.png');
})();
