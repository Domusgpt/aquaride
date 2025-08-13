// Hybrid approach: React for UI, Pure JS for Google Maps
import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const HybridMapComponent = () => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('🔄 Loading map...');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize map completely outside React's DOM management
    const initGoogleMapsDirectly = () => {
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setRequestStatus('❌ Google Maps API key not found');
        return;
      }

      // Create script and load Google Maps
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
      script.async = true;
      script.onload = () => {
        // Initialize map after script loads
        initializeMapDirectly();
      };
      script.onerror = () => {
        setRequestStatus('❌ Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    };

    const initializeMapDirectly = () => {
      try {
        console.log('🗺️ Initializing Google Maps directly...');
        
        // Get the container that React created but won't manage
        const container = document.getElementById('google-maps-container');
        if (!container) {
          console.error('Map container not found');
          return;
        }

        // Create the actual Google Map
        const map = new window.google.maps.Map(container, {
          center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
          zoom: 13,
          mapTypeId: 'roadmap'
        });

        // Add marker using new AdvancedMarkerElement
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: 37.7749, lng: -122.4194 },
          map: map,
          title: '🚤 AquaRide - San Francisco Bay Area'
        });

        // Store map reference globally (outside React)
        window.aquaRideMap = map;
        
        setIsLoaded(true);
        setRequestStatus('✅ Map ready! Enter pickup and dropoff locations.');
        console.log('✅ Google Maps initialized successfully');

        // Test interaction
        map.addListener('click', (event) => {
          console.log('🖱️ Map clicked:', event.latLng.toString());
        });

      } catch (error) {
        console.error('❌ Map initialization error:', error);
        setRequestStatus(`❌ Map error: ${error.message}`);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMapDirectly();
    } else {
      initGoogleMapsDirectly();
    }

    // Cleanup function - do NOT touch the DOM
    return () => {
      // Just clear the global reference
      if (window.aquaRideMap) {
        window.aquaRideMap = null;
      }
    };
  }, []); // Empty dependency array - run only once

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
    if (!navigator.geolocation || !window.aquaRideMap) {
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
        
        // Use the global map reference
        window.aquaRideMap.panTo(pos);
        window.aquaRideMap.setZoom(15);
        
        // Add current location marker
        new window.google.maps.marker.AdvancedMarkerElement({
          position: pos,
          map: window.aquaRideMap,
          title: 'Your Current Location'
        });

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

      {/* Map Container - React creates it but doesn't manage it */}
      <div 
        id="google-maps-container"
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
              🤖 Loading Hybrid Google Maps...
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

export default HybridMapComponent;