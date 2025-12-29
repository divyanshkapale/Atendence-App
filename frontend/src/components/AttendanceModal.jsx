import React from 'react';

const AttendanceModal = ({ isOpen, onClose, attendance, date }) => {
    if (!isOpen || !attendance) return null;

    const time = new Date(attendance.createdAt).toLocaleTimeString();
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">Attendance Details - {date} ({dayName})</h3>
                <div className="py-4 space-y-2">
                    <p><strong>Status:</strong> <span className="text-green-600 font-bold">Present</span></p>
                    <p><strong>Time:</strong> {time}</p>
                    <p><strong>Location:</strong></p>
                    <div className="pl-4">
                        <p>Latitude: {attendance.latitude}</p>
                        <p>Longitude: {attendance.longitude}</p>
                        <a
                            href={`https://www.google.com/maps?q=${attendance.latitude},${attendance.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-primary text-sm"
                        >
                            View on Google Maps
                        </a>
                    </div>
                    {attendance.isPreviousDay && (
                        <div className="alert alert-info text-xs mt-2">
                            <span>Note: Attendance marked based on previous working day.</span>
                        </div>
                    )}
                </div>
                <div className="modal-action">
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceModal;
