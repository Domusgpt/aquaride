import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const UltraModernGoogleMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('');
  const [markers, setMarkers] = useState([]);
  const [loadError, setLoadError] = useState('');

  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);

  // Load Google Maps API with latest 2025 approach
  const loadGoogleMapsAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Prevent multiple loads
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        resolve(window.google);
        return;
      }

      // Clear any existing scripts to prevent conflicts
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        const error = 'Google Maps API key not found in environment variables';
        setLoadError(error);
        reject(new Error(error));
        return;
      }

      const script = document.createElement('script');
      const callbackName = 'initGoogleMapsCallback' + Date.now();
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=${callbackName}&loading=async&v=weekly`;
      script.async = true;
      script.defer = true;

      window[callbackName] = () => {
        delete window[callbackName];
        setIsLoaded(true);
        resolve(window.google);
      };

      script.onerror = (error) => {
        setLoadError('Failed to load Google Maps API');
        reject(error);
      };

      document.head.appendChild(script);
    });
  }, []);

  // Initialize map
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      const google = await loadGoogleMapsAPI();

      // Get user location
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
              () => resolve({ lat: 37.7749, lng: -122.4194 }) // San Francisco Bay default
            );
          } else {
            resolve({ lat: 37.7749, lng: -122.4194 });
          }
        });
      };

      const userLocation = await getUserLocation();
      
      // Create map with optimal settings
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative',
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
          },
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      setMap(mapInstance);

      // Add user location marker with modern API
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        const userMarker = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstance,
          position: userLocation,
          title: 'Your Location'
        });
        setMarkers([userMarker]);
      } else {
        // Fallback to regular marker if AdvancedMarkerElement not available
        const userMarker = new google.maps.Marker({
          map: mapInstance,
          position: userLocation,
          title: 'Your Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }
        });
        setMarkers([userMarker]);
      }

      // Setup modern place autocomplete
      setupPlaceAutocomplete(google, mapInstance);

      setRequestStatus('🗺️ Map loaded successfully! Enter pickup and dropoff locations.');

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setLoadError('Failed to initialize Google Maps: ' + error.message);
      setRequestStatus('❌ Failed to load Google Maps. Please refresh the page.');
    }
  }, [loadGoogleMapsAPI]);

  // Setup place autocomplete with latest 2025 API
  const setupPlaceAutocomplete = (google, mapInstance) => {
    if (!pickupInputRef.current || !dropoffInputRef.current) return;

    try {
      // Use the latest PlaceAutocompleteElement if available
      if (google.maps.places.PlaceAutocompleteElement) {
        // Modern approach for 2025
        const pickupAutocomplete = new google.maps.places.PlaceAutocompleteElement({
          types: ['establishment', 'geocode']
        });
        
        const dropoffAutocomplete = new google.maps.places.PlaceAutocompleteElement({
          types: ['establishment', 'geocode']
        });

        // Replace input elements with autocomplete elements
        pickupInputRef.current.parentNode.replaceChild(pickupAutocomplete, pickupInputRef.current);
        dropoffInputRef.current.parentNode.replaceChild(dropoffAutocomplete, dropoffInputRef.current);

        // Set up event listeners
        pickupAutocomplete.addEventListener('gmp-placeselect', (event) => {
          const place = event.detail.place;
          if (place.geometry && place.geometry.location) {
            setPickup(place.displayName || place.formattedAddress || '');
            mapInstance.panTo(place.geometry.location);
            addMarker(google, mapInstance, place.geometry.location, 'Pickup Location', 'green');
          }
        });

        dropoffAutocomplete.addEventListener('gmp-placeselect', (event) => {
          const place = event.detail.place;
          if (place.geometry && place.geometry.location) {
            setDropoff(place.displayName || place.formattedAddress || '');
            addMarker(google, mapInstance, place.geometry.location, 'Dropoff Location', 'red');
          }
        });

      } else {
        // Fallback to traditional Autocomplete with error suppression
        console.warn('Using legacy Autocomplete API as fallback');
        
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
            addMarker(google, mapInstance, place.geometry.location, 'Pickup Location', 'green');
          }
        });

        dropoffAutocomplete.addListener('place_changed', () => {
          const place = dropoffAutocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            setDropoff(place.formatted_address || place.name || '');
            addMarker(google, mapInstance, place.geometry.location, 'Dropoff Location', 'red');
          }
        });
      }
    } catch (error) {
      console.warn('Autocomplete setup failed:', error);
      setRequestStatus('⚠️ Place search may not work properly. You can still enter addresses manually.');
    }
  };

  // Add marker helper function
  const addMarker = (google, mapInstance, position, title, color) => {
    try {
      let marker;
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstance,
          position: position,
          title: title
        });
      } else {
        marker = new google.maps.Marker({
          map: mapInstance,
          position: position,
          title: title,
          icon: {
            url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
          }
        });
      }
      
      setMarkers(prev => [...prev.filter(m => m.title !== title), marker]);
    } catch (error) {
      console.warn('Failed to add marker:', error);
    }
  };

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !map) {
      setRequestStatus('❌ Geolocation not supported by your browser.');
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
        
        try {
          const google = window.google;
          addMarker(google, map, pos, 'Current Location', 'blue');
          setRequestStatus('✅ Location updated!');
        } catch (error) {
          setRequestStatus('✅ Location updated (marker failed)');
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setRequestStatus('❌ Unable to get your location. Please enable location services.');
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

  if (loadError) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
        <h2 style={{ color: '#dc3545', marginBottom: '10px' }}>Map Loading Error</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>{loadError}</p>
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

      {/* Map Container */}
      <div 
        ref={mapRef}
        style={{ 
          flex: 1,
          width: '100%',
          minHeight: '400px',
          position: 'relative',
          backgroundColor: '#f0f0f0'
        }}
      >
        {!isLoaded && !loadError && (
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
  );
};

export default UltraModernGoogleMap;