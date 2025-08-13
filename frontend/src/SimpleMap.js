// SIMPLE WORKING: Copy the successful HTML approach exactly
import React, { useEffect, useState } from 'react';

const SimpleMap = () => {
  const [requestStatus, setRequestStatus] = useState('🔄 Loading simple map...');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Wait for Google Maps to be ready
    const checkAndCreateMap = () => {
      if (!window.google || !window.google.maps || !window.googleMapsReady) {
        setTimeout(checkAndCreateMap, 100);
        return;
      }

      try {
        console.log('🚤 Creating SIMPLE working Google Map...');
        
        // Get the container
        const mapDiv = document.getElementById('simple-map');
        if (!mapDiv) {
          console.error('❌ Simple map container not found');
          return;
        }

        console.log('✅ Found simple map container');

        // Create the map exactly like the working HTML version
        const map = new window.google.maps.Map(mapDiv, {
          center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
          zoom: 13,
          mapTypeId: 'roadmap'
        });

        // Add a marker
        const marker = new window.google.maps.Marker({
          position: { lat: 37.7749, lng: -122.4194 },
          map: map,
          title: '🚤 AquaRide Simple Test'
        });

        // Store globally
        window.simpleWorkingMap = map;

        // Success!
        console.log('🚤 SIMPLE Google Maps created successfully!');
        setMapReady(true);
        setRequestStatus('✅ SIMPLE map working perfectly!');

        // Test click event
        map.addListener('click', function(event) {
          console.log('🖱️ Simple map clicked at:', event.latLng.toString());
          setRequestStatus('✅ Simple map is interactive! Click detected: ' + event.latLng.toString());
        });

      } catch (error) {
        console.error('❌ Simple map creation failed:', error);
        setRequestStatus('❌ ERROR: ' + error.message);
      }
    };

    checkAndCreateMap();
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
        color: 'white'
      }}>
        <h2 style={{ margin: '0 0 20px 0' }}>
          🚤 AquaRide - Simple Working Maps  
        </h2>
        
        {requestStatus && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            whiteSpace: 'pre-line'
          }}>
            {requestStatus}
          </div>
        )}
      </div>

      {/* THE MAP - Copy the exact working HTML structure */}
      <div 
        id="simple-map"
        style={{ 
          flex: 1,
          height: '500px',
          width: '100%',
          border: '3px solid #007bff',
          borderRadius: '10px',
          backgroundColor: '#f0f0f0'
        }}
      />
    </div>
  );
};

export default SimpleMap;