import React, { useState, useEffect } from 'react';

const HolidayModal = ({ isOpen, onClose, onSave, onDelete, selectedDate, existingHoliday, isAdmin }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (existingHoliday) {
            setReason(existingHoliday.reason);
        } else {
            setReason('');
        }
    }, [existingHoliday, selectedDate]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ date: selectedDate, reason });
        onClose();
    };

    const handleDelete = () => {
        onDelete(selectedDate);
        onClose();
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">
                    {existingHoliday ? 'Edit Holiday' : 'Add Holiday'} - {selectedDate}
                </h3>

                {isAdmin ? (
                    <form onSubmit={handleSubmit} className="py-4">
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Reason</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. New Year"
                                className="input input-bordered w-full"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            />
                        </div>

                        <div className="modal-action">
                            {existingHoliday && (
                                <button
                                    type="button"
                                    className="btn btn-error text-white"
                                    onClick={handleDelete}
                                >
                                    Delete
                                </button>
                            )}
                            <button type="button" className="btn" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save</button>
                        </div>
                    </form>
                ) : (
                    <div className="py-4">
                        <p className="text-lg">{existingHoliday?.reason || 'No holiday details available.'}</p>
                        <div className="modal-action">
                            <button className="btn" onClick={onClose}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HolidayModal;
