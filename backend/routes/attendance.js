const express = require('express');
const multer = require('multer');
const path = require('path');
const Attendance = require('../models/Attendance');
const { authenticateToken, requireAdmin, requireMember } = require('../middleware/auth');
const fs = require('fs-extra');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'attendance-app',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

// Helper function to delete an uploaded file from Cloudinary
async function deleteUploadedFile(publicId) {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`🗑️ Deleted file from Cloudinary: ${publicId}`);
    } catch (error) {
        console.error(`❌ Error deleting file from Cloudinary: ${error.message}`);
    }
}


// Upload attendance photo (members only - NOW SINGLE ENTRY)
router.post('/upload', authenticateToken, requireMember, upload.single('photo'), async (req, res) => {
    try {
        // 1. MODIFIED: Removed 'type' from destructuring, as the client no longer sends it.
        const { latitude, longitude } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'Photo is required' });
        }

        if (!latitude || !longitude) {
            deleteUploadedFile(req.file.filename);
            return res.status(400).json({ error: 'Location coordinates are required' });
        }

        // 2. NEW LOGIC: Check if ANY attendance was uploaded today.
        // 🎯 FIX REQUIRES Attendance.hasUploadedToday to be defined in Attendance.js
        const hasUploadedToday = await Attendance.hasUploadedToday(req.user._id);

        if (hasUploadedToday) {
            deleteUploadedFile(req.file.filename);
            return res.status(429).json({
                error: 'Attendance already uploaded today. Try again tomorrow.'
            });
        }

        // Clean up old photos for this user (keeps storage trim)
        // await cleanupOldPhotos(req.user._id); // Not needed for Cloudinary

        // Get Cloudinary URL
        const photoUrl = req.file.path;
        // Store public_id if you want to delete it later: req.file.filename

        const attendance = new Attendance({
            userId: req.user._id,
            username: req.user.username,

            // 3. FIXED: Set a default type for the database to satisfy the schema
            type: 'daily-entry',

            photo: photoUrl,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        });

        await attendance.save();

        console.log(`✅ New attendance photo saved: ${req.file.filename} for user: ${req.user.username}`);

        // 4. FIXED: Simplified success message
        res.status(201).json({
            message: 'Attendance recorded successfully!',
            attendance
        });
    } catch (error) {
        console.error('❌ Upload error:', error);
        // Ensure uploaded file is deleted if database save or any other step fails
        if (req.file) deleteUploadedFile(req.file.filename);
        res.status(500).json({ error: 'Error recording attendance: ' + error.message });
    }
});

// Get attendance upload status (MODIFIED FOR SINGLE-ENTRY CLIENT)
router.get('/upload-status', authenticateToken, requireMember, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayUploads = await Attendance.find({
            userId: req.user._id,
            createdAt: { $gte: today }
        }).sort({ createdAt: -1 });

        const hasUploadedToday = todayUploads.length > 0;

        // Send the simplified status back to the client
        res.json({
            hasUploadedToday: hasUploadedToday,
            todayUploads: todayUploads
        });
    } catch (error) {
        console.error('❌ Status check error:', error);
        res.status(500).json({ error: 'Error checking attendance status: ' + error.message });
    }
});


// Function to clean up old photos (keep only the latest one per user)
async function cleanupOldPhotos(userId) {
    try {
        // Get all photos for this user, sorted by creation date (oldest first)
        const userPhotos = await Attendance.find({ userId: userId })
            .sort({ createdAt: 1 }) // Oldest first
            .select('photo createdAt');

        console.log(`🔍 Found ${userPhotos.length} existing photos for user ${userId}`);

        // If user has more than 1 photo, delete the older ones
        if (userPhotos.length > 1) {
            // Keep only the latest photo, delete the rest
            const photosToDelete = userPhotos.slice(0, -1); // All except the last one

            for (const record of photosToDelete) {
                if (record.photo) {
                    const photoPath = path.join(__dirname, '..', record.photo);

                    if (fs.existsSync(photoPath)) {
                        fs.unlinkSync(photoPath);
                        console.log(`🗑️ Deleted old photo: ${photoPath}`);
                    }
                }
            }

            console.log(`✅ Cleaned up ${photosToDelete.length} old photos for user ${userId}`);
        }
    } catch (error) {
        console.error('❌ Error cleaning up old photos:', error);
        // Don't throw error - continue with upload even if cleanup fails
    }
}

