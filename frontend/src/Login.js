import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from './firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch additional user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        console.log("User data:", userDoc.data());
        // You can store this data in your app's state or context
      } else {
        console.log("No user data found in Firestore!");
      }

      console.log('User logged in:', user);
      setError('');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">Login</h2>
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
          <button type="submit" className="cyber-button">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
