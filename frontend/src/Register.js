import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCaptain, setIsCaptain] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // You can now store additional user data (like isCaptain) in Firestore
      console.log(userCredential.user);
      setError('');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">Register</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={isCaptain} onChange={(e) => setIsCaptain(e.target.checked)} />
              Register as a captain
            </label>
          </div>
          <button type="submit" className="cyber-button">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
