// Check for Google Maps error message
const { chromium } = require('playwright');

async function checkError() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(8000);
    
    // Check for Google Maps error message
    const errorCheck = await page.evaluate(() => {
      // Look for common Google Maps error messages
      const body = document.body.textContent;
      const errorMessages = [
        'page cant load Google Maps correctly',
        'This page cant load Google Maps correctly',
        'Google Maps Platform rejected your request',
        'InvalidKeyMapError',
        'RefererNotAllowedMapError'
      ];
      
      for (let msg of errorMessages) {
        if (body.includes(msg)) {
          return msg;
        }
      }
      
      // Check for error containers
      const errorContainers = document.querySelectorAll('.gm-err-container, [data-gm-error]');
      if (errorContainers.length > 0) {
        return Array.from(errorContainers).map(el => el.textContent).join(' | ');
      }
      
      return null;
    });
    
    console.log('ERROR MESSAGE:', errorCheck);
    
    // Check map container
    const mapCheck = await page.evaluate(() => {
      const map = document.getElementById('map');
      if (!map) return { error: 'No map container found' };
      
      const rect = map.getBoundingClientRect();
      const style = getComputedStyle(map);
      
      return {
        found: true,
        dimensions: { width: rect.width, height: rect.height },
        styles: { 
          display: style.display, 
          position: style.position,
          width: style.width,
          height: style.height,
          minHeight: style.minHeight
        },
        children: map.children.length
      };
    });
    
    console.log('MAP CHECK:', mapCheck);
    
    // Take screenshot
    await page.screenshot({ path: 'error-check.png', fullPage: true });
    console.log('Screenshot saved: error-check.png');
    
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Test error:', error);
  }
  
  await browser.close();
}

checkError().catch(console.error);