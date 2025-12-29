const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register new user (admin only)
router.post('/register', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = new User({ username, password, role });
        await user.save();

        res.status(201).json({ message: 'User created successfully', user: user.toJSON() });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Error creating user: ' + error.message });
    }
});

// Public Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, password, enrollmentNumber, email, contactNumber } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        if (enrollmentNumber) {
            const existingEnrollment = await User.findOne({ enrollmentNumber });
            if (existingEnrollment) {
                return res.status(400).json({ error: 'Enrollment Number already registered' });
            }
        }

        const user = new User({
            username,
            password,
            role: 'member', // Default to member
            enrollmentNumber,
            email,
            contactNumber
        });
        await user.save();

        res.status(201).json({ message: 'User registered successfully. Please login.' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Error creating user: ' + error.message });
    }
});

// Login via Enrollment Number (No Password)
router.post('/login-enrollment', async (req, res) => {
    try {
        const { enrollmentNumber } = req.body;
        if (!enrollmentNumber) return res.status(400).json({ error: 'Enrollment Number required' });

        const user = await User.findOne({ enrollmentNumber });
        if (!user) {
            return res.status(404).json({ error: 'Student not found with this enrollment number' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ message: 'Quick Login successful', user: user.toJSON(), token });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in: ' + error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ message: 'Login successful', user: user.toJSON(), token });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in: ' + error.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.findAllWithoutPassword();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users: ' + error.message });
    }
});

// Update user details (admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { enrollmentNumber, email, contactNumber, profilePhoto } = req.body;
        console.log(`Updating user with ID: ${id}`);

        const user = await User.findById(id);
        console.log('User found:', user ? 'Yes' : 'No');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.enrollmentNumber = enrollmentNumber;
        user.email = email;
        user.contactNumber = contactNumber;
        if (profilePhoto) {
            user.profilePhoto = profilePhoto;
        }

        await user.save();

        res.json({ message: 'User updated successfully', user: user.toJSON() });
    } catch (error) {
        res.status(500).json({ error: 'Error updating user: ' + error.message });
    }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Also delete all attendance records for this user
        const Attendance = require('../models/Attendance');
        await Attendance.deleteMany({ userId: id });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user: ' + error.message });
    }
});

module.exports = router; 