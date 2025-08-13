import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './src/firebase.js';

const demoUsers = [
  {
    email: 'rider.demo@aquaride.com',
    password: 'demo123!',
    role: 'rider',
    displayName: 'Demo Rider'
  },
  {
    email: 'captain.demo@aquaride.com', 
    password: 'demo123!',
    role: 'captain',
    displayName: 'Demo Captain'
  },
  {
    email: 'admin.demo@aquaride.com',
    password: 'demo123!',
    role: 'admin', 
    displayName: 'Demo Admin'
  },
  {
    email: 'support.demo@aquaride.com',
    password: 'demo123!',
    role: 'support',
    displayName: 'Demo Support'
  }
];

async function createDemoUsers() {
  console.log('🚤 Creating dedicated demo users for AquaRide...\n');
  
  for (const userData of demoUsers) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      // Create authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        createdAt: new Date(),
        lastLogin: new Date(),
        isDemo: true,
        permissions: getRolePermissions(userData.role)
      });
      
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ User already exists: ${userData.email}`);
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    }
  }
  
  console.log('\n🎉 Demo user creation complete!\n');
  console.log('📋 NEW Demo Login Credentials (No Gmail Conflicts):');
  console.log('=====================================================');
  demoUsers.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });
  console.log('\n🌐 Test at: https://aquaride-daa69.web.app');
}

function getRolePermissions(role) {
  switch (role) {
    case 'admin':
      return ['read', 'write', 'delete', 'manage_users', 'view_analytics'];
    case 'captain':
      return ['read', 'write', 'accept_rides', 'update_location', 'emergency'];
    case 'support':
      return ['read', 'write', 'view_tickets', 'chat', 'escalate'];
    case 'rider':
    default:
      return ['read', 'book_rides', 'rate'];
  }
}

// Run the script
createDemoUsers().catch(console.error);