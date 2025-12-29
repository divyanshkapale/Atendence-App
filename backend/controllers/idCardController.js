const IDCard = require('../models/IDCard');
const Institution = require('../models/Institution');
const fs = require('fs-extra');
const path = require('path');
const User = require('../models/User');

// Helper to get institution details
const getInstitutionDetails = async (req, res) => {
    try {
        let inst = await Institution.findOne();
        if (!inst) {
            inst = await Institution.create({});
        }
        res.json(inst);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update institution details
const updateInstitutionDetails = async (req, res) => {
    try {
        // Handle file uploads if present
        let updateData = { ...req.body };

        if (req.files) {
            if (req.files.sealImage) {
                updateData.sealImage = req.files.sealImage[0].path;
            }
            if (req.files.principalSignature) {
                updateData.principalSignature = req.files.principalSignature[0].path;
            }
        }

        let inst = await Institution.findOne();
        if (!inst) {
            inst = new Institution(updateData);
        } else {
            Object.assign(inst, updateData);
        }
        await inst.save();
        res.json(inst);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Student Apply or Update
const applyForIDCard = async (req, res) => {
    try {
        const userId = req.user._id;

        // Parse personal and academic details from stringified JSON if sent as form-data
        let personalDetails = typeof req.body.personalDetails === 'string' ? JSON.parse(req.body.personalDetails) : req.body.personalDetails;
        let academicDetails = typeof req.body.academicDetails === 'string' ? JSON.parse(req.body.academicDetails) : req.body.academicDetails;

        if (!personalDetails || !academicDetails) {
            return res.status(400).json({ error: 'Personal and Academic details are required' });
        }

        const enrollmentNumber = academicDetails.enrollmentNumber;
        const mobileNumber = personalDetails.mobileNumber;
        const newName = personalDetails.name;

        // 1. Check for duplicates in other users or current user update
        if (enrollmentNumber || mobileNumber) {
            const existingUser = await User.findOne({
                _id: { $ne: userId },
                $or: [
                    { enrollmentNumber: enrollmentNumber },
                    { contactNumber: mobileNumber }
                ]
            });

            if (existingUser) {
                if (existingUser.enrollmentNumber === enrollmentNumber) {
                    return res.status(400).json({ error: 'Enrollment Number already registered to another student' });
                }
                if (existingUser.contactNumber === mobileNumber) {
                    return res.status(400).json({ error: 'Mobile Number already registered to another student' });
                }
            }
        }

        // 2. Update User Profile (Sync)
        try {
            await User.findByIdAndUpdate(userId, {
                username: newName,
                enrollmentNumber: enrollmentNumber,
                contactNumber: mobileNumber
            });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(400).json({ error: 'Username "' + newName + '" is already taken. Please add an initial or full name.' });
            }
            throw err;
        }

        const uploads = {};
        if (req.files) {
            if (req.files.photo) uploads.photo = req.files.photo[0].path.replace(/\\/g, '/'); // Normalize path
            if (req.files.signature) uploads.signature = req.files.signature[0].path.replace(/\\/g, '/');
        }

        // Check if exists
        let idCard = await IDCard.findOne({ student: userId });

        if (idCard) {
            // Update
            // Allow editing of approved cards (it will reset to pending below)
            // if (idCard.status === 'approved' && req.user.role !== 'admin') {
            //     return res.status(403).json({ error: 'Cannot edit approved ID card' });
            // }

            // Only update uploads if new files provided
            if (uploads.photo) idCard.uploads.photo = uploads.photo;
            if (uploads.signature) idCard.uploads.signature = uploads.signature;

            idCard.personalDetails = { ...idCard.personalDetails, ...personalDetails };
            idCard.academicDetails = { ...idCard.academicDetails, ...academicDetails };
            idCard.status = 'pending'; // Reset to pending on edit
            await idCard.save();
        } else {
            // Create
            if (!uploads.photo) return res.status(400).json({ error: 'Photo is required' });

            // Auto-generate Admission Number if not provided
            if (!academicDetails.admissionNumber) {
                academicDetails.admissionNumber = 'ADM-' + Date.now().toString().slice(-6);
            }

            idCard = new IDCard({
                student: userId,
                personalDetails,
                academicDetails,
                uploads
            });
            await idCard.save();
        }
        res.json(idCard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get My ID Card
const getMyIDCard = async (req, res) => {
    try {
        const idCard = await IDCard.findOne({ student: req.user._id }).populate('student', 'username email');
        if (!idCard) return res.status(404).json({ error: 'ID Card application not found' });
        res.json(idCard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: Get All
const getAllIDCards = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const cards = await IDCard.find(query).populate('student', 'username email');
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: Update Status
const updateIDCardStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        const idCard = await IDCard.findById(id);
        if (!idCard) return res.status(404).json({ error: 'ID Card not found' });

        idCard.status = status;
        if (status === 'rejected') {
            idCard.rejectionReason = rejectionReason;
            idCard.approvalDate = undefined;
        } else if (status === 'approved') {
            idCard.rejectionReason = undefined;
            idCard.approvalDate = new Date();
        } else {
            idCard.rejectionReason = undefined;
            idCard.approvalDate = undefined;
        }

        await idCard.save();
        res.json(idCard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getInstitutionDetails,
    updateInstitutionDetails,
    applyForIDCard,
    getMyIDCard,
    getAllIDCards,
    updateIDCardStatus
};
