<<<<<<< HEAD
# 🔥 Dental Clinic Management System - Firebase Edition

A comprehensive dental clinic management system built with **Firebase** (Firestore + Authentication), Node.js, Express.js, and React.js.

## ✨ Features

- 🔐 **Firebase Authentication** - Secure user authentication
- 👥 **Patient Management** - Track patient information and medical history
- 📅 **Appointment System** - Book and manage appointments
- 💰 **Financial Tracking** - Monitor income and expenses
- 📊 **Analytics Dashboard** - View clinic statistics and insights
- 🔔 **Doctor Reminders** - Upcoming appointment notifications
- 🎯 **Role-Based Access** - Different permissions for doctors and patients

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js v16 or higher
- Google account (for Firebase)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it **"dental-clinic"** (or your preferred name)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Firebase Services

**Enable Authentication:**
1. Click **"Authentication"** → **"Get started"**
2. Enable **"Email/Password"** provider
3. Click **"Save"**

**Enable Firestore:**
1. Click **"Firestore Database"** → **"Create database"**
2. Select **"Start in production mode"**
3. Choose your location (closest to your users)
4. Click **"Enable"**

**Set Security Rules:**
1. Go to Firestore → **"Rules"** tab
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

### Step 3: Get Firebase Credentials

1. Click **⚙️ gear icon** → **"Project settings"**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Download the JSON file
5. Rename it to `serviceAccountKey.json`
6. Place it in `backend/config/` folder

### Step 4: Install & Run Backend

```bash
cd backend
npm install
npm run dev
```

✅ Backend running on **http://localhost:5000**

### Step 5: Install & Run Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend running on **http://localhost:3000**

### Step 6: Test the Application

Open your browser: **http://localhost:3000**

Register your first user or test the API:

```bash
curl http://localhost:5000/api/health
```

## 📁 Project Structure

```
dental-clinic-firebase/
├── backend/
│   ├── config/
│   │   ├── firebase.js                # Firebase initialization
│   │   └── serviceAccountKey.json     # Your credentials (don't commit!)
│   ├── controllers/
│   │   └── authController.js          # Authentication logic
│   ├── middleware/
│   │   ├── auth.js                    # Token verification
│   │   └── errorHandler.js            # Error handling
│   ├── routes/
│   │   ├── authRoutes.js              # Auth endpoints
│   │   ├── appointmentRoutes.js       # Appointment endpoints
│   │   ├── patientRoutes.js           # Patient endpoints
│   │   ├── transactionRoutes.js       # Transaction endpoints
│   │   └── analyticsRoutes.js         # Analytics endpoints
│   ├── .env                           # Environment variables
│   ├── package.json
│   └── server.js                      # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/                # React components
    │   ├── pages/                     # Page components
    │   ├── context/                   # Auth context
    │   └── services/                  # API services
    └── package.json
```

## 🔐 API Endpoints

### Authentication (✅ Fully Implemented)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |

### Other Endpoints (🚧 To Be Implemented)

- Appointments: `/api/appointments/*`
- Patients: `/api/patients/*`
- Transactions: `/api/transactions/*`
- Analytics: `/api/analytics/*`

## 🧪 Testing the API

### Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "doctor@clinic.com",
    "password": "doctor123",
    "phone": "+1234567890",
    "role": "doctor",
    "specialization": "General Dentistry",
    "licenseNumber": "DEN-12345"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@clinic.com",
    "password": "doctor123"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Check Firebase Console

After registering users:

1. **Authentication**: Firebase Console → Authentication → See registered users
2. **Firestore**: Firebase Console → Firestore Database → See user documents

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# Firebase credentials are loaded from serviceAccountKey.json
# Or you can use environment variables (see .env.example)
```

### Frontend Configuration

The frontend uses the backend API proxy configured in `vite.config.js`:

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

## 🔒 Security

### Firestore Security Rules (Production)

For production, use more specific rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Appointments
    match /appointments/{appointmentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.patient == request.auth.uid || 
         resource.data.doctor == request.auth.uid);
    }
    
    // Transactions - only doctors/admins
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'admin'];
    }
  }
}
```

### Important Security Notes

- ⚠️ **Never commit** `serviceAccountKey.json` to version control
- ⚠️ Add it to `.gitignore` (already done)
- ⚠️ Use environment variables in production
- ⚠️ Enable Firebase App Check for production
- ⚠️ Set up proper CORS policies

## 🚀 Deployment

### Backend Deployment

**Option 1: Firebase Cloud Functions (Recommended)**
```bash
npm install -g firebase-tools
firebase login
firebase init functions
firebase deploy --only functions
```

**Option 2: Other Platforms**
- Google Cloud Run
- Heroku
- AWS Lambda
- DigitalOcean

### Frontend Deployment

**Firebase Hosting (Recommended)**
```bash
cd frontend
npm run build
firebase init hosting
firebase deploy --only hosting
```

**Other Options:**
- Vercel (excellent for Vite)
- Netlify
- AWS S3 + CloudFront

## 💰 Firebase Pricing

### Free Tier (Spark Plan)
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Authentication**: Unlimited users
- **Hosting**: 10GB storage, 360MB/day transfer

### Paid Tier (Blaze Plan - Pay as you go)
- **Firestore**: $0.18/GB storage, $0.06 per 100K reads
- **Authentication**: Free
- **Hosting**: $0.026/GB storage, $0.15/GB transfer

**Estimate for small clinic:**
- 100 users, 10K operations/day: **FREE**
- 1K users, 100K operations/day: **~$5-10/month**

## 🔧 Troubleshooting

### "Firebase initialization failed"
- Check that `serviceAccountKey.json` is in `backend/config/`
- Verify the JSON file is valid
- Check file permissions

### "Permission denied" in Firestore
- Check Firestore security rules
- Verify user is authenticated
- Check token is valid and not expired

### "Port already in use"

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

### "User not found"
- Register a user first via the UI or API
- Check Firebase Console → Authentication

## 📚 Documentation

- **[FIREBASE_SETUP_GUIDE.md](FIREBASE_SETUP_GUIDE.md)** - Detailed setup instructions
- **[FIREBASE_QUICK_START.md](FIREBASE_QUICK_START.md)** - 5-minute quick start guide

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Admin SDK**: Firebase Admin SDK

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Notifications**: React Toastify

## 🎯 Implementation Status

### ✅ Completed
- Firebase project setup
- User authentication (register, login)
- User profile management
- Password change functionality
- Token-based authorization
- Role-based access control
- Error handling
- Frontend UI (all pages)

### 🚧 To Implement
- Appointment booking with Firestore
- Patient management with Firestore
- Transaction tracking with Firestore
- Analytics dashboard with Firestore
- Double-booking prevention
- Financial calculations

## 📖 Learn More

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Implement remaining features
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

- Firebase team for the excellent platform
- Express.js team for the web framework
- React team for the UI library
- All open-source contributors

## 💡 Next Steps

1. ✅ Complete authentication is working
2. 🚧 Implement appointment booking with Firestore
3. 🚧 Implement patient management
4. 🚧 Implement financial tracking
5. 🚧 Implement analytics dashboard
6. 🚧 Add real-time features
7. 🚧 Deploy to production

---

**Built with ❤️ using Firebase + Express.js + React.js**

For questions or issues, check the documentation or create an issue.
=======
# dental-clinic
>>>>>>> 6a798714ffa05b53e663ff737bf528c1849e2286
