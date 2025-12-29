# 📸 E-Attendance System - MongoDB Edition

A complete authentication-based e-attendance system with live photo capture, GPS location tracking, and role-based access control. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 🚀 Features

### 👥 **User Management**
- **Role-based Authentication**: Admin and Member roles
- **JWT Token Authentication**: Secure login/logout system
- **User Registration**: Admin can create new users
- **User Management**: Admin can view and delete users

### 📸 **Member Features**
- **Live Photo Capture**: Camera access for attendance photos
- **GPS Location Tracking**: Automatic location detection
- **Daily Upload Limit**: One photo per day restriction
- **Personal Records**: View own attendance history

### 👨‍💼 **Admin Features**
- **Dashboard**: Statistics and overview
- **View All Records**: Complete attendance database
- **Delete Records**: Remove attendance entries
- **User Management**: Create and manage user accounts
- **MongoDB Storage**: Robust database with indexing

### 🔒 **Security Features**
- **Password Hashing**: bcryptjs encryption with salting
- **JWT Authentication**: Secure token-based sessions
- **Role-based Access**: Protected admin routes
- **File Upload Validation**: Image-only uploads with size limits
- **Daily Rate Limiting**: Prevents spam uploads
- **MongoDB Indexes**: Optimized queries and unique constraints

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcryptjs
- **File Upload**: Multer
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Camera API**: MediaDevices getUserMedia
- **Location API**: Geolocation API

## 📋 Prerequisites

- Node.js (version 14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager
- Modern web browser with camera and location support

## 🔧 Installation & Setup

### 1. Install MongoDB

**Option A: Local MongoDB Installation**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS with Homebrew
brew install mongodb-community

# Windows - Download from mongodb.com
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://cloud.mongodb.com
2. Create a cluster
3. Get connection string

### 2. Install Dependencies
```bash
cd single-server
npm install
```

### 3. Environment Configuration (Optional)
Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/attendance_db
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance_db
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

### 4. Initialize the Application
```bash
npm run init
```

This will:
- Connect to MongoDB
- Create database indexes
- Create default users:
  - **Admin**: username: `admin`, password: `admin123`
  - **Member**: username: `member`, password: `member123`

### 5. Start the Server
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📱 How to Use

### 🔐 **Login**
1. Open `http://localhost:3000` in your browser
2. Use the default credentials:
   - **Admin**: `admin` / `admin123`
   - **Member**: `member` / `member123`

### 👤 **Member Usage**
1. **Login** with member credentials
2. **Take Attendance**:
   - Click "📸 Take Attendance"
   - Allow camera and location permissions
   - Click "Start Camera"
   - Position yourself and click "Capture Photo"
   - Review and click "Upload Attendance"
3. **View Records**: Click "📋 My Records" to see your history

### 👨‍💼 **Admin Usage**
1. **Login** with admin credentials
2. **Dashboard**: View statistics (total records, today's records, unique users)
3. **Admin Panel**: 
   - View all attendance records
   - Delete records with 🗑️ button
   - Click location coordinates to view on Google Maps
4. **User Management**:
   - Add new users (username, password, role)
   - Delete existing users
   - View user information

## 📁 Project Structure

```
single-server/
├── models/                 # MongoDB models
│   ├── User.js            # User schema with authentication
│   └── Attendance.js      # Attendance schema with geolocation
├── routes/                # API routes
│   ├── auth.js           # Authentication endpoints
│   └── attendance.js     # Attendance endpoints
├── middleware/           # Authentication middleware
│   └── auth.js          # JWT validation and role checks
├── public/              # Frontend files
│   ├── index.html      # Main application
│   └── script.js       # Frontend JavaScript
├── uploads/            # Uploaded photos storage
├── index.js           # Main server file
├── init.js            # Database initialization
└── package.json       # Dependencies and scripts
```

## 💾 MongoDB Schema

### **User Collection**
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['admin', 'member']),
  createdAt: Date,
  updatedAt: Date
}
```

### **Attendance Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  username: String,
  photo: String (file path),
  latitude: Number,
  longitude: Number,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **Indexes**
- `users.username`: Unique index
- `attendance.location`: 2dsphere index for geospatial queries
- `attendance.userId + createdAt`: Compound index for user queries
- `attendance.createdAt`: Index for date-based queries

## 🔒 API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Create user (admin only)
- `GET /api/auth/users` - List users (admin only)
- `DELETE /api/auth/users/:id` - Delete user (admin only)

### **Attendance**
- `POST /api/attendance/upload` - Upload photo (members, once/day)
- `GET /api/attendance/my-records` - Get user's records
- `GET /api/attendance/can-upload` - Check upload eligibility
- `GET /api/attendance/all` - Get all records (admin only)
- `DELETE /api/attendance/:id` - Delete record (admin only)
- `GET /api/attendance/stats` - Get statistics (admin only)

## ⚙️ Configuration

### **Environment Variables**
```env
MONGODB_URI=mongodb://localhost:27017/attendance_db
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### **MongoDB Connection Options**
- **Local**: `mongodb://localhost:27017/attendance_db`
- **Atlas**: `mongodb+srv://user:pass@cluster.mongodb.net/attendance_db`
- **Replica Set**: `mongodb://host1:27017,host2:27017/attendance_db?replicaSet=rs0`

