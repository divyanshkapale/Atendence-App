const mongoose = require('mongoose');
const User = require('./models/User'); // adjust path if needed

require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance_db';

async function createAdmin() {
  try {
    const maskedUri = MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log(`🔌 Connecting to: ${maskedUri}`);

    await mongoose.connect(MONGO_URI); // Simplified connect for Mongoose 6+
    console.log("✅ MongoDB connected");

    const username = "adminUser";
    let admin = await User.findOne({ username });

    if (admin) {
      console.log("⚠️ Admin user already exists. Updating password...");
      admin.password = "admin123";
      admin.role = "admin";
    } else {
      console.log("🆕 Creating new admin user...");
      admin = new User({
        username,
        password: "admin123",
        role: "admin"
      });
    }

    await admin.save();
    console.log("🎉 Admin user ready!");
    console.log("👉 Username: adminUser");
    console.log("👉 Password: admin123");

    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  }
}

createAdmin();