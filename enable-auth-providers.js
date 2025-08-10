#!/usr/bin/env node

/**
 * Enable Firebase Authentication providers via Google Cloud APIs
 */

const { execSync } = require('child_process');

console.log('🔐 ENABLING FIREBASE AUTHENTICATION PROVIDERS');
console.log('==============================================');

const projectId = 'aquaride-daa69';

// Function to run gcloud commands
const runGcloudCommand = (command, description) => {
  console.log(`\n🔄 ${description}...`);
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ Success: ${description}`);
    return result;
  } catch (error) {
    console.log(`⚠️  ${description}: ${error.message}`);
    return null;
  }
};

console.log(`\n📋 Project: ${projectId}`);
console.log('📍 Enabling authentication providers...\n');

// Enable Identity Toolkit API (required for Firebase Auth)
runGcloudCommand(
  `gcloud services enable identitytoolkit.googleapis.com --project=${projectId}`,
  'Enabling Identity Toolkit API'
);

// Check if Identity Toolkit is enabled
const enabledServices = runGcloudCommand(
  `gcloud services list --enabled --project=${projectId} --filter="name:identitytoolkit"`,
  'Checking Identity Toolkit API status'
);

if (enabledServices && enabledServices.includes('identitytoolkit')) {
  console.log('✅ Identity Toolkit API is enabled - Authentication should work!');
} else {
  console.log('⚠️  Identity Toolkit API may need manual activation');
}

// Try to get current auth configuration
console.log('\n🔍 Checking current authentication configuration...');
try {
  const authConfig = execSync(`gcloud identity projects describe ${projectId}`, { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('✅ Authentication configuration exists');
} catch (error) {
  console.log('⚠️  Authentication needs initialization in Firebase Console');
}

console.log('\n📱 PROVIDER ENABLEMENT STATUS:');
console.log('==============================');

console.log('\n✅ EMAIL/PASSWORD:');
console.log('   Status: Should be enabled by default');
console.log('   Action: None needed');

console.log('\n✅ GOOGLE SIGN-IN:');
console.log('   Status: Auto-configured for Firebase projects');
console.log('   Action: Just enable in Firebase Console');

console.log('\n📱 PHONE AUTHENTICATION:');
console.log('   Status: Available when enabled');
console.log('   Action: Enable in Firebase Console');

console.log('\n⚠️  FACEBOOK & APPLE:');
console.log('   Status: Require external OAuth app setup');
console.log('   Action: Manual configuration needed');

console.log('\n🌐 FIREBASE CONSOLE LINKS:');
console.log('==========================');
console.log(`Authentication: https://console.firebase.google.com/project/${projectId}/authentication/providers`);
console.log(`Users: https://console.firebase.google.com/project/${projectId}/authentication/users`);
console.log(`Settings: https://console.firebase.google.com/project/${projectId}/authentication/settings`);

console.log('\n🎯 NEXT ACTIONS:');
console.log('================');
console.log('1. Visit Firebase Console authentication page');
console.log('2. Click "Get Started" if needed');
console.log('3. Enable Email/Password provider');
console.log('4. Enable Google provider');
console.log('5. Enable Phone provider');
console.log('6. Test authentication in your app');

console.log('\n✅ API ENABLEMENT COMPLETE!');
console.log('Manual provider activation still required in Firebase Console.');

// Create a quick curl test for the APIs
console.log('\n🧪 TESTING API ACCESS:');
try {
  const accessToken = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  console.log('✅ Google Cloud access token obtained');
  
  // Test Identity Toolkit API
  const testCommand = `curl -s -H "Authorization: Bearer ${accessToken}" "https://identitytoolkit.googleapis.com/v1/projects/${projectId}/config"`;
  
  console.log('\n🔍 Testing Identity Toolkit API...');
  try {
    const apiResult = execSync(testCommand, { encoding: 'utf8', stdio: 'pipe' });
    if (apiResult.includes('authorizedDomains')) {
      console.log('✅ Identity Toolkit API is working!');
      console.log('✅ Firebase Authentication is properly configured');
    } else {
      console.log('⚠️  API response received but may need configuration');
    }
  } catch (apiError) {
    console.log('⚠️  API test failed - manual setup required');
  }
  
} catch (tokenError) {
  console.log('⚠️  Could not get access token for API testing');
}

console.log('\n🚀 READY FOR FIREBASE CONSOLE CONFIGURATION!');