import React, { useState } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    OAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from './firebase-simple';

const AuthProviders = ({ isRegistering = true, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isCaptain, setIsCaptain] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPhoneAuth, setShowPhoneAuth] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);

    // Store user data in Firestore
    const storeUserData = async (user, additionalData = {}) => {
        try {
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                phoneNumber: user.phoneNumber,
                isCaptain: isCaptain,
                role: isCaptain ? 'captain' : 'rider', // ✅ Add proper role field
                createdAt: new Date(),
                lastLogin: new Date(),
                authProvider: additionalData.provider || 'email',
                ...additionalData
            });
            console.log('User data stored successfully');
        } catch (error) {
            console.error('Error storing user data:', error);
            // Don't throw error - auth still succeeded
            setError('Authentication successful but profile setup incomplete');
        }
    };

    // Email/Password Authentication
    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let userCredential;
            if (isRegistering) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }

            if (isRegistering) {
                await storeUserData(userCredential.user, { provider: 'email' });
            }
            
            if (onSuccess) onSuccess(userCredential.user);
        } catch (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    // Google Sign-In
    const handleGoogleAuth = async () => {
        setLoading(true);
        setError('');

        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Always store/update user data for social logins
            await storeUserData(user, { 
                provider: 'google',
                googleData: {
                    accessToken: GoogleAuthProvider.credentialFromResult(result)?.accessToken
                }
            });
            
            if (onSuccess) onSuccess(user);
        } catch (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    // Facebook Login
    const handleFacebookAuth = async () => {
        setLoading(true);
        setError('');

        try {
            const provider = new FacebookAuthProvider();
            provider.addScope('email');
            provider.addScope('public_profile');
            
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            await storeUserData(user, { 
                provider: 'facebook',
                facebookData: {
                    accessToken: FacebookAuthProvider.credentialFromResult(result)?.accessToken
                }
            });
            
            if (onSuccess) onSuccess(user);
        } catch (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    // Apple Sign-In
    const handleAppleAuth = async () => {
        setLoading(true);
        setError('');

        try {
            const provider = new OAuthProvider('apple.com');
            provider.addScope('email');
            provider.addScope('name');
            
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            await storeUserData(user, { 
                provider: 'apple',
                appleData: {
                    accessToken: OAuthProvider.credentialFromResult(result)?.accessToken
                }
            });
            
            if (onSuccess) onSuccess(user);
        } catch (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    // Phone Authentication - Step 1: Send SMS
    const handlePhoneAuth = async () => {
        setLoading(true);
        setError('');

        try {
            // Initialize reCAPTCHA
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'normal',
                    callback: () => {
                        console.log('reCAPTCHA solved');
                    }
                });
            }

            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
            setConfirmationResult(confirmation);
            setError('SMS sent! Enter the verification code.');
        } catch (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    // Phone Authentication - Step 2: Verify Code
    const handleVerifyCode = async () => {
        if (!confirmationResult) return;
        
        setLoading(true);
        setError('');

        try {
            const result = await confirmationResult.confirm(verificationCode);
            const user = result.user;
            
            if (isRegistering) {
                await storeUserData(user, { provider: 'phone' });
            }
            
            if (onSuccess) onSuccess(user);
        } catch (error) {
            setError('Invalid verification code');
        }
        setLoading(false);
    };

    return (
        <div className="auth-providers">
            <div className="auth-header">
                <h2>{isRegistering ? 'Sign up for AquaRide' : 'Sign in to AquaRide'}</h2>
                <p>Choose your preferred method</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Social Authentication Buttons */}
            <div className="social-auth-section">
                <button 
                    onClick={handleGoogleAuth} 
                    disabled={loading}
                    className="auth-button google-auth"
                >
                    <span className="auth-icon">🔵</span>
                    Continue with Google
                </button>

                <button 
                    onClick={handleFacebookAuth} 
                    disabled={loading}
                    className="auth-button facebook-auth"
                >
                    <span className="auth-icon">📘</span>
                    Continue with Facebook
                </button>

                <button 
                    onClick={handleAppleAuth} 
                    disabled={loading}
                    className="auth-button apple-auth"
                >
                    <span className="auth-icon">🍎</span>
                    Continue with Apple
                </button>

                <button 
                    onClick={() => setShowPhoneAuth(!showPhoneAuth)} 
                    className="auth-button phone-auth"
                >
                    <span className="auth-icon">📱</span>
                    Continue with Phone
                </button>
            </div>

            <div className="auth-divider">
                <span>or</span>
            </div>

            {/* Phone Authentication */}
            {showPhoneAuth && (
                <div className="phone-auth-section">
                    {!confirmationResult ? (
                        <>
                            <input
                                type="tel"
                                placeholder="Enter phone number (+1234567890)"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="auth-input"
                            />
                            <div id="recaptcha-container"></div>
                            <button onClick={handlePhoneAuth} disabled={loading} className="auth-button">
                                Send SMS Code
                            </button>
                        </>
                    ) : (
                        <>
                            <input
                                type="text"
                                placeholder="Enter verification code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="auth-input"
                            />
                            <button onClick={handleVerifyCode} disabled={loading} className="auth-button">
                                Verify Code
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Email/Password Authentication */}
            <form onSubmit={handleEmailAuth} className="email-auth-section">
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                    required
                />
                
                {isRegistering && (
                    <label className="captain-checkbox">
                        <input 
                            type="checkbox" 
                            checked={isCaptain} 
                            onChange={(e) => setIsCaptain(e.target.checked)} 
                        />
                        Register as a boat captain
                    </label>
                )}

                <button type="submit" disabled={loading} className="auth-button primary">
                    {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
                </button>
            </form>

            <div className="auth-footer">
                <p>
                    By continuing, you agree to AquaRide's Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
};

export default AuthProviders;