const Holiday = require('../models/Holiday');

// Get all holidays (optionally filtered by month/year, but for simplicity fetching all or by range)
exports.getHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find();
        res.json(holidays);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add or update a holiday
exports.saveHoliday = async (req, res) => {
    const { date, reason } = req.body;
    try {
        let holiday = await Holiday.findOne({ date });
        if (holiday) {
            holiday.reason = reason;
            holiday.isHoliday = true;
            await holiday.save();
        } else {
            holiday = new Holiday({
                date,
                reason,
                isHoliday: true
            });
            await holiday.save();
        }
        res.status(201).json(holiday);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a holiday
exports.deleteHoliday = async (req, res) => {
    const { date } = req.params;
    try {
        await Holiday.findOneAndDelete({ date });
        res.json({ message: 'Holiday deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
