import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase-simple';
import './OperationsCenter.css';

const OperationsCenter = () => {
  const [activeRides, setActiveRides] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [emergencies, setEmergencies] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading, setLoading] = useState(true);

  // Real-time active rides listener
  useEffect(() => {
    const ridesQuery = query(
      collection(db, 'rides'),
      where('status', 'in', ['pending', 'active']),
      orderBy('startTime', 'desc')
    );

    const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
      const rides = [];
      snapshot.forEach((doc) => {
        rides.push({ id: doc.id, ...doc.data() });
      });
      setActiveRides(rides);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time captains listener
  useEffect(() => {
    const captainsQuery = query(
      collection(db, 'captains'),
      orderBy('status', 'asc')
    );

    const unsubscribe = onSnapshot(captainsQuery, (snapshot) => {
      const captainList = [];
      snapshot.forEach((doc) => {
        captainList.push({ id: doc.id, ...doc.data() });
      });
      setCaptains(captainList);
    });

    return () => unsubscribe();
  }, []);

  // Real-time metrics listener
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const metricsRef = doc(db, 'metrics', `daily-${today}`);

    const unsubscribe = onSnapshot(metricsRef, (doc) => {
      if (doc.exists()) {
        setMetrics(doc.data());
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time emergencies listener
  useEffect(() => {
    const emergenciesQuery = query(
      collection(db, 'emergencies'),
      where('status', 'in', ['reported', 'active', 'responding']),
      orderBy('reportedAt', 'desc')
    );

    const unsubscribe = onSnapshot(emergenciesQuery, (snapshot) => {
      const emergencyList = [];
      snapshot.forEach((doc) => {
        emergencyList.push({ id: doc.id, ...doc.data() });
      });
      setEmergencies(emergencyList);
    });

    return () => unsubscribe();
  }, []);

  // Dispatch backup captain
  const dispatchBackup = async (rideId, emergencyId) => {
    try {
      // Find available captain closest to emergency
      const availableCaptains = captains.filter(c => c.status === 'available');
      if (availableCaptains.length === 0) {
        alert('No available captains for backup dispatch');
        return;
      }

      const backupCaptain = availableCaptains[0]; // Simplified selection
      
      await updateDoc(doc(db, 'emergencies', emergencyId), {
        'protocol.backupCaptainId': backupCaptain.id,
        'protocol.backupCaptainDispatched': true,
        'protocol.backupETA': 15, // Estimated time
        updatedAt: new Date()
      });

      await updateDoc(doc(db, 'captains', backupCaptain.id), {
        status: 'emergency_response',
        updatedAt: new Date()
      });

      console.log('✅ Backup captain dispatched:', backupCaptain.displayName);
    } catch (error) {
      console.error('Error dispatching backup:', error);
    }
  };

  // Broadcast message to all captains
  const broadcastMessage = () => {
    const message = prompt('Enter message to broadcast to all active captains:');
    if (message) {
      console.log('📢 Broadcasting message:', message);
      // In production, this would use Cloud Functions to send notifications
      alert(`Message broadcast to ${captains.filter(c => c.status !== 'offline').length} captains`);
    }
  };

  if (loading) {
    return (
      <div className="operations-loading">
        <div className="loading-spinner">🌊</div>
        <div>Loading Operations Center...</div>
      </div>
    );
  }

  return (
    <div className="operations-center">
      {/* Header with Live Stats */}
      <div className="operations-header">
        <div className="operations-logo">
          <span className="live-indicator"></span>
          🌊 AquaRide Operations Center
        </div>
        <div className="live-stats">
          <div className="stat-item">
            <div className="stat-value">{activeRides.length}</div>
            <div className="stat-label">Active Rides</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{captains.filter(c => c.status !== 'offline').length}</div>
            <div className="stat-label">Captains Online</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">${metrics.totalRevenue?.toLocaleString() || 0}</div>
            <div className="stat-label">Today's Revenue</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{metrics.customerSatisfaction || 0}⭐</div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>
      </div>

      <div className="operations-grid">
        {/* Captain Management Panel */}
        <div className="panel captains-panel">
          <h3 className="panel-title">👨‍✈️ Fleet Status</h3>
          <div className="captains-list">
            {captains.map((captain) => (
              <div key={captain.id} className={`captain-item ${captain.status}`}>
                <div className="captain-info">
                  <div className="captain-name">{captain.displayName}</div>
                  <div className="captain-details">
                    <span className={`status-badge ${captain.status}`}>
                      {captain.status === 'available' && '🟢 Available'}
                      {captain.status === 'busy' && '🟡 On Trip'}
                      {captain.status === 'offline' && '🔴 Offline'}
                      {captain.status === 'emergency' && '🚨 Emergency'}
                    </span>
                    <span className="captain-stats">
                      {captain.stats?.totalRides || 0} rides
                    </span>
                  </div>
                </div>
                <div className="captain-location">
                  📍 {captain.currentLocation ? 
                    `${captain.currentLocation.lat.toFixed(4)}, ${captain.currentLocation.lng.toFixed(4)}` : 
                    'Unknown'
                  }
                </div>
              </div>
            ))}
          </div>
          
          <div className="captain-actions">
            <button className="btn btn-primary" onClick={broadcastMessage}>
              📢 Broadcast
            </button>
            <button className="btn btn-emergency">
              🚨 Emergency Alert
            </button>
          </div>
        </div>

        {/* Live Rides Panel */}
        <div className="panel rides-panel">
          <h3 className="panel-title">🚤 Live Ride Management</h3>
          <div className="rides-table">
            <div className="table-header">
              <div>Ride ID</div>
              <div>Captain</div>
              <div>Route</div>
              <div>Status</div>
              <div>Duration</div>
              <div>Actions</div>
            </div>
            
            {activeRides.map((ride) => (
              <div 
                key={ride.id} 
                className={`table-row ${selectedRide?.id === ride.id ? 'selected' : ''}`}
                onClick={() => setSelectedRide(ride)}
              >
                <div className="ride-id">#{ride.id}</div>
                <div className="captain-name">
                  {captains.find(c => c.id === ride.captainId)?.displayName || 'Unknown'}
                </div>
                <div className="ride-route">
                  {ride.route?.pickup?.address} → {ride.route?.destination?.address}
                </div>
                <div className={`ride-status ${ride.status}`}>
                  {ride.status === 'pending' && '⏳ Pending'}
                  {ride.status === 'active' && '🟢 Active'}
                </div>
                <div className="ride-duration">
                  {ride.estimatedDuration || 60} min
                </div>
                <div className="ride-actions">
                  <button className="btn-small btn-primary">👁️ Track</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Map Panel */}
        <div className="panel map-panel">
          <h3 className="panel-title">🗺️ Live Fleet Tracking</h3>
          <div className="live-map">
            <div className="map-container">
              <div className="map-placeholder">
                <div className="map-title">🌊 Miami Waters</div>
                <div className="map-subtitle">Real-time boat tracking</div>
                
                {/* Simulated boat markers */}
                {captains.filter(c => c.status !== 'offline').map((captain, index) => (
                  <div 
                    key={captain.id}
                    className={`boat-marker ${captain.status}`}
                    style={{
                      top: `${30 + (index * 15)}%`,
                      left: `${20 + (index * 20)}%`
                    }}
                    title={captain.displayName}
                  >
                    🚤
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="panel metrics-panel">
          <h3 className="panel-title">📊 Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{metrics.totalRides || 0}</div>
              <div className="metric-label">Bookings Today</div>
              <div className="metric-change">+{Math.floor(Math.random() * 20)}% vs yesterday</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value">{metrics.completedRides || 0}</div>
              <div className="metric-label">Completed Rides</div>
              <div className="metric-change">98.2% completion rate</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value">{metrics.averageWaitTime || 8.5} min</div>
              <div className="metric-label">Avg Wait Time</div>
              <div className="metric-change">-1.2 min vs last week</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value">{emergencies.length}</div>
              <div className="metric-label">Active Incidents</div>
              <div className="metric-change">
                {emergencies.length === 0 ? '✅ All clear' : '⚠️ Requires attention'}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Management Panel */}
        {emergencies.length > 0 && (
          <div className="panel emergency-panel">
            <h3 className="panel-title">🚨 Emergency Management</h3>
            <div className="emergencies-list">
              {emergencies.map((emergency) => (
                <div key={emergency.id} className="emergency-item">
                  <div className="emergency-header">
                    <span className="emergency-type">{emergency.type}</span>
                    <span className="emergency-severity">{emergency.severity}</span>
                  </div>
                  <div className="emergency-details">
                    Captain: {captains.find(c => c.id === emergency.captainId)?.displayName}
                  </div>
                  <div className="emergency-location">
                    📍 {emergency.location?.lat.toFixed(4)}, {emergency.location?.lng.toFixed(4)}
                  </div>
                  <div className="emergency-actions">
                    <button 
                      className="btn-small btn-warning"
                      onClick={() => dispatchBackup(emergency.rideId, emergency.id)}
                    >
                      🚤 Dispatch Backup
                    </button>
                    <button className="btn-small btn-danger">
                      📞 Contact Coast Guard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsCenter;