const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Create index for location queries
attendanceSchema.index({ latitude: 1, longitude: 1 });

// Index for efficient queries by user and date
attendanceSchema.index({ userId: 1, createdAt: 1 });

// Static method to check if user has uploaded today
attendanceSchema.statics.hasUploadedToday = async function(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`Checking uploads for user ${userId} between ${today} and ${tomorrow}`);
    
    const records = await this.find({
        userId: userId,
        createdAt: {
            $gte: today,
            $lt: tomorrow
        }
    });
    
    console.log(`Found ${records.length} records for today:`, records.map(r => ({
        id: r._id,
        createdAt: r.createdAt,
        username: r.username
    })));
    
    return records.length > 0;
};

// Static method to get attendance statistics
attendanceSchema.statics.getStats = async function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [totalRecords, todayRecords, uniqueUsersResult] = await Promise.all([
        this.countDocuments(),
        this.countDocuments({
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        }),
        this.distinct('userId')
    ]);
    
    return {
        totalRecords,
        todayRecords,
        uniqueUsers: uniqueUsersResult.length
    };
};

// Pre-save validation for coordinates
attendanceSchema.pre('save', function(next) {
    if (!this.latitude || !this.longitude) {
        return next(new Error('Latitude and longitude are required'));
    }
    next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 