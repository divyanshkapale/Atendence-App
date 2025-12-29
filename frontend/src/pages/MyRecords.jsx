import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyRecords = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(3);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const response = await axios.get('/api/attendance/my-records');
            setRecords(response.data);
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
    );

    return (
        <div className="p-2 md:p-4 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-base-content">📋 My Attendance Records</h2>
                <button className="btn btn-sm md:btn-md btn-primary gap-2" onClick={fetchRecords}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records.length === 0 ? (
                    <div className="col-span-full text-center py-10 bg-base-100 rounded-box shadow-sm">
                        <p className="text-base-content/60">No records found.</p>
                    </div>
                ) : (
                    records.slice(0, visibleCount).map(record => (
                        <div key={record._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                            <figure className="px-4 pt-4">
                                <img
                                    src={record.photo.startsWith('data:') ? record.photo : (record.photo.startsWith('http') ? record.photo : `/${record.photo}`)}
                                    alt="Attendance"
                                    className="rounded-xl h-48 w-full object-cover"
                                    onError={(e) => e.target.src = 'placeholder.png'}
                                />
                            </figure>
                            <div className="card-body p-4">
                                <h3 className="card-title text-base">
                                    {new Date(record.createdAt).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </h3>
                                <div className="text-sm text-base-content/70 mb-2">
                                    {new Date(record.createdAt).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                <div className="card-actions justify-end">
                                    <a
                                        href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-ghost gap-2 text-primary"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                        </svg>
                                        View Location
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {records.length > 3 && (
                <div className="flex justify-center mt-6">
                    {visibleCount < records.length ? (
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

export default MyRecords;
