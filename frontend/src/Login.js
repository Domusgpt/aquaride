import React from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from './firebase';
import AuthProviders from './AuthProviders';
import './AuthProviders.css';

const Login = () => {
  const navigate = useNavigate();

  const handleAuthSuccess = async (user) => {
    try {
      // Fetch user data to check account type and preferences
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User logged in:", userData);
        
        // Update last login
        await setDoc(doc(db, "users", user.uid), {
          ...userData,
          lastLogin: new Date()
        }, { merge: true });
        
        // Redirect based on user type or to map
        navigate(userData.isCaptain ? '/captain-dashboard' : '/map');
      } else {
        // First time login with social auth - go to map
        navigate('/map');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigate('/map'); // Fallback redirect
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <AuthProviders 
          isRegistering={false} 
          onSuccess={handleAuthSuccess}
        />
        <div className="auth-switch">
          <p>
            Don't have an account? 
            <button 
              onClick={() => navigate('/register')} 
              className="link-button"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
