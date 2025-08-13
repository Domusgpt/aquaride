// CLEAN SIMPLE FIX - Just prevent React from touching the map container
import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const GoogleMapFixed = () => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('🔄 Loading map...');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const initMap = () => {
      if (!window.google || !window.google.maps || !window.googleMapsReady) {
        setTimeout(initMap, 100);
        return;
      }

      const container = document.getElementById('map');
      if (!container) return;

      // Create the map with basic configuration
      const map = new window.google.maps.Map(container, {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 13,
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeControl: true,
        // Ensure proper dimensions
        gestureHandling: 'auto'
      });

      // Force container styling to ensure proper display
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.minHeight = '500px';

      // Use regular Marker to avoid Map ID requirement
      const marker = new window.google.maps.Marker({
        position: { lat: 37.7749, lng: -122.4194 },
        map: map,
        title: '🚤 AquaRide'
      });

      window.aquaRideMap = map;
      
      map.addListener('tilesloaded', () => {
        console.log('✅ Map tiles loaded!');
        setMapReady(true);
        setRequestStatus('✅ Map ready!');
      });

      // Force resize after creation to ensure proper rendering
      setTimeout(() => {
        window.google.maps.event.trigger(map, 'resize');
        map.setCenter({ lat: 37.7749, lng: -122.4194 });
      }, 500);

      console.log('✅ Map created successfully');
    };

    initMap();
    
    // DON'T CLEAN UP - Let the map persist
    return () => {
      // Do nothing - don't touch the map
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
      
      setRequestStatus(`✅ Ride requested! ID: ${result.data.rideId}`);
    } catch (error) {
      setRequestStatus(`❌ Error: ${error.message}`);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation || !window.aquaRideMap) {
      setRequestStatus('❌ Location services not available.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        window.aquaRideMap.panTo(pos);
        window.aquaRideMap.setZoom(15);
        
        new window.google.maps.Marker({
          position: pos,
          map: window.aquaRideMap,
          title: 'Your Location'
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
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '600' }}>
            🚤 AquaRide - Google Maps
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
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {requestStatus}
            </div>
          )}
        </div>
      </div>

      {/* Map container - NO REACT CHILDREN, NO CONDITIONAL RENDERING */}
      <div 
        id="map"
        style={{ 
          flex: 1,
          width: '100%',
          minHeight: '500px',
          backgroundColor: '#e5e5e5',
          position: 'relative'
        }}
      />
    </div>
  );
};

// Wrap the component to catch React DOM errors
class GoogleMapWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Ignore removeChild errors - Google Maps is working fine
    if (error.message && error.message.includes('removeChild')) {
      console.log('🛡️ Caught React DOM error - map is fine');
      return { hasError: false }; // Don't show error UI
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (error.message && error.message.includes('removeChild')) {
      // Ignore - this is expected when Google Maps takes control
      return;
    }
    console.error('Map error:', error);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return <GoogleMapFixed />;
  }
}

export default GoogleMapWrapper;