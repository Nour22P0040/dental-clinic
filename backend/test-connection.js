const axios = require('axios');

const testConnection = async () => {
  try {
    console.log('Testing backend connection...');
    const response = await axios.get('http://localhost:5001/api/health');
    console.log('✅ Backend is running!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Make sure the backend server is running on port 5001');
    }
  }
};

testConnection();
