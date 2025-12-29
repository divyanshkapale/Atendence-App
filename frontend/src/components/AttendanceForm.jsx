import React, { useState, useEffect } from 'react';
import { User, FileText, CheckCircle, Clock, Calendar } from 'lucide-react';

const AttendanceForm = ({ user, onSubmit, loading, hasUploaded }) => {
    // Auto-fill Data
    const [formData, setFormData] = useState({
        name: user?.username || '',
        rollNumber: user?.enrollmentNumber || '',
        subject: 'Botany', // Default or Dropdown
        status: 'Present',
        date: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    });

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setFormData(prev => ({
                ...prev,
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            }));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-4 min-h-screen md:min-h-0 bg-gray-50 md:bg-white md:rounded-xl md:shadow-lg">

            {/* Header */}
            <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-indigo-700">📝 Mark Attendance</h2>
                <p className="text-sm text-gray-500">Please fill the details below</p>
            </div>

            {/* Form Container */}
            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>

                {/* Student Name */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Student Name</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <User size={20} />
                        </div>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            readOnly
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[48px]"
                        />
                    </div>
                </div>

                {/* Roll Number */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Roll Number</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FileText size={20} />
                        </div>
                        <input
                            type="text"
                            name="rollNumber"
                            value={formData.rollNumber}
                            readOnly
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[48px]"
                        />
                    </div>
                </div>

                {/* Subject Dropdown */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Subject</label>
                    <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[48px] appearance-none"
                    >
                        <option value="Botany">🌿 Botany</option>
                        <option value="Zoology">🦁 Zoology</option>
                        <option value="Chemistry">⚗️ Chemistry</option>
                        {/* Add more subjects as needed */}
                    </select>
                </div>

                {/* Attendance Status */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Status</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.status === 'Present' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200'}`}>
                            <input
                                type="radio"
                                name="status"
                                value="Present"
                                checked={formData.status === 'Present'}
                                onChange={handleChange}
                                className="hidden"
                            />
                            <CheckCircle size={20} className={formData.status === 'Present' ? 'fill-green-500 text-white' : 'text-gray-300'} />
                            <span className="font-semibold text-lg">Present</span>
                        </label>

                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.status === 'Absent' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-200'}`}>
                            <input
                                type="radio"
                                name="status"
                                value="Absent"
                                checked={formData.status === 'Absent'}
                                onChange={handleChange}
                                className="hidden"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.status === 'Absent' ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                                {formData.status === 'Absent' && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="font-semibold text-lg">Absent</span>
                        </label>
                    </div>
                </div>

                {/* Date & Time (Read-only) */}
                <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Date</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Calendar size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.date}
                                readOnly
                                className="w-full pl-9 pr-2 py-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-500 min-h-[48px]"
                            />
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Time</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Clock size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.time}
                                readOnly
                                className="w-full pl-9 pr-2 py-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-500 min-h-[48px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || hasUploaded || formData.status === 'Absent'}
                    className={`mt-4 w-full py-4 rounded-xl text-lg font-bold shadow-lg transition-transform active:scale-95 ${hasUploaded ? 'bg-gray-400 cursor-not-allowed' :
                            loading ? 'bg-indigo-400 cursor-wait' :
                                'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                        }`}
                >
                    {loading ? 'Submitting...' : hasUploaded ? 'Attendance Marked ✅' : 'Submit Attendance'}
                </button>

            </form>
        </div>
    );
};

export default AttendanceForm;
