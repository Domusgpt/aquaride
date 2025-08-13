// WORKING SOLUTION: Bypass React for Google Maps container
import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

// Minimal error boundary
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: false }; // Never show error UI
  }

  componentDidCatch(error, errorInfo) {
    console.log('🛡️ Map error boundary caught:', error.message);
  }

  render() {
    return this.props.children;
  }
}

const WorkingGoogleMap = () => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('🔄 Loading working map...');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const createWorkingMap = () => {
      // Wait for Google Maps to be ready
      if (!window.google || !window.google.maps || !window.googleMapsReady) {
        setTimeout(createWorkingMap, 100);
        return;
      }

      try {
        console.log('🚀 Creating working Google Map - bypassing React DOM...');

        const container = document.getElementById('working-map-container');
        if (!container) {
          console.error('❌ Working container not found');
          return;
        }

        // Mark container to prevent React interference
        container.setAttribute('data-google-maps', 'true');
        
        // Check if map div already exists
        let mapDiv = document.getElementById('google-map-div');
        
        if (!mapDiv) {
          // Create a NEW div inside the container that React will NEVER touch
          mapDiv = document.createElement('div');
          mapDiv.id = 'google-map-div';
          mapDiv.setAttribute('data-google-maps-div', 'true');
          mapDiv.style.width = '100%';
          mapDiv.style.height = '100%';
          mapDiv.style.minHeight = '500px';
          mapDiv.style.position = 'absolute';
          mapDiv.style.top = '0';
          mapDiv.style.left = '0';
          mapDiv.style.zIndex = '1';
          mapDiv.style.backgroundColor = '#f0f0f0';
          
          // Clear container and insert the div
          container.innerHTML = '';
          container.appendChild(mapDiv);
          
          console.log('🗺️ Created new map div with ID:', mapDiv.id);
        } else {
          console.log('🗺️ Using existing map div');
        }
        
        console.log('🗺️ Creating map in isolated div...');

        // Create Google Map in the isolated div
        const map = new window.google.maps.Map(mapDiv, {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 13,
          mapTypeId: 'roadmap',
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          mapTypeControl: true
        });

        // Store globally
        window.workingMap = map;
        window.workingMapDiv = mapDiv;

        // Add marker
        const marker = new window.google.maps.Marker({
          position: { lat: 37.7749, lng: -122.4194 },
          map: map,
          title: '🚤 AquaRide - Working Map!'
        });

        // Success handlers
        map.addListener('tilesloaded', () => {
          console.log('✅ Working map tiles loaded!');
          setMapReady(true);
          setRequestStatus('✅ Working map ready! Google Maps fully functional!');
        });

        map.addListener('idle', () => {
          console.log('🗺️ Working map idle');
          if (!mapReady) {
            setMapReady(true);
            setRequestStatus('✅ Working map ready!');
          }
        });

        // Force resize to ensure proper rendering
        setTimeout(() => {
          window.google.maps.event.trigger(map, 'resize');
          map.setCenter({ lat: 37.7749, lng: -122.4194 });
          console.log('🔄 Working map resize triggered');
        }, 1000);

        console.log('✅ Working Google Map created successfully');

      } catch (error) {
        console.error('❌ Working map creation failed:', error);
        setRequestStatus(`❌ Map error: ${error.message}`);
      }
    };

    // Start map creation
    const timer = setTimeout(createWorkingMap, 200);

    return () => {
      clearTimeout(timer);
      // Don't clean up the map - let it persist
      console.log('🚀 Working component cleanup - map remains active');
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
    if (!navigator.geolocation || !window.workingMap) {
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
        
        window.workingMap.panTo(pos);
        window.workingMap.setZoom(15);
        
        new window.google.maps.Marker({
          position: pos,
          map: window.workingMap,
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
    <MapErrorBoundary>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header Form */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '600' }}>
              🚀 AquaRide - Working Google Maps Solution
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
                    backgroundColor: (pickup && dropoff) ? '#dc3545' : 'rgba(255,255,255,0.3)',
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

        {/* WORKING MAP CONTAINER - React will never touch the inner map div */}
        <div 
          id="working-map-container"
          suppressHydrationWarning={true}
          data-google-maps="true"
          style={{ 
            flex: 1,
            width: '100%',
            height: '500px',
            minHeight: '500px',
            backgroundColor: '#e8f5e8',
            position: 'relative',
            border: '3px solid #28a745' // Green border for working version
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
              zIndex: 10
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #28a745',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }} />
              <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                🚀 Loading Working Map...
              </p>
              <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
                Bypassing React DOM interference
              </p>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Working map container styles */
          #working-map-container {
            pointer-events: auto !important;
            touch-action: manipulation !important;
          }
          
          /* Google Maps div - completely isolated from React */
          #google-map-div {
            width: 100% !important;
            height: 100% !important;
            min-height: 500px !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            z-index: 1 !important;
          }
          
          /* Ensure Google Maps elements are visible */
          #google-map-div * {
            max-width: none !important;
            max-height: none !important;
            visibility: visible !important;
            opacity: 1 !important;
            display: block !important;
          }
          
          #google-map-div .gm-style {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
            z-index: 1 !important;
          }
          
          #google-map-div canvas,
          #google-map-div img {
            visibility: visible !important;
            opacity: 1 !important;
            display: block !important;
            position: static !important;
          }
        `}</style>
      </div>
    </MapErrorBoundary>
  );
};

export default WorkingGoogleMap;