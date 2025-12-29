const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    },
    enrollmentNumber: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    contactNumber: {
        type: String,
        trim: true
    },
    profilePhoto: {
        type: String // Base64 string
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to validate password
userSchema.methods.validatePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user without password
userSchema.statics.findByIdWithoutPassword = async function (id) {
    return this.findById(id).select('-password');
};

// Static method to find all users without passwords
userSchema.statics.findAllWithoutPassword = async function () {
    return this.find({}).select('-password');
};

// Transform toJSON to remove password
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 