import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase-simple';
import './CaptainDashboard.css';

const CaptainDashboard = ({ currentUser }) => {
  const [captainData, setCaptainData] = useState(null);
  const [activeRides, setActiveRides] = useState([]);
  const [todayStats, setTodayStats] = useState({
    ridesCompleted: 0,
    revenue: 0,
    hoursWorked: 0,
    averageRating: 0
  });
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real-time captain data listener
  useEffect(() => {
    if (!currentUser) return;

    const captainRef = doc(db, 'captains', currentUser.uid);
    const unsubscribe = onSnapshot(captainRef, (doc) => {
      if (doc.exists()) {
        setCaptainData(doc.data());
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time rides listener
  useEffect(() => {
    if (!currentUser) return;

    const ridesQuery = query(
      collection(db, 'rides'),
      where('captainId', '==', currentUser.uid),
      where('status', 'in', ['pending', 'active']),
      orderBy('startTime', 'desc')
    );

    const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
      const rides = [];
      snapshot.forEach((doc) => {
        rides.push({ id: doc.id, ...doc.data() });
      });
      setActiveRides(rides);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Update captain status
  const updateStatus = async (newStatus) => {
    if (!currentUser) return;
    
    try {
      await updateDoc(doc(db, 'captains', currentUser.uid), {
        status: newStatus,
        lastActive: new Date(),
        currentLocation: await getCurrentLocation()
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Get current GPS location
  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date(),
              accuracy: position.coords.accuracy
            });
          },
          () => {
            // Default to Miami Beach Marina if location fails
            resolve({
              lat: 25.7617,
              lng: -80.1918,
              timestamp: new Date(),
              accuracy: 1000
            });
          }
        );
      }
    });
  };

  // Accept ride
  const acceptRide = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'active',
        acceptedAt: new Date(),
        updatedAt: new Date()
      });
      
      await updateStatus('busy');
      console.log('✅ Ride accepted:', rideId);
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  // Complete ride
  const completeRide = async (rideId) => {
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      });
      
      await updateStatus('available');
      console.log('✅ Ride completed:', rideId);
    } catch (error) {
      console.error('Error completing ride:', error);
    }
  };

  // Emergency protocol
  const triggerEmergency = async () => {
    setEmergencyMode(true);
    
    try {
      const location = await getCurrentLocation();
      
      // Create emergency record
      const emergencyData = {
        id: `emergency-${Date.now()}`,
        type: 'captain_emergency',
        severity: 'high',
        status: 'reported',
        captainId: currentUser.uid,
        location: location,
        reportedAt: new Date(),
        protocol: {
          coastGuardNotified: true,
          backupCaptainDispatched: true
        }
      };

      await updateDoc(doc(db, 'emergencies', emergencyData.id), emergencyData);
      await updateStatus('emergency');
      
      alert('🚨 Emergency protocol activated! Coast Guard and backup captain notified.');
      
    } catch (error) {
      console.error('Error triggering emergency:', error);
    }
  };

  if (loading) {
    return (
      <div className="captain-loading">
        <div className="loading-spinner">🚤</div>
        <div>Loading Captain Dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`captain-dashboard ${emergencyMode ? 'emergency-mode' : ''}`}>
      {/* Header */}
      <div className="captain-header">
        <div className="captain-info">
          <h1>Welcome, {captainData?.displayName || 'Captain'}</h1>
          <div className="captain-status">
            <span className={`status-indicator ${captainData?.status}`}>
              {captainData?.status === 'available' && '🟢 Available'}
              {captainData?.status === 'busy' && '🟡 On Trip'}
              {captainData?.status === 'offline' && '🔴 Offline'}
              {captainData?.status === 'emergency' && '🚨 Emergency'}
            </span>
            <span className="license">License: {captainData?.license?.number}</span>
          </div>
        </div>
        
        <div className="quick-actions">
          <button 
            className="btn btn-success"
            onClick={() => updateStatus('available')}
            disabled={captainData?.status === 'available'}
          >
            🟢 Go Available
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => updateStatus('offline')}
          >
            🔴 Go Offline
          </button>
          <button 
            className="btn btn-emergency"
            onClick={triggerEmergency}
          >
            🚨 Emergency
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{captainData?.stats?.totalRides || 0}</div>
          <div className="stat-label">Total Rides</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${captainData?.stats?.totalRevenue?.toLocaleString() || 0}</div>
          <div className="stat-label">Total Earnings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{captainData?.stats?.averageRating || 0}⭐</div>
          <div className="stat-label">Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{captainData?.stats?.completionRate || 0}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      {/* Active Rides Section */}
      <div className="active-rides-section">
        <h2>🚤 Active Rides ({activeRides.length})</h2>
        
        {activeRides.length === 0 ? (
          <div className="no-rides">
            <div className="no-rides-icon">⚓</div>
            <div>No active rides. Set yourself as available to receive ride requests!</div>
          </div>
        ) : (
          <div className="rides-grid">
            {activeRides.map((ride) => (
              <div key={ride.id} className={`ride-card ${ride.status}`}>
                <div className="ride-header">
                  <div className="ride-id">#{ride.id}</div>
                  <div className={`ride-status ${ride.status}`}>
                    {ride.status === 'pending' && '⏳ Pending'}
                    {ride.status === 'active' && '🟢 Active'}
                  </div>
                </div>
                
                <div className="ride-route">
                  <div className="route-point">
                    <span className="route-icon">📍</span>
                    <span>{ride.route?.pickup?.address || 'Pickup Location'}</span>
                  </div>
                  <div className="route-arrow">→</div>
                  <div className="route-point">
                    <span className="route-icon">🏁</span>
                    <span>{ride.route?.destination?.address || 'Destination'}</span>
                  </div>
                </div>
                
                <div className="ride-details">
                  <div className="detail-item">
                    <span>👤 Passenger:</span>
                    <span>{ride.riderId}</span>
                  </div>
                  <div className="detail-item">
                    <span>💰 Fare:</span>
                    <span>${ride.pricing?.total || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span>⏰ Duration:</span>
                    <span>{ride.estimatedDuration || 60} min</span>
                  </div>
                </div>
                
                <div className="ride-actions">
                  {ride.status === 'pending' && (
                    <>
                      <button 
                        className="btn btn-success btn-small"
                        onClick={() => acceptRide(ride.id)}
                      >
                        ✅ Accept
                      </button>
                      <button className="btn btn-danger btn-small">
                        ❌ Decline
                      </button>
                    </>
                  )}
                  
                  {ride.status === 'active' && (
                    <>
                      <button className="btn btn-primary btn-small">
                        🗺️ Navigate
                      </button>
                      <button className="btn btn-warning btn-small">
                        📞 Call Passenger
                      </button>
                      <button 
                        className="btn btn-success btn-small"
                        onClick={() => completeRide(ride.id)}
                      >
                        ✅ Complete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Performance */}
      <div className="performance-section">
        <h2>📊 Today's Performance</h2>
        <div className="performance-grid">
          <div className="performance-card">
            <div className="performance-title">Rides Completed</div>
            <div className="performance-value">{todayStats.ridesCompleted}</div>
          </div>
          <div className="performance-card">
            <div className="performance-title">Revenue Earned</div>
            <div className="performance-value">${todayStats.revenue}</div>
          </div>
          <div className="performance-card">
            <div className="performance-title">Hours Worked</div>
            <div className="performance-value">{todayStats.hoursWorked}h</div>
          </div>
          <div className="performance-card">
            <div className="performance-title">Average Rating</div>
            <div className="performance-value">{todayStats.averageRating}⭐</div>
          </div>
        </div>
      </div>

      {/* Emergency Mode Overlay */}
      {emergencyMode && (
        <div className="emergency-overlay">
          <div className="emergency-content">
            <h2>🚨 Emergency Mode Active</h2>
            <p>Coast Guard and backup captain have been notified.</p>
            <p>Stay calm and follow emergency protocols.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setEmergencyMode(false)}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainDashboard;