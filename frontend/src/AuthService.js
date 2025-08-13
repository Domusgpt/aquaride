// Simplified Authentication Service
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.listeners = [];
  }

  // Simple login with email/password
  async login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Login successful:', user.uid);
      
      // Get user role - simplified approach
      const role = this.determineRoleFromEmail(email);
      console.log('👤 User role determined:', role);
      
      // Store user profile in Firestore
      await this.createUserProfile(user, role);
      
      return { user, role };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Create user profile in Firestore
  async createUserProfile(user, role) {
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Check if user profile exists
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user profile
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || this.getDisplayNameFromEmail(user.email),
          role: role,
          createdAt: new Date(),
          lastLogin: new Date()
        };
        
        await setDoc(userRef, userData);
        console.log('✅ User profile created');
      } else {
        // Update last login
        await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
        console.log('✅ User profile updated');
      }
    } catch (error) {
      console.error('⚠️ Error managing user profile:', error);
      // Don't throw - this shouldn't block login
    }
  }

  // Determine role from email (simplified)
  determineRoleFromEmail(email) {
    if (email.includes('captain@')) return 'captain';
    if (email.includes('admin@')) return 'admin';
    if (email.includes('support@')) return 'support';
    if (email.includes('operations@')) return 'operations';
    return 'rider'; // Default role
  }

  // Get display name from email
  getDisplayNameFromEmail(email) {
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1).replace(/[.-]/g, ' ');
  }

  // Register new user
  async register(email, password, displayName) {
    try {
      console.log('📝 Registering new user:', email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const role = this.determineRoleFromEmail(email);
      await this.createUserProfile(user, role);
      
      console.log('✅ Registration successful');
      return { user, role };
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign out
  async logout() {
    try {
      await signOut(auth);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }

  // Get current user role from Firestore
  async getUserRole(user) {
    try {
      if (!user) return null;
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data().role;
      } else {
        // Fallback to email-based role determination
        return this.determineRoleFromEmail(user.email);
      }
    } catch (error) {
      console.error('⚠️ Error getting user role:', error);
      // Fallback to email-based role
      return this.determineRoleFromEmail(user.email);
    }
  }

  // Auth state listener
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await this.getUserRole(user);
        callback({ user, role });
      } else {
        callback({ user: null, role: null });
      }
    });
  }

  // Error message mapping
  getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'Authentication error. Please try again.';
    }
  }

  // Get role-specific home page
  getRoleHomePage(role) {
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
}

// Export singleton instance
const authService = new AuthService();
export default authService;