### **Upload Limits**
- **File Size**: 5MB maximum
- **File Types**: Images only (jpg, png, gif, etc.)
- **Daily Limit**: 1 photo per member per day

## 🚀 Performance Features

### **Database Optimizations**
- **Indexes**: Optimized queries for users and attendance
- **Geospatial**: 2dsphere index for location queries
- **Aggregation**: Efficient statistics calculation
- **Connection Pooling**: Mongoose connection management

### **Application Features**
- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Stateless authentication
- **File Validation**: Multer with type checking
- **Error Handling**: Comprehensive error responses

## 🌐 Browser Compatibility

- **Chrome**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Full support (iOS 11+) ✅
- **Edge**: Full support ✅

**Note**: Camera and location require HTTPS in production.

## 🔧 Troubleshooting

### **Common Issues**

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running: `sudo systemctl start mongodb`
   - Check connection string in `.env` file
   - Verify network access for Atlas

2. **Camera Not Working**
   - Enable camera permissions in browser
   - Try different browser (Chrome recommended)
   - Check if other apps are using camera

3. **Location Not Available**
   - Enable location services
   - Allow location access in browser
   - Check device GPS settings

4. **Upload Failed**
   - Check file size (max 5MB)
   - Ensure image format
   - Verify daily upload limit

5. **Login Issues**
   - Use correct default credentials
   - Run `npm run init` to reset users
   - Check MongoDB connection

## 🚨 Security Considerations

### **Production Deployment**
- Change default passwords immediately
- Use strong JWT secret (32+ characters)
- Enable HTTPS/TLS
- Set secure cookie flags
- Implement rate limiting
- Regular security updates
- MongoDB authentication enabled

### **Data Privacy**
- Photos stored locally on server
- Location data in MongoDB
- Passwords hashed with bcrypt
- No external data transmission
- GDPR compliance considerations

## 📊 MongoDB Administration

### **Useful Commands**
```bash
# Connect to MongoDB shell
mongo attendance_db

# View collections
show collections

# Count users
db.users.countDocuments()

# Count attendance records
db.attendances.countDocuments()

# Find admin users
db.users.find({role: "admin"})

# View indexes
db.attendances.getIndexes()

# Backup database
mongodump --db attendance_db

# Restore database
mongorestore --db attendance_db dump/attendance_db/
```

### **Performance Monitoring**
```javascript
// Enable MongoDB profiling
db.setProfilingLevel(1, {slowms: 100})

// View slow queries
db.system.profile.find().sort({ts: -1}).limit(5)
```

## 🔮 Future Enhancements

Potential improvements:
- **Advanced Analytics**: Aggregation pipelines for reports
- **Geofencing**: Location-based attendance validation
- **Real-time Updates**: WebSocket notifications
- **Mobile App**: React Native with offline sync
- **Microservices**: Split into user and attendance services
- **Cloud Storage**: AWS S3/Cloudinary integration
- **Email Notifications**: Attendance confirmations
- **Audit Logging**: Track all system changes

## 📞 Support

If you encounter issues:
1. Check MongoDB connection and status
2. Verify browser console for errors
3. Check server logs for detailed error messages
4. Ensure all dependencies are installed
5. Verify file permissions for uploads directory

## 🎯 Default Credentials

**⚠️ IMPORTANT: Change these after first login!**

- **Admin Account**:
  - Username: `admin`
  - Password: `admin123`

- **Member Account**:
  - Username: `member`
  - Password: `member123`

---

**Built with ❤️ using Node.js, Express, MongoDB, and modern web technologies.** 