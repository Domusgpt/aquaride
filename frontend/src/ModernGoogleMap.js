import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const ModernGoogleMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('');
  const [markers, setMarkers] = useState([]);

  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);

  // Load Google Maps API dynamically with modern async approach
  const loadGoogleMapsAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve(window.google);
        return;
      }

      const script = document.createElement('script');
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        reject(new Error('Google Maps API key not found'));
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;

      window.initGoogleMapsCallback = () => {
        delete window.initGoogleMapsCallback;
        resolve(window.google);
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }, []);

  // Initialize map with modern practices
  const initializeMap = useCallback(async () => {
    try {
      const google = await loadGoogleMapsAPI();
      setIsLoaded(true);

      // Get user location or default to San Francisco Bay
      const defaultLocation = { lat: 37.7749, lng: -122.4194 };
      
      const getUserLocation = () => {
        return new Promise((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                });
              },
              () => resolve(defaultLocation)
            );
          } else {
            resolve(defaultLocation);
          }
        });
      };

      const userLocation = await getUserLocation();
      
      // Create map with modern configuration
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#4A90E2' }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry.fill',
            stylers: [{ color: '#f8f9fa' }]
          }
        ]
      });

      setMap(mapInstance);

      // Add user location marker using modern AdvancedMarkerElement
      const userMarker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: userLocation,
        title: 'Your Location'
      });

      setMarkers([userMarker]);

      // Setup modern autocomplete
      setupAutocomplete(google, mapInstance);

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setRequestStatus('❌ Failed to load Google Maps. Check your internet connection.');
    }
  }, [loadGoogleMapsAPI]);

  // Setup autocomplete with modern API
  const setupAutocomplete = (google, mapInstance) => {
    if (!pickupInputRef.current || !dropoffInputRef.current) return;

    const pickupAutocomplete = new google.maps.places.Autocomplete(
      pickupInputRef.current,
      { 
        types: ['establishment', 'geocode'],
        fields: ['place_id', 'geometry', 'name', 'formatted_address']
      }
    );

    const dropoffAutocomplete = new google.maps.places.Autocomplete(
      dropoffInputRef.current,
      { 
        types: ['establishment', 'geocode'],
        fields: ['place_id', 'geometry', 'name', 'formatted_address']
      }
    );

    pickupAutocomplete.addListener('place_changed', () => {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setPickup(place.formatted_address || place.name || '');
        mapInstance.panTo(place.geometry.location);
        
        // Add pickup marker
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstance,
          position: place.geometry.location,
          title: 'Pickup Location'
        });
        
        setMarkers(prev => [...prev.filter(m => m.title !== 'Pickup Location'), marker]);
      }
    });

    dropoffAutocomplete.addListener('place_changed', () => {
      const place = dropoffAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setDropoff(place.formatted_address || place.name || '');
        
        // Add dropoff marker
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstance,
          position: place.geometry.location,
          title: 'Dropoff Location'
        });
        
        setMarkers(prev => [...prev.filter(m => m.title !== 'Dropoff Location'), marker]);
      }
    });
  };

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !map) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        map.panTo(pos);
        map.setZoom(15);
        
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map: map,
          position: pos,
          title: 'Current Location'
        });
        
        setMarkers(prev => [...prev.filter(m => m.title !== 'Current Location'), marker]);
        setRequestStatus('📍 Location updated!');
      },
      () => {
        setRequestStatus('❌ Unable to get your location.');
      }
    );
  }, [map]);

  // Handle ride request
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

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Modern Form Header */}
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
                  ref={pickupInputRef}
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
                  ref={dropoffInputRef}
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
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (isLoaded) e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }}
              >
                📍 My Location
              </button>
              
              <button
                type="submit"
                disabled={!pickup || !dropoff || !isLoaded}
                style={{
                  padding: '12px 24px',
                  backgroundColor: (pickup && dropoff && isLoaded) ? '#28a745' : 'rgba(255,255,255,0.3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: (pickup && dropoff && isLoaded) ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease'
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

      {/* Modern Map Container */}
      <div 
        ref={mapRef}
        style={{ 
          flex: 1,
          width: '100%',
          minHeight: '400px',
          position: 'relative'
        }}
      >
        {!isLoaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1000
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
              Loading Google Maps...
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ModernGoogleMap;