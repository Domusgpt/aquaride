// FINAL WORKING SOLUTION: Use React ref to completely bypass React DOM management
import React, { useRef, useLayoutEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const FinalWorkingMap = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('🔄 Loading final map...');
  const [mapReady, setMapReady] = useState(false);

  useLayoutEffect(() => {
    const createFinalMap = () => {
      if (!window.google || !window.google.maps || !window.googleMapsReady) {
        setTimeout(createFinalMap, 100);
        return;
      }

      try {
        console.log('🎯 Creating FINAL working Google Map...');
        
        const container = mapContainerRef.current;
        if (!container) {
          console.error('❌ Map container ref not available');
          return;
        }

        console.log('✅ Container ref found:', container.id);

        // Create Google Map directly in the ref'd container
        const map = new window.google.maps.Map(container, {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 13,
          mapTypeId: 'roadmap',
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          mapTypeControl: true
        });

        // Store map reference
        mapRef.current = map;
        window.finalWorkingMap = map;

        // Add marker
        const marker = new window.google.maps.Marker({
          position: { lat: 37.7749, lng: -122.4194 },
          map: map,
          title: '🎯 AquaRide - FINAL Working Map!'
        });

        // Success handlers
        map.addListener('tilesloaded', () => {
          console.log('🎯 FINAL map tiles loaded!');
          setMapReady(true);
          setRequestStatus('✅ FINAL map ready! Google Maps working!');
        });

        map.addListener('idle', () => {
          console.log('🎯 FINAL map idle - checking elements...');
          
          // Check what's in the container now
          const elements = container.querySelectorAll('*');
          const canvases = container.querySelectorAll('canvas');
          const gmStyle = container.querySelector('.gm-style');
          
          console.log(`🎯 Container has: ${elements.length} elements, ${canvases.length} canvas, ${gmStyle ? 'GM-Style' : 'no GM-Style'}`);
          
          if (!mapReady) {
            setMapReady(true);
            setRequestStatus('✅ FINAL map ready and idle!');
          }
        });

        // Force resize
        setTimeout(() => {
          window.google.maps.event.trigger(map, 'resize');
          map.setCenter({ lat: 37.7749, lng: -122.4194 });
          console.log('🎯 FINAL map resize triggered');
        }, 1000);

        console.log('🎯 FINAL Google Map created successfully');

      } catch (error) {
        console.error('❌ FINAL map creation failed:', error);
        setRequestStatus(`❌ Final map error: ${error.message}`);
      }
    };

    // Use layoutEffect to run before React paints
    createFinalMap();
  }, []); // Empty dependency array - run once

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
    const map = mapRef.current || window.finalWorkingMap;
    if (!navigator.geolocation || !map) {
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
        
        map.panTo(pos);
        map.setZoom(15);
        
        new window.google.maps.Marker({
          position: pos,
          map: map,
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
        background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '600' }}>
            🎯 AquaRide - FINAL Working Google Maps
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
                disabled={!mapReady}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  cursor: mapReady ? 'pointer' : 'not-allowed',
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

      {/* FINAL MAP CONTAINER - Using React ref, no innerHTML manipulation */}
      <div 
        ref={mapContainerRef}
        id="final-map-container"
        style={{ 
          flex: 1,
          width: '100%',
          height: '500px',
          minHeight: '500px',
          backgroundColor: '#fff3cd',
          position: 'relative',
          border: '3px solid #dc3545' // Red border for final version
        }}
      >
        {!mapReady && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #dc3545',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              🎯 Loading FINAL Map...
            </p>
            <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
              Using React ref - no DOM manipulation
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Final map container styles */
        #final-map-container {
          pointer-events: auto !important;
          touch-action: manipulation !important;
        }
        
        /* Force all Google Maps elements to be visible */
        #final-map-container * {
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        #final-map-container .gm-style {
          width: 100% !important;
          height: 100% !important;
        }
        
        #final-map-container canvas,
        #final-map-container img {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default FinalWorkingMap;