import React, { useState, useEffect } from 'react';
import IDCardPreview from '../components/IDCardPreview';

const AdminIDCardRequests = () => {
    const [requests, setRequests] = useState([]);
    const [institutionData, setInstitutionData] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);

    // Institution Settings Form
    const [instFiles, setInstFiles] = useState({ sealImage: null, principalSignature: null });
    const [showInstModal, setShowInstModal] = useState(false);

    useEffect(() => {
        fetchInstitutionDetails();
        fetchRequests();
    }, [filterStatus]);

    const fetchInstitutionDetails = async () => {
        try {
            const res = await fetch('/api/id-card/institution');
            const data = await res.json();
            setInstitutionData(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const url = filterStatus === 'all' ? '/api/id-card/all' : `/api/id-card/all?status=${filterStatus}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus, reason = '') => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/id-card/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus, rejectionReason: reason })
            });

            if (res.ok) {
                // Update local list
                setRequests(prev => prev.map(r => r._id === id ? { ...r, status: newStatus, rejectionReason: reason } : r));
                setSelectedRequest(null); // Close modal
            }
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        }
    };

    const handleInstSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const formData = new FormData();
        if (instFiles.sealImage) formData.append('sealImage', instFiles.sealImage);
        if (instFiles.principalSignature) formData.append('principalSignature', instFiles.principalSignature);

        try {
            const res = await fetch('/api/id-card/institution', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                alert('Institution details updated');
                fetchInstitutionDetails();
                setShowInstModal(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Student ID Card Administration</h1>
                <button
                    onClick={() => setShowInstModal(true)}
                    className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                    ⚙️ Institution Settings
                </button>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
                {['all', 'pending', 'approved', 'rejected'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-4 py-1 rounded-full capitalize ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Student Name</th>
                            <th className="p-4">Enrollment</th>
                            <th className="p-4">Course</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {requests.map(req => (
                            <tr key={req._id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium">{req.personalDetails.name}</td>
                                <td className="p-4 text-gray-600">{req.academicDetails.enrollmentNumber}</td>
                                <td className="p-4 text-gray-600">{req.academicDetails.course}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => setSelectedRequest(req)}
                                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        View & Action
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr><td colSpan="5" className="p-6 text-center text-gray-500">No requests found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal for Request Details */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">

                        {/* Preview */}
                        <div className="flex-1 flex justify-center bg-gray-100 p-4 rounded-lg">
                            {institutionData && (
                                <IDCardPreview
                                    studentData={selectedRequest}
                                    institutionData={institutionData}
                                    status={selectedRequest.status}
                                    approvalDate={selectedRequest.approvalDate}
                                    disableWatermark={true}
                                />
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold">Action Required</h3>
                                <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>

                            <div className="space-y-3 text-sm text-gray-700 border-b pb-4 overflow-y-auto max-h-[60vh]">
                                <h4 className="font-bold text-gray-900 border-b pb-1">Application Details</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="font-semibold text-gray-600">Submitted:</span>
                                    <span>{new Date(selectedRequest.createdAt).toLocaleDateString()}</span>

                                    <span className="font-semibold text-gray-600">Enrollment No:</span>
                                    <span>{selectedRequest.academicDetails.enrollmentNumber}</span>

                                    <span className="font-semibold text-gray-600">Session:</span>
                                    <span>{selectedRequest.academicDetails.session}</span>

                                    <span className="font-semibold text-gray-600">Admission Date:</span>
                                    <span>{selectedRequest.academicDetails.admissionDate ? new Date(selectedRequest.academicDetails.admissionDate).toLocaleDateString() : 'N/A'}</span>

                                    <span className="font-semibold text-gray-600">Gender:</span>
                                    <span>{selectedRequest.personalDetails.gender}</span>

                                    <span className="font-semibold text-gray-600">Category:</span>
                                    <span>{selectedRequest.personalDetails.category}</span>

                                    <span className="font-semibold text-gray-600">Father's Name:</span>
                                    <span>{selectedRequest.personalDetails.fatherName}</span>

                                    <span className="font-semibold text-gray-600">Mother's Name:</span>
                                    <span>{selectedRequest.personalDetails.motherName}</span>

                                    <span className="font-semibold text-gray-600">Mobile:</span>
                                    <span>{selectedRequest.personalDetails.mobileNumber}</span>

                                    <span className="font-semibold text-gray-600 col-span-2 mt-2">Address:</span>
                                    <span className="col-span-2 bg-gray-50 p-2 rounded">{selectedRequest.personalDetails.address}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {selectedRequest.status !== 'approved' && (
                                    <button
                                        onClick={() => handleStatusUpdate(selectedRequest._id, 'approved')}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
                                    >
                                        Approve Application
                                    </button>
                                )}

                                {selectedRequest.status !== 'rejected' && (
                                    <div className="mt-4">
                                        <label className="text-sm font-semibold text-red-800">Reject Application</label>
                                        <div className="flex gap-2 mt-1">
                                            <input
                                                type="text"
                                                id="rejectionReason"
                                                placeholder="Reason for rejection..."
                                                className="flex-1 border p-2 rounded"
                                            />
                                            <button
                                                onClick={() => {
                                                    const reason = document.getElementById('rejectionReason').value;
                                                    if (reason) handleStatusUpdate(selectedRequest._id, 'rejected', reason);
                                                    else alert('Please provide a reason');
                                                }}
                                                className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Institution Settings */}
            {showInstModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Edit Institution Details</h3>
                        <form onSubmit={handleInstSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1 font-semibold">College Seal</label>
                                <input type="file" accept="image/*" onChange={e => setInstFiles(p => ({ ...p, sealImage: e.target.files[0] }))} className="w-full" />
                                {institutionData?.sealImage && <p className="text-xs text-gray-500 mt-1">Current seal exists</p>}
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">Principal Signature</label>
                                <input type="file" accept="image/*" onChange={e => setInstFiles(p => ({ ...p, principalSignature: e.target.files[0] }))} className="w-full" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowInstModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminIDCardRequests;
