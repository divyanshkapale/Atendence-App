const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/idCardController');

// Configure Multer
const { storage } = require('../config/cloudinaryConfig');

// Configure Multer with Cloudinary
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});



// Institution Routes
router.get('/institution', controller.getInstitutionDetails);
router.put('/institution', authenticateToken, requireAdmin, upload.fields([
    { name: 'sealImage', maxCount: 1 },
    { name: 'principalSignature', maxCount: 1 }
]), controller.updateInstitutionDetails);

// ID Card Routes
router.post('/apply', authenticateToken, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
]), controller.applyForIDCard);

router.get('/my-application', authenticateToken, controller.getMyIDCard);

// Admin Routes
router.get('/all', authenticateToken, requireAdmin, controller.getAllIDCards);
router.put('/:id/status', authenticateToken, requireAdmin, controller.updateIDCardStatus);

module.exports = router;
