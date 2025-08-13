import React, { useState, useEffect, useRef } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const SimpleWorkingMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('🔄 Initializing...');
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebug = (message) => {
    console.log('MAP DEBUG:', message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addDebug('Component mounted, starting map initialization...');
    
    // Prevent multiple initializations from React StrictMode
    if (window.mapInitializing) {
      addDebug('Map already initializing, skipping...');
      return;
    }
    
    window.mapInitializing = true;
    
    const initializeMap = async () => {
      try {
        addDebug('Checking for existing Google Maps...');
        
        // Clean up any existing scripts
        const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
        addDebug(`Found ${existingScripts.length} existing Google Maps scripts`);
        
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        addDebug(`API Key available: ${apiKey ? 'YES' : 'NO'}`);
        
        if (!apiKey) {
          throw new Error('API Key not found in environment variables');
        }

        // If Google Maps already loaded, use it
        if (window.google && window.google.maps && window.google.maps.Map) {
          addDebug('Google Maps already loaded, initializing map...');
          createMap();
          return;
        }

        addDebug('Loading Google Maps script...');
        setRequestStatus('🔄 Loading Google Maps API...');

        // Load Google Maps with callback
        const script = document.createElement('script');
        const callbackName = 'initMap' + Math.random().toString(36).substr(2, 9);
        
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        window[callbackName] = () => {
          addDebug('Google Maps callback triggered');
          delete window[callbackName];
          createMap();
        };

        script.onerror = (error) => {
          addDebug('Script loading failed: ' + error);
          setRequestStatus('❌ Failed to load Google Maps');
        };

        addDebug('Appending script to document...');
        document.head.appendChild(script);

      } catch (error) {
        addDebug('Initialize error: ' + error.message);
        setRequestStatus('❌ Error: ' + error.message);
      }
    };

    const createMap = () => {
      try {
        addDebug('createMap function called');
        
        if (!mapRef.current) {
          addDebug('ERROR: mapRef.current is null');
          return;
        }

        if (!window.google) {
          addDebug('ERROR: window.google not available');
          return;
        }

        if (!window.google.maps) {
          addDebug('ERROR: window.google.maps not available');
          return;
        }

        if (!window.google.maps.Map) {
          addDebug('ERROR: window.google.maps.Map not available');
          return;
        }

        addDebug('All Google Maps dependencies available, creating map...');
        setRequestStatus('🗺️ Creating map...');

        // Double-check mapRef is still valid
        if (!mapRef.current) {
          addDebug('ERROR: mapRef.current became null during initialization');
          window.mapInitializing = false;
          return;
        }

        const mapOptions = {
          center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
          zoom: 13,
          mapTypeId: 'roadmap'
        };

        addDebug('Map options: ' + JSON.stringify(mapOptions));
        addDebug('Map container element: ' + (mapRef.current ? 'FOUND' : 'NOT FOUND'));

        const mapInstance = new window.google.maps.Map(mapRef.current, mapOptions);
        
        addDebug('Map instance created successfully');
        setMap(mapInstance);
        setIsLoaded(true);
        setRequestStatus('✅ Map loaded successfully! Ready to book rides.');

        // Add a simple marker
        const marker = new window.google.maps.Marker({
          position: { lat: 37.7749, lng: -122.4194 },
          map: mapInstance,
          title: 'San Francisco Bay Area'
        });

        addDebug('Marker added successfully');

        // Test map interaction
        mapInstance.addListener('click', () => {
          addDebug('Map clicked - interaction working!');
        });

        // Mark initialization complete
        window.mapInitializing = false;

      } catch (error) {
        addDebug('createMap error: ' + error.message);
        setRequestStatus('❌ Map creation failed: ' + error.message);
        window.mapInitializing = false;
      }
    };

    initializeMap();
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
    if (!navigator.geolocation || !map) {
      setRequestStatus('❌ Geolocation not supported.');
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
          title: 'Your Current Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }
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

      {/* Debug Info */}
      {debugInfo.length > 0 && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8f9fa',
          fontSize: '12px',
          fontFamily: 'monospace',
          maxHeight: '200px',
          overflowY: 'auto',
          borderBottom: '1px solid #ddd'
        }}>
          <strong>Debug Log:</strong>
          {debugInfo.map((info, index) => (
            <div key={index} style={{ margin: '2px 0' }}>
              {info}
            </div>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef}
        style={{ 
          flex: 1,
          width: '100%',
          minHeight: '400px',
          position: 'relative',
          backgroundColor: '#e0e0e0',
          border: '2px solid #ccc'
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
            <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>
              Loading Map...
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SimpleWorkingMap;