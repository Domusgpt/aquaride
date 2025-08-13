// Analyze why the map shows as white box
const { chromium } = require('playwright');

async function analyzeWhiteBox() {
  console.log('🔍 ANALYZING WHITE BOX ISSUE...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  // Monitor console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🛡️') || text.includes('✅')) {
      console.log('🗺️', text);
    }
  });
  
  try {
    await page.goto('http://localhost:3000');
    console.log('⏳ Waiting for map initialization...');
    await page.waitForTimeout(8000);
    
    // Analyze the map container
    const containerAnalysis = await page.evaluate(() => {
      const container = document.getElementById('bulletproof-map-container');
      if (!container) return { error: 'Container not found' };
      
      const rect = container.getBoundingClientRect();
      const style = getComputedStyle(container);
      
      // Check for Google Maps elements
      const gmStyle = container.querySelector('.gm-style');
      const canvas = container.querySelector('canvas');
      const controlsDiv = container.querySelector('[role="region"]');
      
      return {
        dimensions: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        },
        styling: {
          backgroundColor: style.backgroundColor,
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          position: style.position,
          zIndex: style.zIndex
        },
        content: {
          childrenCount: container.children.length,
          hasGmStyle: !!gmStyle,
          hasCanvas: !!canvas,
          hasControls: !!controlsDiv,
          innerHTML: container.innerHTML.substring(0, 300)
        },
        googleMapsGlobals: {
          hasGoogle: !!window.google,
          hasGoogleMaps: !!(window.google && window.google.maps),
          hasBulletproofMap: !!window.bulletproofMap
        }
      };
    });
    
    console.log('\n📊 CONTAINER ANALYSIS:');
    console.log('DIMENSIONS:', containerAnalysis.dimensions);
    console.log('STYLING:', containerAnalysis.styling);
    console.log('CONTENT:', containerAnalysis.content);
    console.log('GOOGLE MAPS:', containerAnalysis.googleMapsGlobals);
    
    // Check if the map instance exists and try to force a render
    const mapStatus = await page.evaluate(() => {
      if (window.bulletproofMap) {
        try {
          // Force map to resize and redraw
          window.google.maps.event.trigger(window.bulletproofMap, 'resize');
          window.bulletproofMap.setCenter({ lat: 37.7749, lng: -122.4194 });
          return 'Map instance exists - resize triggered';
        } catch (error) {
          return 'Map instance exists but error: ' + error.message;
        }
      } else {
        return 'No map instance found in window.bulletproofMap';
      }
    });
    
    console.log('\n🗺️ MAP STATUS:', mapStatus);
    
    // Wait a moment after resize
    await page.waitForTimeout(3000);
    
    // Check if resize helped
    const afterResize = await page.evaluate(() => {
      const container = document.getElementById('bulletproof-map-container');
      const canvas = container ? container.querySelector('canvas') : null;
      const gmStyle = container ? container.querySelector('.gm-style') : null;
      
      return {
        hasCanvas: !!canvas,
        hasGmStyle: !!gmStyle,
        canvasCount: container ? container.querySelectorAll('canvas').length : 0
      };
    });
    
    console.log('\n🎯 AFTER RESIZE ATTEMPT:');
    console.log(afterResize);
    
    if (!afterResize.hasCanvas && !afterResize.hasGmStyle) {
      console.log('\n🔧 TRYING MANUAL MAP RECREATION...');
      
      const recreationResult = await page.evaluate(() => {
        try {
          const container = document.getElementById('bulletproof-map-container');
          if (!container) return 'Container missing';
          
          // Clear container
          container.innerHTML = '';
          
          // Create new map directly
          const newMap = new window.google.maps.Map(container, {
            center: { lat: 37.7749, lng: -122.4194 },
            zoom: 13,
            mapTypeId: 'roadmap'
          });
          
          // Add marker
          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: { lat: 37.7749, lng: -122.4194 },
            map: newMap,
            title: 'Manual Recreation Test'
          });
          
          window.manualMap = newMap;
          return 'Manual map created successfully';
          
        } catch (error) {
          return 'Manual creation failed: ' + error.message;
        }
      });
      
      console.log('🔧 MANUAL RECREATION RESULT:', recreationResult);
      await page.waitForTimeout(3000);
    }
    
    // Final check
    const finalCheck = await page.evaluate(() => {
      const container = document.getElementById('bulletproof-map-container');
      return {
        canvasElements: container ? container.querySelectorAll('canvas').length : 0,
        gmStyleElements: container ? container.querySelectorAll('.gm-style').length : 0,
        totalChildren: container ? container.children.length : 0
      };
    });
    
    console.log('\n🎯 FINAL CHECK:');
    console.log(finalCheck);
    
    // Screenshot
    await page.screenshot({ 
      path: 'white-box-analysis.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved: white-box-analysis.png');
    
    if (finalCheck.canvasElements > 0) {
      console.log('\n🎉 SUCCESS! Canvas elements found - map should be visible now!');
    } else {
      console.log('\n🔧 ISSUE: No canvas elements found - Google Maps not rendering');
      console.log('Possible causes:');
      console.log('- API key restrictions');
      console.log('- DOM interference');
      console.log('- CSS styling blocking render');
    }
    
    console.log('\n🔍 Browser staying open for 15 seconds...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
  
  await browser.close();
}

analyzeWhiteBox().catch(console.error);