# APSRTC Live Bus Tracking - Quick Start Guide

## 🚀 SLICE 1 - Setup Complete!

### Backend Setup
1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. **IMPORTANT**: Update `.env` file with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=your_actual_mongodb_atlas_connection_string
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```
   Server will run on: http://localhost:5000

### Frontend Setup
1. Navigate to frontend folder (in a new terminal):
   ```bash
   cd frontend
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   Frontend will run on: http://localhost:5173

### 🎨 What You'll See
- **Premium APSRTC-themed UI** with orange gradients
- **Glassmorphism cards** with backdrop blur effects
- **Animated background** with floating elements
- **Real-time API connection test** displaying backend response
- **Loading spinner** while connecting
- **Error handling** if backend is not running

### ✅ Verification
- Visit http://localhost:5173
- You should see a beautiful orange gradient hero section
- The glass card should display the API response from backend
- Status should show "Connected" with a green pulse indicator

---

## 📁 Project Structure Created

```
APSRTC/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   └── Home.jsx
    │   ├── App.jsx
    │   └── index.css
    ├── tailwind.config.js
    └── package.json
```
