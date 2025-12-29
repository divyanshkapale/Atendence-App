const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
// You might want to add auth middleware here if needed, but keeping it simple as requested
// const auth = require('../middleware/auth'); 

router.get('/', holidayController.getHolidays);
router.post('/', holidayController.saveHoliday);
router.delete('/:date', holidayController.deleteHoliday);

module.exports = router;
