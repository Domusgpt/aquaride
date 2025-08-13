// Vanilla JavaScript Google Maps - No React DOM conflicts
// This component avoids React's virtual DOM entirely

import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const VanillaGoogleMap = () => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('🔄 Loading map...');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mapInstance = null;
    let mounted = true;

    const initializeVanillaMap = async () => {
      try {
        console.log('🗺️ Initializing vanilla Google Maps...');
        
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps API key not found');
        }

        // Create map container outside React's DOM management
        const mapContainer = document.createElement('div');
        mapContainer.id = 'vanilla-google-map';
        mapContainer.style.cssText = `
          width: 100%;
          height: 100%;
          min-height: 400px;
          background: #f0f0f0;
        `;

        // Insert into the designated area
        const mapArea = document.getElementById('map-insertion-point');
        if (mapArea) {
          mapArea.innerHTML = ''; // Clear any existing content
          mapArea.appendChild(mapContainer);
        }

        // Load Google Maps if not already loaded
        if (!window.google || !window.google.maps) {
          console.log('📡 Loading Google Maps API...');
          await loadGoogleMapsScript(apiKey);
        }

        console.log('🎯 Creating map instance...');
        
        // Create map instance
        mapInstance = new window.google.maps.Map(mapContainer, {
          center: { lat: 37.7749, lng: -122.4194 }, // San Francisco Bay
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
          map: mapInstance,
          title: '🚤 AquaRide - San Francisco Bay Area'
        });

        // Test interaction
        mapInstance.addListener('click', (event) => {
          console.log('🖱️ Map clicked at:', event.latLng.toString());
        });

        if (mounted) {
          setIsLoaded(true);
          setRequestStatus('✅ Map ready! Enter pickup and dropoff locations.');
          console.log('✅ Vanilla Google Maps initialized successfully');
        }

      } catch (error) {
        console.error('❌ Map initialization failed:', error);
        if (mounted) {
          setRequestStatus(`❌ Failed to load map: ${error.message}`);
        }
      }
    };

    // Initialize with a small delay to ensure DOM is ready
    const timer = setTimeout(initializeVanillaMap, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      
      // Cleanup map instance
      if (mapInstance) {
        console.log('🧹 Cleaning up map instance');
        // Don't manipulate DOM here - let it be garbage collected naturally
        mapInstance = null;
      }
    };
  }, []);

  const loadGoogleMapsScript = (apiKey) => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      const callbackName = `initVanillaMap_${Date.now()}`;

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&libraries=marker`;
      script.async = true;
      script.defer = true;

      window[callbackName] = () => {
        delete window[callbackName];
        resolve();
      };

      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

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
    if (!navigator.geolocation) {
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
        
        // Access map through DOM instead of React ref
        const mapContainer = document.getElementById('vanilla-google-map');
        if (mapContainer && window.google) {
          // This is safe because we're not using React refs
          const existingMap = mapContainer.mapInstance;
          if (existingMap) {
            existingMap.panTo(pos);
            existingMap.setZoom(15);
            
            new window.google.maps.marker.AdvancedMarkerElement({
              position: pos,
              map: existingMap,
              title: 'Your Current Location'
            });
          }
        }

        setRequestStatus('✅ Location updated!');
      },
      () => {
        setRequestStatus('❌ Unable to get location.');
      }
    );
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Form */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '600' }}>
            🚤 AquaRide - Book Your Water Transport
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

      {/* Map Container - Vanilla JS Only */}
      <div 
        id="map-insertion-point"
        style={{ 
          flex: 1,
          width: '100%',
          minHeight: '400px',
          position: 'relative',
          backgroundColor: '#f0f0f0'
        }}
      >
        {!isLoaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1000,
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
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
              🤖 Loading Vanilla Google Maps...
            </p>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VanillaGoogleMap;