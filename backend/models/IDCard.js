const mongoose = require('mongoose');

const idCardSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One ID card request per student for now
    },
    personalDetails: {
        name: { type: String, required: true },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
        dob: { type: Date, required: true },
        category: { type: String, enum: ['General', 'OBC', 'SC', 'ST'], required: true },
        bloodGroup: { type: String },
        fatherName: { type: String, required: true },
        motherName: { type: String, required: true },
        address: { type: String, required: true },
        mobileNumber: { type: String, required: true }
    },
    academicDetails: {
        course: { type: String, required: true },
        session: { type: String, required: true, default: '2023-2024' },
        admissionDate: { type: Date, required: true },
        admissionNumber: { type: String, unique: true }, // Auto-generated or provided
        enrollmentNumber: { type: String, required: true }
    },
    uploads: {
        photo: { type: String, required: true }, // Path or Base64
        signature: { type: String } // Path or Base64
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String
    },
    approvalDate: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('IDCard', idCardSchema);
