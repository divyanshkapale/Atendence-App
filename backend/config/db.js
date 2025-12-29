const mongoose = require('mongoose');

const connectMongoDB = async () => {
    const mongoOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
    };

    // Prioritize local connection as requested
    const mongoURIs = [
        'mongodb://127.0.0.1:27017/attendance_db',
        process.env.MONGODB_URI,
        'mongodb://localhost:27017/attendance_db',
    ].filter(uri => uri);

    console.log('🔗 Attempting to connect to MongoDB...');

    for (let i = 0; i < mongoURIs.length; i++) {
        const uri = mongoURIs[i];
        const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
        console.log(`📍 Trying MongoDB URI ${i + 1}/${mongoURIs.length}: ${maskedUri}`);

        try {
            await mongoose.connect(uri, mongoOptions);
            console.log('✅ Connected to MongoDB successfully!');
            console.log(`📊 Database: attendance_db`);
            return;
        } catch (error) {
            console.log(`❌ Connection ${i + 1} failed: ${error.message}`);

            if (i === mongoURIs.length - 1) {
                console.error('\n🚨 All MongoDB connection attempts failed!');
                process.exit(1);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

module.exports = connectMongoDB;
