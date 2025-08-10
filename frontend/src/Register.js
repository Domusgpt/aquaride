import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from './firebase';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCaptain, setIsCaptain] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        isCaptain: isCaptain,
      });

      console.log('User registered and data stored:', user);
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
