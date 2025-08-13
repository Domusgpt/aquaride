// FLOWT Demo User Creation Script
// Run with: node create-demo-users.js

const firebase = require('firebase');
require('firebase/auth');
require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPxhZngNx58omkqXVGXx9CmU7monP3944",
  authDomain: "aquaride-daa69.firebaseapp.com",
  projectId: "aquaride-daa69",
  storageBucket: "aquaride-daa69.appspot.com",
  messagingSenderId: "276584031284",
  appId: "1:276584031284:web:c8e2a8b3e8e0a8b3e8e0a8"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

async function createDemoUsers() {
  const demoUsers = [
    // Captain Demo Accounts
    {
      email: 'captain1@flowt.demo',
      password: 'demo123',
      role: 'captain',
      displayName: 'Captain Jake',
      vesselType: 'speedboat'
    },
    {
      email: 'captain2@flowt.demo', 
      password: 'demo123',
      role: 'captain',
      displayName: 'Captain Sarah',
      vesselType: 'yacht'
    },
    {
      email: 'captain3@flowt.demo',
      password: 'demo123', 
      role: 'captain',
      displayName: 'Captain Mike',
      vesselType: 'catamaran'
    },
    
    // Rider Demo Accounts
    {
      email: 'rider1@flowt.demo',
      password: 'demo123',
      role: 'rider', 
      displayName: 'Alex Smith'
    },
    {
      email: 'rider2@flowt.demo',
      password: 'demo123',
      role: 'rider',
      displayName: 'Jordan Lee'
    },
    {
      email: 'rider3@flowt.demo',
      password: 'demo123',
      role: 'rider', 
      displayName: 'Taylor Park'
    },
    {
      email: 'rider4@flowt.demo',
      password: 'demo123',
      role: 'rider',
      displayName: 'Casey Blue'
    },
    {
      email: 'rider5@flowt.demo', 
      password: 'demo123',
      role: 'rider',
      displayName: 'River Stone'
    }
  ];

  console.log('🌊 Creating FLOWT Demo Accounts...\n');
  const results = { created: 0, existing: 0, errors: 0 };

  for (const user of demoUsers) {
    try {
      // Create Firebase Auth user
      const userCredential = await auth.createUserWithEmailAndPassword(user.email, user.password);
      const firebaseUser = userCredential.user;

      // Update display name
      await firebaseUser.updateProfile({ displayName: user.displayName });

      // Create Firestore user document
      const userData = {
        uid: firebaseUser.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isCaptain: user.role === 'captain',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (user.role === 'captain') {
        userData.status = 'offline';
        userData.vesselType = user.vesselType;
        userData.rating = parseFloat((4.8 + Math.random() * 0.2).toFixed(1));
        userData.completionRate = Math.floor(95 + Math.random() * 5);
        userData.totalRides = Math.floor(Math.random() * 50) + 10;
        userData.totalEarnings = userData.totalRides * (25 + Math.random() * 50);
      }

      await db.collection('users').doc(firebaseUser.uid).set(userData);

      console.log(`✅ Created ${user.role.toUpperCase()}: ${user.email} | ${user.displayName}`);
      results.created++;

      // Sign out after creating each user
      await auth.signOut();

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  Account exists: ${user.email}`);
        results.existing++;
      } else {
        console.log(`❌ Error creating ${user.email}:`, error.message);
        results.errors++;
      }
    }
  }

  console.log(`\n📊 Results: ${results.created} created, ${results.existing} existing, ${results.errors} errors`);
  console.log('\n🎉 Demo account setup complete!');
  console.log('\n📋 DEMO CREDENTIALS FOR YOUR FRIENDS:');
  console.log('\n⚓ CAPTAIN ACCOUNTS:');
  console.log('captain1@flowt.demo / demo123 (Captain Jake - Speedboat)');
  console.log('captain2@flowt.demo / demo123 (Captain Sarah - Yacht)'); 
  console.log('captain3@flowt.demo / demo123 (Captain Mike - Catamaran)');
  console.log('\n🏄 RIDER ACCOUNTS:');
  console.log('rider1@flowt.demo / demo123 (Alex Smith)');
  console.log('rider2@flowt.demo / demo123 (Jordan Lee)');
  console.log('rider3@flowt.demo / demo123 (Taylor Park)');
  console.log('rider4@flowt.demo / demo123 (Casey Blue)');
  console.log('rider5@flowt.demo / demo123 (River Stone)');
  console.log('\n🌐 FLOWT URL: https://aquaride-daa69.web.app');
  
  process.exit(0);
}

createDemoUsers().catch(console.error);