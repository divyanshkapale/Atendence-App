const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs-extra');
const path = require('path');

async function initializeApp() {
    console.log('🚀 Initializing E-Attendance Application...');
    
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');
        
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, 'uploads');
        fs.ensureDirSync(uploadsDir);
        console.log('✅ Uploads directory created');
        
        // Check if admin user exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (!existingAdmin) {
            // Create default admin user
            const adminUser = new User({
                username: 'admin',
                password: 'admin123',
                role: 'admin'
            });
            await adminUser.save();
            
            console.log('✅ Default admin user created');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('   ⚠️  IMPORTANT: Please change the admin password after first login!');
        } else {
            console.log('ℹ️  Admin user already exists');
        }
        
        // Create a sample member user
        const existingMember = await User.findOne({ username: 'member' });
        if (!existingMember) {
            const memberUser = new User({
                username: 'member',
                password: 'member123',
                role: 'member'
            });
            await memberUser.save();
            
            console.log('✅ Sample member user created');
            console.log('   Username: member');
            console.log('   Password: member123');
        } else {
            console.log('ℹ️  Sample member user already exists');
        }
        
        console.log('\n🎉 Application initialized successfully!');
        console.log('📝 To start the server, run: npm start');
        console.log('🌐 Then visit: http://localhost:3000');
        console.log('📊 MongoDB database: attendance_db');
        
        // Close connection
        await mongoose.connection.close();
        
    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        process.exit(1);
    }
}

// Run initialization
initializeApp(); 