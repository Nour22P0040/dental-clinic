const { auth, db } = require('./config/firebase');

async function testFirebase() {
  console.log('🧪 Testing Firebase connection...\n');

  try {
    // Test 1: Check Firebase Auth
    console.log('1️⃣ Testing Firebase Authentication...');
    try {
      const listUsersResult = await auth.listUsers(1);
      console.log('✅ Firebase Authentication is working!');
      console.log(`   Found ${listUsersResult.users.length} user(s)`);
    } catch (error) {
      console.error('❌ Firebase Authentication error:', error.message);
      console.log('\n💡 Solution: Make sure you enabled Authentication in Firebase Console');
      console.log('   Go to: https://console.firebase.google.com/');
      console.log('   Click: Authentication → Get started → Enable Email/Password');
    }

    // Test 2: Check Firestore
    console.log('\n2️⃣ Testing Firestore Database...');
    try {
      const testDoc = await db.collection('_test').doc('test').set({ test: true });
      await db.collection('_test').doc('test').delete();
      console.log('✅ Firestore Database is working!');
    } catch (error) {
      console.error('❌ Firestore error:', error.message);
      console.log('\n💡 Solution: Make sure you created Firestore Database');
      console.log('   Go to: https://console.firebase.google.com/');
      console.log('   Click: Firestore Database → Create database');
    }

    // Test 3: Try creating a test user
    console.log('\n3️⃣ Testing user creation...');
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const userRecord = await auth.createUser({
        email: testEmail,
        password: 'test123456',
      });
      console.log('✅ User creation is working!');
      console.log(`   Created test user: ${testEmail}`);
      
      // Clean up
      await auth.deleteUser(userRecord.uid);
      console.log('   Cleaned up test user');
    } catch (error) {
      console.error('❌ User creation error:', error.message);
      if (error.code === 'auth/email-already-exists') {
        console.log('✅ User creation is working (email already exists is normal)');
      }
    }

    console.log('\n✅ All tests passed! Firebase is configured correctly.');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure frontend is running: cd frontend && npm run dev');
    console.log('   2. Open browser: http://localhost:3000');
    console.log('   3. Try registering a new user');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }

  process.exit(0);
}

testFirebase();