// Comprehensive photo cleanup - removes orphaned photos
async function cleanupOrphanedPhotos() {
    try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');

        if (!fs.existsSync(uploadsDir)) {
            console.log('📁 Uploads directory does not exist');
            return { deleted: 0, kept: 0 };
        }

        // Get all files in uploads directory
        const allFiles = fs.readdirSync(uploadsDir);
        const imageFiles = allFiles.filter(file =>
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );

        console.log(`🔍 Found ${imageFiles.length} image files in uploads directory`);

        // Get all photo paths from database
        const allRecords = await Attendance.find({}, 'photo').lean();
        const dbPhotoPaths = allRecords
            .map(record => record.photo)
            .filter(photo => photo)
            .map(photo => photo.replace('uploads/', '')); // Remove uploads/ prefix

        console.log(`📊 Found ${dbPhotoPaths.length} photos referenced in database`);

        let deletedCount = 0;
        let keptCount = 0;

        // Check each file in uploads directory
        for (const file of imageFiles) {
            if (dbPhotoPaths.includes(file)) {
                keptCount++;
                console.log(`✅ Keeping referenced photo: ${file}`);
            } else {
                // This file is not referenced in database - delete it
                const filePath = path.join(uploadsDir, file);
                fs.unlinkSync(filePath);
                deletedCount++;
                console.log(`🗑️ Deleted orphaned photo: ${file}`);
            }
        }

        console.log(`🧹 Cleanup complete: ${deletedCount} deleted, ${keptCount} kept`);

        return { deleted: deletedCount, kept: keptCount };

    } catch (error) {
        console.error('❌ Error during photo cleanup:', error);
        throw error;
    }
}

// Admin route to manually trigger photo cleanup
router.post('/cleanup-photos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('🧹 Admin triggered photo cleanup');
        const result = await cleanupOrphanedPhotos();

        res.json({
            message: 'Photo cleanup completed successfully',
            deleted: result.deleted,
            kept: result.kept
        });

    } catch (error) {
        console.error('❌ Photo cleanup failed:', error);
        res.status(500).json({ error: 'Photo cleanup failed: ' + error.message });
    }
});

// Get all attendance records (admin only)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        // Add date filtering if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                // Add one day to endDate to include the entire end date
                const endDateTime = new Date(endDate);
                endDateTime.setDate(endDateTime.getDate() + 1);
                query.createdAt.$lt = endDateTime;
            }
        }

        const records = await Attendance.find(query).sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching attendance records: ' + error.message });
    }
});

// Get current user's attendance records
router.get('/my-records', authenticateToken, async (req, res) => {
    try {
        const records = await Attendance.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching your records: ' + error.message });
    }
});

/* // ❌ Original /can-upload route logic removed, as it's redundant with /upload-status
router.get('/can-upload', authenticateToken, requireMember, async (req, res) => {
    try {
        const hasUploadedToday = await Attendance.hasUploadedToday(req.user._id);
        res.json({ canUpload: !hasUploadedToday });
    } catch (error) {
        res.status(500).json({ error: 'Error checking upload status: ' + error.message });
    }
});
*/

// Get attendance statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Assuming Attendance.getStats() is correctly implemented on your model 
        // to return simplified stats (total, today's count, unique users)
        const stats = await Attendance.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stats: ' + error.message });
    }
});

// Delete attendance record (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await Attendance.findById(id);

        if (!attendance) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        console.log(`Deleting attendance record: ${id} for user: ${attendance.username}`);

        // Delete photo file from Cloudinary if it exists
        let photoDeleted = false;

        if (attendance.photo) {
            try {
                // Extract public ID from Cloudinary URL
                // Example URL: https://res.cloudinary.com/demo/image/upload/v1570979139/attendance-app/sample.jpg
                // Public ID: attendance-app/sample
                const urlParts = attendance.photo.split('/');
                const versionIndex = urlParts.findIndex(part => part.startsWith('v'));
                if (versionIndex !== -1) {
                    const publicIdWithExtension = urlParts.slice(versionIndex + 1).join('/');
                    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));

                    await cloudinary.uploader.destroy(publicId);
                    photoDeleted = true;
                    console.log(`✅ Photo deleted from Cloudinary: ${publicId}`);
                }
            } catch (fileError) {
                console.error(`❌ Error deleting photo from Cloudinary: ${fileError.message}`);
                // Continue with database deletion even if file deletion fails
            }
        }

        // Delete the database record
        await Attendance.findByIdAndDelete(id);

        const responseMessage = photoDeleted
            ? 'Attendance record and photo deleted successfully'
            : 'Attendance record deleted successfully (photo file was not found)';

        console.log(`✅ Database record deleted: ${id}`);
        res.json({ message: responseMessage });

    } catch (error) {
        console.error(`❌ Error deleting attendance record: ${error.message}`);
        res.status(500).json({ error: 'Error deleting record: ' + error.message });
    }
});

module.exports = router;