import React, { useState, useEffect, useRef } from 'react';
// Removed Loader import - using script tag approach instead
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const GoogleMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [pickupAutocomplete, setPickupAutocomplete] = useState(null);
  const [dropoffAutocomplete, setDropoffAutocomplete] = useState(null);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [boatType, setBoatType] = useState('Speedboat');
  const [requestStatus, setRequestStatus] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);

  // Google Maps API Key from environment variable
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const initMap = async () => {
      try {
        // Check if Google Maps is already loaded
        if (!window.google) {
          // Load Google Maps API
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initGoogleMap`;
          script.async = true;
          script.defer = true;
          
          // Set up callback
          window.initGoogleMap = () => {
            console.log('Google Maps API loaded successfully');
            loadMapContent();
          };
          
          document.head.appendChild(script);
        } else {
          loadMapContent();
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setRequestStatus('Error loading Google Maps. Please check your internet connection.');
      }
    };

    const loadMapContent = () => {
      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(userPos);
            initializeMap(userPos);
          },
          () => {
            // Default to San Francisco Bay Area if location denied
            const defaultPos = { lat: 37.7749, lng: -122.4194 };
            setUserLocation(defaultPos);
            initializeMap(defaultPos);
          }
        );
      } else {
        const defaultPos = { lat: 37.7749, lng: -122.4194 };
        setUserLocation(defaultPos);
        initializeMap(defaultPos);
      }
    };

    const initializeMap = (center) => {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: 13,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0099ff' }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry.fill',
            stylers: [{ color: '#f0f8ff' }]
          }
        ]
      });

      setMap(mapInstance);

      // Add user location marker
      new window.google.maps.Marker({
        position: center,
        map: mapInstance,
        title: 'Your Location',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
      });

      // Initialize autocomplete for pickup
      if (pickupInputRef.current) {
        const pickupAC = new window.google.maps.places.Autocomplete(
          pickupInputRef.current,
          {
            types: ['establishment', 'geocode'],
            bounds: new window.google.maps.LatLngBounds(
              new window.google.maps.LatLng(center.lat - 0.1, center.lng - 0.1),
              new window.google.maps.LatLng(center.lat + 0.1, center.lng + 0.1)
            )
          }
        );
        
        pickupAC.addListener('place_changed', () => {
          const place = pickupAC.getPlace();
          if (place.geometry) {
            setPickup(place.formatted_address || place.name);
            mapInstance.panTo(place.geometry.location);
            
            // Add pickup marker
            new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapInstance,
              title: 'Pickup Location',
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
              }
            });
          }
        });
        
        setPickupAutocomplete(pickupAC);
      }

      // Initialize autocomplete for dropoff
      if (dropoffInputRef.current) {
        const dropoffAC = new window.google.maps.places.Autocomplete(
          dropoffInputRef.current,
          {
            types: ['establishment', 'geocode'],
            bounds: new window.google.maps.LatLngBounds(
              new window.google.maps.LatLng(center.lat - 0.1, center.lng - 0.1),
              new window.google.maps.LatLng(center.lat + 0.1, center.lng + 0.1)
            )
          }
        );
        
        dropoffAC.addListener('place_changed', () => {
          const place = dropoffAC.getPlace();
          if (place.geometry) {
            setDropoff(place.formatted_address || place.name);
            
            // Add dropoff marker
            new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapInstance,
              title: 'Dropoff Location',
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
              }
            });
          }
        });
        
        setDropoffAutocomplete(dropoffAC);
      }
    };

    initMap();
  }, []);

  const handleRequestRide = async (e) => {
    e.preventDefault();
    setRequestStatus('Requesting ride...');

    if (!auth.currentUser) {
      setRequestStatus('Please log in to request a ride.');
      return;
    }

    if (!pickup.trim() || !dropoff.trim()) {
      setRequestStatus('Please enter both pickup and dropoff locations.');
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
      
      console.log('Cloud Function response:', result.data);
      setRequestStatus(`🚢 Ride requested successfully! 
        Ride ID: ${result.data.rideId}
        ${result.data.message}
        
        A captain will be assigned shortly!`);
    } catch (error) {
      console.error('Error requesting ride:', error);
      setRequestStatus(`❌ Error: ${error.message}`);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          map.panTo(pos);
          map.setZoom(15);
          
          // Add current location marker
          new window.google.maps.Marker({
            position: pos,
            map: map,
            title: 'Current Location',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }
          });
        },
        () => {
          setRequestStatus('Error: Unable to get your location.');
        }
      );
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ride Request Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <form onSubmit={handleRequestRide} style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 200px 120px 120px', 
            gap: '15px',
            alignItems: 'center',
            '@media (max-width: 768px)': {
              gridTemplateColumns: '1fr',
              gap: '10px'
            }
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
                📍 Pickup Location
              </label>
              <input
                ref={pickupInputRef}
                type="text"
                placeholder="Enter pickup location..."
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ced4da',
                  fontSize: '16px'
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
                🎯 Dropoff Location
              </label>
              <input
                ref={dropoffInputRef}
                type="text"
                placeholder="Enter dropoff location..."
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ced4da',
                  fontSize: '16px'
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
                🚤 Boat Type
              </label>
              <select
                value={boatType}
                onChange={(e) => setBoatType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ced4da',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="Speedboat">🏎️ Speedboat</option>
                <option value="Yacht">🛥️ Yacht</option>
                <option value="Sailboat">⛵ Sailboat</option>
                <option value="Any">🚢 Any Available</option>
              </select>
            </div>
            
            <button
              type="button"
              onClick={getCurrentLocation}
              style={{
                padding: '12px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              📍 My Location
            </button>
            
            <button
              type="submit"
              disabled={!pickup || !dropoff}
              style={{
                padding: '12px',
                backgroundColor: pickup && dropoff ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: pickup && dropoff ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🚢 Request Ride
            </button>
          </div>
          
          {requestStatus && (
            <div style={{
              marginTop: '15px',
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: requestStatus.includes('Error') || requestStatus.includes('❌') 
                ? '#f8d7da' 
                : requestStatus.includes('🚢') 
                ? '#d4edda' 
                : '#fff3cd',
              border: requestStatus.includes('Error') || requestStatus.includes('❌')
                ? '1px solid #f5c6cb'
                : requestStatus.includes('🚢')
                ? '1px solid #c3e6cb'
                : '1px solid #ffeaa7',
              color: requestStatus.includes('Error') || requestStatus.includes('❌')
                ? '#721c24'
                : requestStatus.includes('🚢')
                ? '#155724'
                : '#856404',
              whiteSpace: 'pre-line',
              fontSize: '14px'
            }}>
              {requestStatus}
            </div>
          )}
        </form>
      </div>

      {/* Google Map */}
      <div 
        ref={mapRef}
        style={{ 
          flex: 1,
          width: '100%',
          minHeight: '500px'
        }}
      />
    </div>
  );
};

export default GoogleMap;