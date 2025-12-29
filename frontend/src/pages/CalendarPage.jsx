import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getHolidays, saveHoliday, deleteHoliday } from '../utils/holidayApi';
import { getMyAttendance } from '../utils/attendanceApi';
import HolidayModal from '../components/HolidayModal';
import AttendanceModal from '../components/AttendanceModal';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext exists
import './CalendarPage.css'; // We'll create this for custom styling if needed, or inline

const CalendarPage = () => {
    const { user } = useAuth(); // Get current user to check role
    const [date, setDate] = useState(new Date());
    const [holidays, setHolidays] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [selectedDateStr, setSelectedDateStr] = useState('');
    const [selectedHoliday, setSelectedHoliday] = useState(null);
    const [selectedAttendance, setSelectedAttendance] = useState(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchHolidays();
        if (!isAdmin) {
            fetchAttendance();
        }
    }, [isAdmin]);

    const fetchHolidays = async () => {
        try {
            const data = await getHolidays();
            setHolidays(data);
        } catch (error) {
            console.error('Error fetching holidays:', error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const data = await getMyAttendance();
            // Map date string to attendance record
            const map = {};
            data.forEach(record => {
                const d = new Date(record.createdAt);
                map[formatDate(d)] = record;
            });
            setAttendanceMap(map);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const formatDate = (date) => {
        // Format to YYYY-MM-DD manually to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateClick = (value) => {
        const dateStr = formatDate(value);
        setSelectedDateStr(dateStr);

        // Check if it's Sunday
        const isSunday = value.getDay() === 0;

        const holiday = holidays.find(h => h.date === dateStr);

        // If it's Sunday, we treat it as a holiday
        const effectiveHoliday = holiday || (isSunday ? { date: dateStr, reason: 'Sunday Holiday', isHoliday: true } : null);

        setSelectedHoliday(effectiveHoliday);

        // Check for attendance
        let attendance = attendanceMap[dateStr];

        // Check previous day rule
        if ((effectiveHoliday) && !attendance) {
            const prevDate = new Date(value);
            prevDate.setDate(value.getDate() - 1);
            const prevDateStr = formatDate(prevDate);
            if (attendanceMap[prevDateStr]) {
                attendance = { ...attendanceMap[prevDateStr], isPreviousDay: true };
            }
        }

        if (isAdmin) {
            // Admin always sees holiday modal to edit/add holidays
            setIsModalOpen(true);
        } else {
            // Member logic
            if (attendance) {
                setSelectedAttendance(attendance);
                setIsAttendanceModalOpen(true);
            } else if (effectiveHoliday) {
                // Only show holiday modal if there is no attendance (otherwise attendance takes precedence or we show both? User asked for attendance details)
                setIsModalOpen(true);
            }
        }
    };

    const handleSave = async (holidayData) => {
        try {
            await saveHoliday(holidayData);
            fetchHolidays();
        } catch (error) {
            console.error('Error saving holiday:', error);
        }
    };

    const handleDelete = async (dateStr) => {
        try {
            await deleteHoliday(dateStr);
            fetchHolidays();
        } catch (error) {
            console.error('Error deleting holiday:', error);
        }
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = formatDate(date);
            const isHoliday = holidays.some(h => h.date === dateStr);
            const isSunday = date.getDay() === 0;
            const isEffectiveHoliday = isHoliday || isSunday;

            // Check for attendance
            let isPresent = !!attendanceMap[dateStr];

            // Check previous day rule for holidays
            if (isEffectiveHoliday && !isPresent) {
                const prevDate = new Date(date);
                prevDate.setDate(date.getDate() - 1);
                const prevDateStr = formatDate(prevDate);
                if (attendanceMap[prevDateStr]) {
                    isPresent = true;
                }
            }

            if (isPresent) {
                return 'present-tile bg-green-500 text-white rounded-lg font-bold hover:bg-green-600';
            }

            if (isEffectiveHoliday) {
                return 'holiday-tile bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-600';
            }
        }
        return null;
    };

    return (
        <div className="p-4 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6">Holiday Calendar</h1>

            <div className="card bg-base-100 shadow-xl p-4 w-full max-w-4xl">
                <Calendar
                    onChange={setDate}
                    value={date}
                    onClickDay={handleDateClick}
                    tileClassName={tileClassName}
                    className="w-full border-none"
                />
            </div>

            <HolidayModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onDelete={handleDelete}
                selectedDate={selectedDateStr}
                existingHoliday={selectedHoliday}
                isAdmin={isAdmin}
            />

            <AttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                attendance={selectedAttendance}
                date={selectedDateStr}
            />

            <div className="mt-4 text-sm text-gray-500">
                {isAdmin ? 'Click any date to add/edit a holiday.' : (
                    <div className="flex gap-4">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Holiday</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Present</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarPage;
