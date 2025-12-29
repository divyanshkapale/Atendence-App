const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
    name: { type: String, required: true, default: 'Govt. Penchvalley College Parasiya' },
    address: { type: String },
    sealImage: { type: String }, // Path or Base64
    principalSignature: { type: String } // Path or Base64
}, {
    timestamps: true
});

module.exports = mongoose.model('Institution', institutionSchema);
