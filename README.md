# APSRTC Live Bus Tracking System

A real-time bus tracking system for Andhra Pradesh State Road Transport Corporation (APSRTC) built with the MERN stack.

## 🚀 Features

### ✅ Completed (Slice 1 & 2)
- **Premium UI**: Modern, responsive design with APSRTC branding (Orange & Navy theme)
- **Driver Registration**: Secure registration system with form validation
- **Password Security**: Automatic password hashing using bcrypt
- **Real-time Status**: Live backend connection monitoring
- **Toast Notifications**: User-friendly feedback for actions
- **Responsive Design**: Fully optimized for mobile and desktop

### 🔜 Coming Soon
- Driver Login with JWT authentication
- Bus activation and tracking
- Real-time location sharing
- User search functionality
- Nearby buses feature

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API requests
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **bcrypt** for password hashing
- **CORS** & **Dotenv** for configuration

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Git

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` directory with your credentials:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## 🎨 Design System

- **Primary Color**: APSRTC Orange (`#FF6B00`)
- **Secondary Color**: Deep Navy (`#0B1F3A`)
- **Typography**: `Outfit` (Headings), `Inter` (Body)
- **UI Architecture**: Glassmorphism, Gradient backgrounds, Floating labels

## 📝 Project Structure

```
APSRTC/
├── backend/
│   ├── config/       # Database configuration
│   ├── models/       # Mongoose models (Driver.js)
│   ├── routes/       # API routes (auth.js)
│   ├── server.js     # Entry point
│   └── .env          # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/    # React pages (Home, Register)
│   │   ├── App.jsx   # Main component
│   │   └── main.jsx  # Entry point
│   └── tailwind.config.js
└── README.md
```

## 🚦 Development Roadmap

- [x] **Slice 1**: Basic Connection & Home Page
- [x] **Slice 2**: Driver Registration
- [ ] **Slice 3**: Login + JWT
- [ ] **Slice 4**: Bus Activation
- [ ] **Slice 5**: Real-Time Location
- [ ] **Slice 6**: User Search
- [ ] **Slice 7**: Near Me Feature

## 👨‍💻 Author

Built with ❤️ for APSRTC
