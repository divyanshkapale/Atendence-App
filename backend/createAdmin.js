const mongoose = require('mongoose');
const User = require('./models/User'); // adjust path if needed

require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance_db';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected");

    // create admin user
    const admin = new User({
      username: "adminUser",
      password: "admin123",  // plain text, will be hashed automatically
      role: "admin"
    });

    await admin.save();
    console.log("🎉 Admin created:", admin);

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  }
}

createAdmin();