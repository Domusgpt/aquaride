import React, { useEffect, useRef } from 'react';

const TestGoogleMaps = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAryOSh5s8BcbxhP3klG_Gu0pOMzDntWwg&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      console.log('Google Maps API loaded successfully');
      
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 13,
      });

      // Add a marker
      new window.google.maps.Marker({
        position: { lat: 37.7749, lng: -122.4194 },
        map: map,
        title: 'San Francisco Bay Area'
      });
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.initMap;
    };
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <h2 style={{ padding: '20px', margin: 0, backgroundColor: '#f8f9fa' }}>
        🗺️ Google Maps API Test
      </h2>
      <div 
        ref={mapRef}
        style={{ 
          height: 'calc(100vh - 80px)',
          width: '100%'
        }}
      />
    </div>
  );
};

export default TestGoogleMaps;