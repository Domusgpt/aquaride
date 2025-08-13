import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-simple';

// Production Components
import CaptainDashboard from './CaptainDashboard';
import OperationsCenter from './OperationsCenter';
import SupportPanel from './SupportPanel';
import GoogleMapFixed from './GoogleMapFixed';
import Login from './Login';
import Register from './Register';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Get user role from custom claims or Firestore - FULL FIREBASE AUTH
        try {
          const idTokenResult = await user.getIdTokenResult();
          const role = idTokenResult.claims?.role;
          
          if (role) {
            setUserRole(role);
            console.log('✅ Role from custom claims:', role);
          } else {
            // Fallback: check Firestore for role
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // ✅ Handle both new 'role' field and legacy 'isCaptain' field
              const userRole = userData.role || (userData.isCaptain ? 'captain' : 'rider');
              setUserRole(userRole);
              console.log('✅ Role from Firestore:', userRole, 'userData:', userData);
            } else {
              // Email-based fallback for demo users with conflict resolution
              let emailRole = 'rider';
              if (user.email?.includes('captain@')) emailRole = 'captain';
              else if (user.email?.includes('admin@')) emailRole = 'admin';
              else if (user.email?.includes('support@')) emailRole = 'support';
              
              // Handle Gmail accounts used for multiple roles - default to rider unless captain@ prefix
              if (user.email?.includes('@gmail.com') && !user.email?.includes('captain@')) {
                emailRole = 'rider';
                console.log('🔄 Gmail account detected - defaulting to rider role to avoid conflicts');
              }
              
              setUserRole(emailRole);
              console.log('✅ Role from email fallback:', emailRole);
              
              // Create user profile in Firestore to avoid future confusion
              try {
                await setDoc(doc(db, 'users', user.uid), {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName || user.email.split('@')[0],
                  role: emailRole,
                  createdAt: new Date(),
                  lastLogin: new Date()
                });
                console.log('✅ User profile created in Firestore');
              } catch (profileError) {
                console.error('⚠️ Error creating user profile:', profileError);
              }
            }
          }
        } catch (error) {
          console.error('Error getting user role:', error);
          // Final fallback
          const emailRole = user.email?.includes('captain@') ? 'captain' : 
                           user.email?.includes('admin@') ? 'admin' : 'rider';
          setUserRole(emailRole);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign out function
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('✅ User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Role-based route protection
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" />;
    }
    
    return children;
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">🚤</div>
        <div>Loading AquaRide...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        {/* Navigation */}
        <nav className="navbar">
          <div className="navbar-title">
            🌊 AquaRide
            {userRole && (
              <span className="user-role">{userRole}</span>
            )}
          </div>
          
          <ul className="navbar-links">
            {!currentUser ? (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            ) : (
              <>
                {/* Role-based navigation */}
                {userRole === 'captain' && (
                  <li><Link to="/captain">Captain Dashboard</Link></li>
                )}
                {(userRole === 'admin' || userRole === 'operations') && (
                  <li><Link to="/operations">Operations Center</Link></li>
                )}
                {(userRole === 'admin' || userRole === 'support') && (
                  <li><Link to="/support">Support Panel</Link></li>
                )}
                {(userRole === 'rider' || userRole === 'captain') && (
                  <li><Link to="/book">Book Ride</Link></li>
                )}
                
                <li className="user-info">
                  <span>Welcome, {currentUser.displayName || currentUser.email}</span>
                  <button onClick={handleSignOut} className="btn-logout">
                    Sign Out
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Route Configuration */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            currentUser ? <Navigate to={getRoleHomePage(userRole)} /> : <Login />
          } />
          <Route path="/register" element={
            currentUser ? <Navigate to={getRoleHomePage(userRole)} /> : <Register />
          } />
          
          {/* Role-based Protected Routes */}
          <Route path="/captain" element={
            <ProtectedRoute allowedRoles={['captain']}>
              <CaptainDashboard currentUser={currentUser} />
            </ProtectedRoute>
          } />
          
          <Route path="/operations" element={
            <ProtectedRoute allowedRoles={['admin', 'operations']}>
              <OperationsCenter />
            </ProtectedRoute>
          } />
          
          <Route path="/support" element={
            <ProtectedRoute allowedRoles={['admin', 'support']}>
              <SupportPanel />
            </ProtectedRoute>
          } />
          
          <Route path="/book" element={
            <ProtectedRoute allowedRoles={['rider', 'captain', 'admin']}>
              <GoogleMapFixed currentUser={currentUser} />
            </ProtectedRoute>
          } />
          
          {/* Default route redirects based on role */}
          <Route path="/" element={
            currentUser ? (
              <Navigate to={getRoleHomePage(userRole)} />
            ) : (
              <Navigate to="/login" />
            )
          } />
          
          {/* Unauthorized access */}
          <Route path="/unauthorized" element={
            <div className="unauthorized">
              <h2>🚫 Unauthorized Access</h2>
              <p>You don't have permission to access this page.</p>
              <Link to="/" className="btn btn-primary">Go Home</Link>
            </div>
          } />
          
          {/* 404 Not Found */}
          <Route path="*" element={
            <div className="not-found">
              <h2>🌊 Page Not Found</h2>
              <p>The page you're looking for doesn't exist.</p>
              <Link to="/" className="btn btn-primary">Go Home</Link>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

// Helper function to get role-specific home page
function getRoleHomePage(role) {
  switch (role) {
    case 'captain':
      return '/captain';
    case 'admin':
    case 'operations':
      return '/operations';
    case 'support':
      return '/support';
    case 'rider':
    default:
      return '/book';
  }
}

export default App;
