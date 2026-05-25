# Login Troubleshooting Guide

## Issue: Login Failed

### Step 1: Check if Backend is Running

Open a terminal and run:
```bash
cd backend
npm start
```

You should see:
```
✅ Firebase initialized successfully
🚀 Server running on port 5001 in development mode
```

### Step 2: Seed the Database with Demo Users

If this is your first time running the app, you need to create demo users:

```bash
cd backend
node utils/seedDatabase.js
```

This will create:
- **Doctor**: doctor@clinic.com / doctor123
- **Patient**: patient@example.com / patient123
- **Patient 2**: bob@example.com / patient123

### Step 3: Check Firebase Configuration

Make sure your Firebase service account key is properly configured:

1. Check if `backend/config/serviceAccountKey.json` exists
2. Or verify your `.env` file has Firebase credentials

### Step 4: Test Backend Connection

Run the connection test:
```bash
cd backend
node test-connection.js
```

### Step 5: Start Frontend

In a new terminal:
```bash
cd frontend
npm run dev
```

The frontend should start on http://localhost:3000

### Step 6: Check Browser Console

1. Open the browser developer tools (F12)
2. Go to the Console tab
3. Try to login
4. Look for any error messages

### Common Issues:

#### 1. "Network Error" or "ERR_CONNECTION_REFUSED"
- **Cause**: Backend is not running
- **Solution**: Start the backend server (Step 1)

#### 2. "Invalid credentials"
- **Cause**: Users not seeded in database
- **Solution**: Run the seed script (Step 2)

#### 3. "CORS Error"
- **Cause**: CORS not properly configured
- **Solution**: Backend already has CORS enabled, make sure both servers are running

#### 4. "Firebase not initialized"
- **Cause**: Missing Firebase configuration
- **Solution**: Check Firebase setup (Step 3)

#### 5. Login button does nothing
- **Cause**: Frontend not connecting to backend
- **Solution**: Check Vite proxy configuration in `frontend/vite.config.js`

### Verify Vite Proxy Configuration

Check `frontend/vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
```

### Test API Manually

You can test the login API directly using curl or Postman:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"doctor@clinic.com\",\"password\":\"doctor123\"}"
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "...",
    "authToken": "..."
  }
}
```

### Still Having Issues?

1. Clear browser cache and localStorage
2. Restart both backend and frontend servers
3. Check if port 5001 is already in use
4. Verify Node.js version (should be 14+)
5. Run `npm install` in both backend and frontend directories

### Quick Reset

If all else fails, try a complete reset:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
node utils/seedDatabase.js
npm start

# Frontend (in new terminal)
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```
