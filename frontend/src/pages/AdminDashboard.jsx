import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalRecords: 0, todayRecords: 0, uniqueUsers: 0 });
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [visibleCount, setVisibleCount] = useState(3);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, recordsRes, usersRes] = await Promise.all([
                axios.get('/api/attendance/stats'),
                axios.get('/api/attendance/all'),
                axios.get('/api/auth/users')
            ]);
            setStats(statsRes.data);
            setRecords(recordsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = async () => {
        if (!filters.startDate || !filters.endDate) return;
        try {
            const response = await axios.get(`/api/attendance/all?startDate=${filters.startDate}&endDate=${filters.endDate}`);
            setRecords(response.data);
        } catch (error) {
            console.error('Error filtering records:', error);
        }
    };

    const clearFilter = () => {
        setFilters({ startDate: '', endDate: '' });
        setSelectedUser('');
        fetchData();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await axios.delete(`/api/attendance/${id}`);
            fetchData();
            // Update stats locally or re-fetch
            setStats(prev => ({ ...prev, total: prev.total - 1 }));
        } catch (error) {
            console.error('Error deleting record:', error);
            alert('Failed to delete record');
        }
    };

    const exportCSV = () => {
        const headers = ['Date', 'Time', 'Username', 'Role', 'Latitude', 'Longitude', 'Live Location', 'Photo URL'];
        const csvContent = [
            headers.join(','),
            ...records.map(r => [
                new Date(r.createdAt).toLocaleDateString(),
                new Date(r.createdAt).toLocaleTimeString(),
                r.username || 'Unknown',
                r.userId?.role || 'member',
                r.latitude || 'N/A',
                r.longitude || 'N/A',
                (r.latitude && r.longitude) ? `"https://www.google.com/maps?q=${r.latitude},${r.longitude}"` : 'N/A',
                r.photo
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div className="p-2 md:p-4 max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-primary">👨‍💼 Admin Panel</h2>

            <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-8 bg-base-100">
                <div className="stat">
                    <div className="stat-figure text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </div>
                    <div className="stat-title">Total Records</div>
                    <div className="stat-value text-primary text-2xl md:text-4xl">{stats.totalRecords}</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div className="stat-title">Today's Records</div>
                    <div className="stat-value text-secondary text-2xl md:text-4xl">{stats.todayRecords}</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                    <div className="stat-title">Unique Users</div>
                    <div className="stat-value text-accent text-2xl md:text-4xl">{stats.uniqueUsers}</div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl mb-8">
                <div className="card-body p-4 md:p-6">
                    <h3 className="card-title mb-4 text-lg md:text-xl">📅 Filter Records</h3>
                    <div className="flex flex-col md:flex-row flex-wrap gap-4 items-end">
                        <div className="form-control w-full md:max-w-xs">
                            <label className="label">
                                <span className="label-text font-semibold">From Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>
                        <div className="form-control w-full md:max-w-xs">
                            <label className="label">
                                <span className="label-text font-semibold">To Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={filters.endDate}
                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                        <div className="form-control w-full md:max-w-xs">
                            <label className="label">
                                <span className="label-text font-semibold">Filter by User</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={selectedUser}
                                onChange={e => setSelectedUser(e.target.value)}
                            >
                                <option value="">All Users</option>
                                {users.filter(user => user.role !== 'admin').map(user => (
                                    <option key={user._id} value={user.username}>{user.username}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button className="btn btn-primary flex-1 md:flex-none" onClick={handleFilter}>🔍 Filter</button>
                            <button className="btn btn-ghost flex-1 md:flex-none" onClick={clearFilter}>Clear</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <button className="btn btn-outline w-full md:w-auto" onClick={fetchData}>🔄 Refresh All Records</button>
                <button className="btn btn-success text-white w-full md:w-auto" onClick={exportCSV}>📊 Export to CSV</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records
                    .filter(r => !selectedUser || r.username === selectedUser)
                    .slice(0, visibleCount)
                    .map(record => (
                        <AttendanceCard key={record._id} record={record} handleDelete={handleDelete} />
                    ))}
            </div>

            {records.filter(r => !selectedUser || r.username === selectedUser).length > 3 && (
                <div className="flex justify-center mt-6">
                    {visibleCount < records.filter(r => !selectedUser || r.username === selectedUser).length ? (
                        <button className="btn btn-outline btn-primary" onClick={() => setVisibleCount(prev => prev + 3)}>
                            View More
                        </button>
                    ) : (
                        <button className="btn btn-outline" onClick={() => setVisibleCount(3)}>
                            Show Less
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const AttendanceCard = ({ record, handleDelete }) => (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <figure className="px-4 pt-4">
            <img
                src={record.photo.startsWith('data:') ? record.photo : (record.photo.startsWith('http') ? record.photo : `/${record.photo}`)}
                alt="Attendance"
                className="rounded-xl h-48 w-full object-cover"
                onError={(e) => e.target.src = 'placeholder.png'}
            />
        </figure>
        <div className="card-body p-4">
            <div className="flex justify-between items-center mb-2">
                <h2 className="card-title text-xl">{record.username}</h2>
                <div className={`badge ${record.userId?.role === 'admin' ? 'badge-primary' : 'badge-secondary'} badge-outline badge-lg`}>
                    {record.userId?.role || 'member'}
                </div>
            </div>

            <div className="text-base opacity-70 space-y-1">
                <p className="flex items-center gap-2">
                    📅 {new Date(record.createdAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </p>
                <p className="flex items-center gap-2">
                    ⏰ {new Date(record.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
                <p>
                    <a
                        href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary flex items-center gap-1"
                    >
                        📍 {record.latitude?.toFixed(6)}, {record.longitude?.toFixed(6)}
                    </a>
                </p>
            </div>

            <div className="card-actions justify-end mt-4">
                <button
                    className="btn btn-error btn-sm btn-outline w-full"
                    onClick={() => handleDelete(record._id)}
                >
                    🗑️ Delete
                </button>
            </div>
        </div>
    </div>
);

export default AdminDashboard;
