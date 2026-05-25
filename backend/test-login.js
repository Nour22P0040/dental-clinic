const http = require('http');

const testLogin = () => {
  const data = JSON.stringify({
    email: 'doctor@clinic.com',
    password: 'doctor123'
  });

  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('Testing login with doctor credentials...');

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(JSON.parse(responseData), null, 2));
      } else {
        console.error('❌ Login failed!');
        console.error('Status:', res.statusCode);
        console.error('Response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed!');
    console.error('Error:', error.message);
  });

  req.write(data);
  req.end();
};

testLogin();
