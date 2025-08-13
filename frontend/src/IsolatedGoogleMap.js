// ULTIMATE SOLUTION: Complete DOM isolation using React Portals
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const IsolatedGoogleMap = () => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('🔄 Initializing...');
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapPortal, setMapPortal] = useState(null);

  useEffect(() => {
    // Create a completely isolated DOM container outside React's tree
    const createIsolatedContainer = () => {
      // Remove any existing isolated containers
      const existingContainer = document.getElementById('isolated-map-root');
      if (existingContainer) {
        existingContainer.remove();
      }

      // Create new isolated container
      const isolatedContainer = document.createElement('div');
      isolatedContainer.id = 'isolated-map-root';
      isolatedContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        pointer-events: none;
      `;
      
      // Create the actual map container inside
      const mapContainer = document.createElement('div');
      mapContainer.id = 'completely-isolated-map';
      mapContainer.style.cssText = `
        width: 100%;
        height: 100%;
        pointer-events: auto;
      `;
      
      isolatedContainer.appendChild(mapContainer);
      document.body.appendChild(isolatedContainer);
      
      return mapContainer;
    };

    const initializeIsolatedMap = () => {
      if (!window.google || !window.google.maps || !window.googleMapsReady) {
        console.log('⏳ Waiting for global Google Maps...');
        setTimeout(initializeIsolatedMap, 100);
        return;
      }

      try {
        console.log('🏝️ Creating completely isolated Google Map...');
        
        const mapContainer = createIsolatedContainer();
        
        // Create map in isolated container
        const map = new window.google.maps.Map(mapContainer, {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 13,
          mapTypeId: 'roadmap',
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        });

        // Add marker
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: 37.7749, lng: -122.4194 },
          map: map,
          title: '🚤 AquaRide - San Francisco Bay'
        });

        // Store globally
        window.isolatedAquaRideMap = map;
        window.isolatedMapContainer = mapContainer;

        // Test interaction
        map.addListener('click', (event) => {
          console.log('🖱️ Isolated map clicked:', event.latLng.toString());
        });

        setIsLoaded(true);
        setRequestStatus('✅ Isolated map ready! Enter pickup and dropoff locations.');
        console.log('✅ Completely isolated Google Map created successfully');

        // Show the isolated container
        const isolatedRoot = document.getElementById('isolated-map-root');
        if (isolatedRoot) {
          isolatedRoot.style.position = 'relative';
          isolatedRoot.style.zIndex = '1';
          setMapPortal(isolatedRoot);
        }

      } catch (error) {
        console.error('❌ Isolated map creation error:', error);
        setRequestStatus(`❌ Map error: ${error.message}`);
      }
    };

    initializeIsolatedMap();

    // Cleanup - remove isolated container completely
    return () => {
      console.log('🧹 Cleaning up isolated map...');
      const isolatedContainer = document.getElementById('isolated-map-root');
      if (isolatedContainer) {
        // Don't let React touch this - remove it manually
        document.body.removeChild(isolatedContainer);
      }
      window.isolatedAquaRideMap = null;
      window.isolatedMapContainer = null;
    };
  }, []);

  const handleRequestRide = async (e) => {
    e.preventDefault();
    setRequestStatus('🚢 Requesting ride...');

    if (!auth.currentUser) {
      setRequestStatus('❌ Please log in to request a ride.');
      return;
    }

    if (!pickup.trim() || !dropoff.trim()) {
      setRequestStatus('❌ Please enter both pickup and dropoff locations.');
      return;
    }

    try {
      const functions = getFunctions();
      const requestRideCallable = httpsCallable(functions, 'requestRide');
      const result = await requestRideCallable({ 
        pickup: pickup.trim(), 
        dropoff: dropoff.trim(), 
        boatType 
      });
      
      setRequestStatus(`✅ Ride requested successfully!
📋 Ride ID: ${result.data.rideId}
${result.data.message}

🚤 A captain will be assigned shortly!`);
    } catch (error) {
      console.error('Error requesting ride:', error);
      setRequestStatus(`❌ Error: ${error.message}`);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation || !window.isolatedAquaRideMap) {
      setRequestStatus('❌ Location services not available.');
      return;
    }

    setRequestStatus('📍 Getting your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        window.isolatedAquaRideMap.panTo(pos);
        window.isolatedAquaRideMap.setZoom(15);
        
        new window.google.maps.marker.AdvancedMarkerElement({
          position: pos,
          map: window.isolatedAquaRideMap,
          title: 'Your Current Location'
        });

        setRequestStatus('✅ Location updated!');
      },
      () => {
        setRequestStatus('❌ Unable to get location.');
      }
    );
  };

  // UI Portal Component - renders controls over the isolated map
  const MapUI = () => (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0,
      zIndex: 1000,
      pointerEvents: 'none'
    }}>
      {/* Header Form */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        pointerEvents: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '600' }}>
            🚤 AquaRide - Isolated Map Solution
          </h2>
          
          <form onSubmit={handleRequestRide}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              alignItems: 'end'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  📍 Pickup Location
                </label>
                <input
                  type="text"
                  placeholder="Where should we pick you up?"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '16px',
                    outline: 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  🎯 Dropoff Location
                </label>
                <input
                  type="text"
                  placeholder="Where are you going?"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '16px',
                    outline: 'none',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  🚤 Boat Type
                </label>
                <select
                  value={boatType}
                  onChange={(e) => setBoatType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '16px',
                    outline: 'none',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <option value="Speedboat">⚡ Speedboat</option>
                  <option value="Yacht">🛥️ Luxury Yacht</option>
                  <option value="Sailboat">⛵ Sailboat</option>
                  <option value="Any">🚢 Any Available</option>
                </select>
              </div>
              
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={!isLoaded}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  cursor: isLoaded ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                📍 My Location
              </button>
              
              <button
                type="submit"
                disabled={!pickup || !dropoff}
                style={{
                  padding: '12px 24px',
                  backgroundColor: (pickup && dropoff) ? '#28a745' : 'rgba(255,255,255,0.3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: (pickup && dropoff) ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                🚢 Book Ride
              </button>
            </div>
          </form>
          
          {requestStatus && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: requestStatus.includes('❌') 
                ? 'rgba(220, 53, 69, 0.9)' 
                : requestStatus.includes('✅')
                ? 'rgba(40, 167, 69, 0.9)'
                : 'rgba(255, 193, 7, 0.9)',
              color: 'white',
              whiteSpace: 'pre-line',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {requestStatus}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay if not loaded */}
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 2000,
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          pointerEvents: 'auto'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
            🏝️ Loading Isolated Google Maps...
          </p>
          <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
            Complete DOM isolation from React
          </p>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  // Render UI as portal over isolated map container
  return mapPortal ? ReactDOM.createPortal(<MapUI />, mapPortal) : <MapUI />;
};

export default IsolatedGoogleMap;