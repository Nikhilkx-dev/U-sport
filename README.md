# ⚡ U-SPORT — Chitkara University Sports Management System

A **production-grade** full-stack web application for managing sports facilities and equipment at Chitkara University.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (Access + Refresh Token) + bcrypt |
| Real-time | Socket.IO |
| Security | Helmet + Rate Limiter + CORS |

---

## 📁 Project Structure

```
u-sport/
├── backend/
│   ├── config/         → DB connection
│   ├── controllers/    → Business logic
│   ├── middleware/     → Auth, Role, Error
│   ├── models/         → Mongoose schemas
│   ├── routes/         → API route definitions
│   ├── services/       → Chatbot service
│   ├── sockets/        → Socket.IO server
│   ├── utils/          → Seed script
│   └── server.js       → App entry point
└── frontend/
    └── src/
        ├── components/ → Reusable UI components
        ├── context/    → AuthContext
        ├── hooks/      → useSocket
        ├── layouts/    → DashboardLayout
        ├── pages/      → All page components
        └── services/   → Axios API instance
```

---

## 🚀 Setup Instructions

### 1. Clone / Download the project

```bash
# Navigate into project
cd u-sport
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env` with your values:**

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/usport?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here_minimum_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_here_minimum_32_chars
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

### 3. MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user (username + password)
4. Whitelist your IP (or `0.0.0.0/0` for development)
5. Click **Connect → Drivers → Copy connection string**
6. Replace `<username>` and `<password>` in your `.env`

---

### 4. Seed Sports Data

```bash
# From backend directory
npm run seed
```

This will insert:
- 11 sports (Cricket, Football, Basketball, Volleyball, Pickleball, Tennis, Skating, Badminton, Carrom, Chess, Table Tennis)
- 16 equipment items

> **Note:** Seed also runs automatically on first server start if no sports exist.

---

### 5. Start Backend

```bash
# Development (with nodemon auto-reload)
npm run dev

# Production
npm start
```

Backend runs on: `http://localhost:5000`

Health check: `http://localhost:5000/api/health`

---

### 6. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

### 7. Build Frontend for Production

```bash
npm run build
```

---

## 🔑 API Endpoints

### Authentication
```
POST   /api/auth/register     → Register new user
POST   /api/auth/login        → Login
GET    /api/auth/profile      → Get current user (protected)
POST   /api/auth/refresh      → Refresh access token
POST   /api/auth/logout       → Logout
```

### Sports
```
GET    /api/sports            → Get all sports
GET    /api/sports/:id        → Get sport by ID
POST   /api/sports            → Create sport (faculty only)
PUT    /api/sports/:id        → Update sport (faculty only)
DELETE /api/sports/:id        → Delete sport (faculty only)
GET    /api/sports/analytics  → Analytics data (faculty only)
```

### Facility Requests
```
POST   /api/facility/request      → Submit facility request (student)
GET    /api/facility/requests     → All requests (faculty)
GET    /api/facility/my-requests  → Student's own requests
PUT    /api/facility/approve/:id  → Approve (faculty)
PUT    /api/facility/reject/:id   → Reject (faculty)
PUT    /api/facility/release/:id  → Release facility (faculty)
```

### Equipment
```
GET    /api/equipment              → Get all equipment
POST   /api/equipment              → Add equipment (faculty)
PUT    /api/equipment/:id          → Update equipment (faculty)
DELETE /api/equipment/:id          → Delete equipment (faculty)
POST   /api/equipment/request      → Request equipment (student)
GET    /api/equipment/requests     → All requests (faculty)
GET    /api/equipment/my-requests  → Student's own requests
PUT    /api/equipment/approve/:id  → Approve (faculty)
PUT    /api/equipment/reject/:id   → Reject (faculty)
PUT    /api/equipment/return/:id   → Mark returned (faculty)
```

### Chatbot
```
POST   /api/chat         → Send message
GET    /api/chat/history → Get chat history
```

---

## ⚡ Socket.IO Events

| Event | Description |
|---|---|
| `facility_requested` | Student submits facility request |
| `facility_approved` | Faculty approves facility |
| `facility_rejected` | Faculty rejects facility |
| `facility_released` | Faculty releases facility |
| `equipment_requested` | Student requests equipment |
| `equipment_issued` | Faculty issues equipment |
| `equipment_rejected` | Faculty rejects equipment |
| `equipment_returned` | Faculty marks equipment returned |

---

## 🛡️ Security Features

- JWT Access Token (15min) + Refresh Token (7 days)
- bcrypt password hashing (12 salt rounds)
- Role-based access control (student / faculty)
- Helmet security headers
- Rate limiting (200 req/15min global, 20 req/15min auth)
- CORS protection
- API input validation

---

## 🔧 Maintenance Window

Every day from **4:00 PM to 5:00 PM IST**:
- Frontend shows maintenance banner
- Booking button is disabled
- Backend rejects all booking requests with 503

---

## 📊 Features Summary

### Student
- Register / Login
- View all sports with availability cards
- Filter by outdoor / indoor / available
- Real-time facility availability
- Submit facility booking requests
- Request equipment borrowing
- Track all request statuses
- AI Chatbot assistant

### Faculty / Admin
- Login with faculty role
- View all facility requests (pending/approved/rejected)
- Approve / Reject / Release facility bookings
- View all equipment requests
- Approve / Reject equipment requests
- Mark equipment as returned
- Manage inventory (add/edit/delete equipment)
- Analytics dashboard with charts

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy /dist to Vercel
```

### Backend → Render / Railway
```bash
# Set environment variables in Render dashboard
# Deploy from GitHub with start command: node server.js
```

### Database → MongoDB Atlas (already cloud-hosted)

---

## 🌱 Demo Accounts

After registering, use any email/password. Or create:
- **Student:** any email, role = student
- **Faculty:** any email, role = faculty

---

## 📦 Dependencies

### Backend
- `express` — Web framework
- `mongoose` — MongoDB ODM
- `jsonwebtoken` — JWT auth
- `bcryptjs` — Password hashing
- `socket.io` — Real-time events
- `helmet` — Security headers
- `express-rate-limit` — Rate limiting
- `cors` — Cross-origin support
- `dotenv` — Environment variables

### Frontend
- `react` + `react-dom` — UI library
- `react-router-dom` — Client routing
- `axios` — HTTP client
- `socket.io-client` — Real-time client
- `recharts` — Charts for analytics
- `tailwindcss` — Utility CSS

---

Built with ❤️ for Chitkara University | U-SPORT v1.0.0
