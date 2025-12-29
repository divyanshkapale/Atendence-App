const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
        unique: true
    },
    isHoliday: {
        type: Boolean,
        default: true
    },
    reason: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Holiday', holidaySchema);
