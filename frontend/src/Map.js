import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const Map = () => {
  const position = [51.505, -0.09]; // Default position

  return (
    <div className="map-container">
      <div className="map-overlay"></div>
      <div className="map-controls">
        <h3>Request a Ride</h3>
        <form>
          <div className="form-group">
            <label>Pickup</label>
            <input type="text" placeholder="Enter pickup location" />
          </div>
          <div className="form-group">
            <label>Dropoff</label>
            <input type="text" placeholder="Enter dropoff location" />
          </div>
          <button type="submit" className="cyber-button">Find a Ride</button>
        </form>
      </div>
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default Map;
