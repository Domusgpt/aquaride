import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

// Error Boundary Component
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Map Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          backgroundColor: '#f8f9fa',
          padding: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
          <h2 style={{ color: '#dc3545', marginBottom: '10px' }}>Map Error</h2>
          <p style={{ color: '#666', marginBottom: '20px', textAlign: 'center' }}>
            Something went wrong with the map. This is likely a React/Google Maps integration issue.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ReactSafeGoogleMap = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('🔄 Loading map...');
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebug = useCallback((message) => {
    console.log('SAFE MAP DEBUG:', message);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const loadGoogleMaps = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        addDebug('Google Maps already loaded');
        resolve(window.google);
        return;
      }

      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        reject(new Error('Google Maps API key not found'));
        return;
      }

      addDebug('Loading Google Maps API...');
      
      const script = document.createElement('script');
      const callbackName = `initGoogleMaps_${Date.now()}`;
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&loading=async`;
      script.async = true;
      script.defer = true;

      window[callbackName] = () => {
        addDebug('Google Maps API loaded successfully');
        delete window[callbackName];
        resolve(window.google);
      };

      script.onerror = (error) => {
        addDebug('Failed to load Google Maps API');
        reject(error);
      };

      document.head.appendChild(script);
    });
  }, [addDebug]);

  const initializeMap = useCallback(async () => {
    try {
      if (!mapContainerRef.current) {
        addDebug('Map container not available');
        return;
      }

      addDebug('Initializing Google Maps...');
      const google = await loadGoogleMaps();

      // Create map with basic options
      const mapOptions = {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false
      };

      addDebug('Creating map instance...');
      const mapInstance = new google.maps.Map(mapContainerRef.current, mapOptions);
      
      // Store reference
      mapInstanceRef.current = mapInstance;

      // Add a simple marker
      const marker = new google.maps.Marker({
        position: { lat: 37.7749, lng: -122.4194 },
        map: mapInstance,
        title: 'San Francisco Bay Area'
      });

      addDebug('Map initialized successfully');
      setIsLoaded(true);
      setRequestStatus('✅ Map ready! Enter pickup and dropoff locations.');

      // Test map interaction
      mapInstance.addListener('click', () => {
        addDebug('Map clicked - working!');
      });

    } catch (error) {
      addDebug(`Map initialization failed: ${error.message}`);
      setRequestStatus('❌ Failed to load map: ' + error.message);
    }
  }, [loadGoogleMaps, addDebug]);

  // Initialize map on mount
  useEffect(() => {
    addDebug('Component mounted');
    initializeMap();
    
    // Cleanup function
    return () => {
      addDebug('Component unmounting');
      if (mapInstanceRef.current) {
        // Clean up map instance
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap]);

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

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !mapInstanceRef.current) {
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
        
        mapInstanceRef.current.panTo(pos);
        mapInstanceRef.current.setZoom(15);
        
        // Add current location marker
        new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          title: 'Your Current Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }
        });

        setRequestStatus('✅ Location updated!');
        addDebug('User location updated');
      },
      () => {
        setRequestStatus('❌ Unable to get location.');
        addDebug('Location access denied');
      }
    );
  }, [addDebug]);

  return (
    <MapErrorBoundary>
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

        {/* Debug Info - Compact */}
        {debugInfo.length > 0 && (
          <div style={{
            padding: '8px 20px',
            backgroundColor: '#e9ecef',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#495057',
            borderBottom: '1px solid #dee2e6'
          }}>
            <strong>Debug:</strong> {debugInfo[debugInfo.length - 1]}
          </div>
        )}

        {/* Map Container - React Safe */}
        <div 
          ref={mapContainerRef}
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
                Loading Google Maps...
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
    </MapErrorBoundary>
  );
};

export default ReactSafeGoogleMap;