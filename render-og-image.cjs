const puppeteer = require('puppeteer');
const path = require('path');

async function renderOGImage() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport to exact OG image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1
  });
  
  // Load the HTML template
  const templatePath = path.join(__dirname, 'og-image-template.html');
  await page.goto(`file://${templatePath}`, { waitUntil: 'networkidle0' });
  
  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 500)); // Extra buffer for fonts
  
  // Screenshot the page
  const outputPath = path.join(__dirname, 'public', 'og-image.png');
  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 1200,
      height: 630
    }
  });
  
  await browser.close();
  console.log(`OG image saved to: ${outputPath}`);
}

renderOGImage().catch(console.error);
