import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthProviders from './AuthProviders';
import './AuthProviders.css';

const Register = () => {
  const navigate = useNavigate();

  const handleAuthSuccess = (user) => {
    console.log('Registration successful:', user);
    // Redirect will be handled by App.js based on user role
    navigate('/');
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <AuthProviders 
          isRegistering={true} 
          onSuccess={handleAuthSuccess}
        />
        <div className="auth-switch">
          <p>
            Already have an account? 
            <button 
              onClick={() => navigate('/login')} 
              className="link-button"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
