import React, { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';

import { useAuth } from '../context/AuthContext';
import IDCardPreview from '../components/IDCardPreview';

const IDCardApply = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null); // null, pending, approved, rejected
    const [rejectionReason, setRejectionReason] = useState('');
    const [approvalDate, setApprovalDate] = useState(null);
    const [applicationId, setApplicationId] = useState(null);
    const [institutionData, setInstitutionData] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        gender: '',
        dob: '',
        category: '',
        bloodGroup: '',
        fatherName: '',
        motherName: '',
        address: '',
        mobileNumber: '',
        course: '',
        session: '',
        admissionDate: '',
        admissionNumber: '',
        enrollmentNumber: '',
    });

    const [files, setFiles] = useState({
        photo: null,
        photoPreview: null,
        signature: null,
        signaturePreview: null
    });

    useEffect(() => {
        fetchInstitutionDetails();
        fetchMyApplication();
    }, []);

    // Also populate basic user data if no application exists
    useEffect(() => {
        if (!applicationId && user) {
            setFormData(prev => ({
                ...prev,
                name: user.username,
                enrollmentNumber: user.enrollmentNumber || '',
                mobileNumber: user.contactNumber || ''
            }));
        }
    }, [user, applicationId]);

    const fetchInstitutionDetails = async () => {
        try {
            const res = await fetch('/api/id-card/institution');
            const data = await res.json();
            setInstitutionData(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMyApplication = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/id-card/my-application', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setApplicationId(data._id);
                setStatus(data.status);
                setRejectionReason(data.rejectionReason);
                setApprovalDate(data.approvalDate);

                // Flatten data for form
                setFormData({
                    ...data.personalDetails,
                    ...data.academicDetails,
                    dob: data.personalDetails.dob ? data.personalDetails.dob.split('T')[0] : '',
                    admissionDate: data.academicDetails.admissionDate ? data.academicDetails.admissionDate.split('T')[0] : ''
                });

                // Set previews
                const getUrl = path => {
                    if (!path) return null;
                    if (path.startsWith('http') || path.startsWith('data:')) return path;
                    const normalized = path.replace(/\\/g, '/');
                    if (normalized.includes('uploads/')) {
                        return `/uploads/${normalized.split('uploads/')[1]}`;
                    }
                    return path;
                };

                setFiles({
                    photo: null, // Don't set file object, just preview
                    photoPreview: data.uploads.photo ? getUrl(data.uploads.photo) : null,
                    signature: null,
                    signaturePreview: data.uploads.signature ? getUrl(data.uploads.signature) : null
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (selectedFiles[0]) {
            const file = selectedFiles[0];
            setFiles(prev => ({
                ...prev,
                [name]: file,
                [`${name}Preview`]: URL.createObjectURL(file)
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const data = new FormData();

        const personalDetails = {
            name: formData.name,
            gender: formData.gender,
            dob: formData.dob,
            category: formData.category,
            bloodGroup: formData.bloodGroup,
            fatherName: formData.fatherName,
            motherName: formData.motherName,
            address: formData.address,
            mobileNumber: formData.mobileNumber
        };

        const academicDetails = {
            course: formData.course,
            session: formData.session,
            admissionDate: formData.admissionDate,
            admissionNumber: formData.admissionNumber,
            enrollmentNumber: formData.enrollmentNumber
        };

        data.append('personalDetails', JSON.stringify(personalDetails));
        data.append('academicDetails', JSON.stringify(academicDetails));

        if (files.photo) data.append('photo', files.photo);
        if (files.signature) data.append('signature', files.signature);

        try {
            const res = await fetch('/api/id-card/apply', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            if (res.ok) {
                const result = await res.json();
                setStatus('pending'); // Optimistic update
                setApplicationId(result._id);
                alert('Application submitted successfully!');
            } else {
                const err = await res.json();
                alert(err.error || 'Submission failed');
            }
        } catch (error) {
            console.error(error);
            alert('Error submitting application');
        }
    };

    const downloadImage = async () => {
        const element = document.getElementById('printable-id-card');
        if (!element) return;

        try {
            // Pre-load images with CORS headers to ensure they are capture-ready
            const images = Array.from(element.getElementsByTagName('img'));
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    const temp = new Image();
                    temp.crossOrigin = 'anonymous';
                    temp.onload = resolve;
                    temp.onerror = resolve; // Continue even if error
                    temp.src = img.src;
                });
            }));

            // Small delay for rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            const dataUrl = await toPng(element, {
                quality: 1.0,
                pixelRatio: 3,
                cacheBust: true,
                skipAutoScale: true
            });
            const link = document.createElement('a');
            link.download = `Student_ID_${formData.enrollmentNumber || 'Card'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Could not generate image:', error);
            alert('Failed to download image. Please try again.');
        }
    };

    const [isEditing, setIsEditing] = useState(false); // Valid Hook position

    if (loading) return <div className="p-8 text-center">Loading ID Card details...</div>;

    const isReadOnly = (status === 'pending' || (status === 'approved' && !isEditing));

    // Construct preview data
    const previewData = {
        personalDetails: { ...formData },
        academicDetails: { ...formData },
        uploads: {
            photo: files.photoPreview,
            signature: files.signaturePreview
        }
    };

    return (
        <div className="container mx-auto p-2 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Left Column: Form/Status */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Student ID Card Application</h1>
                    {status === 'approved' && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm font-semibold hover:bg-indigo-200"
                        >
                            ✏️ Edit Details
                        </button>
                    )}
                </div>

                {status && (
                    <div className={`mb-6 p-4 rounded-lg flex flex-col gap-2 ${status === 'approved' ? 'bg-green-100 text-green-800' :
                        status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        <div className="font-bold uppercase tracking-wider text-sm">Status: {status}</div>
                        {status === 'rejected' && <div className="text-sm">Reason: {rejectionReason}</div>}
                        {status === 'approved' && <div className="text-sm">Your card is ready! Use the Download button to save it.</div>}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Personal Details Section */}
                    <fieldset className="border p-4 rounded-lg" disabled={isReadOnly}>
                        <legend className="font-semibold px-2 text-indigo-600">Personal Details</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="label">Father Name</label>
                                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required className="input w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="label">Mother Name</label>
                                <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className="input w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="label">DOB</label>
                                <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="input w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="label">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} required className="input w-full p-2 border rounded">
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} required className="input w-full p-2 border rounded">
                                    <option value="">Select</option>
                                    <option value="General">General</option>
                                    <option value="OBC">OBC</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Blood Group</label>
                                <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="input w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="label">Mobile</label>
                                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required className="input w-full p-2 border rounded" />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Full Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} required className="input w-full p-2 border rounded h-20"></textarea>
                            </div>
                        </div>
                    </fieldset>

                    {/* Academic Details Section */}
                    <fieldset className="border p-4 rounded-lg" disabled={isReadOnly}>
                        <legend className="font-semibold px-2 text-indigo-600">Academic Details</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Course/Class</label>
                                <input type="text" name="course" value={formData.course} onChange={handleChange} required className="input w-full p-2 border rounded" placeholder="e.g. B.Sc CS" />
                            </div>
                            <div>
                                <label className="label">Session</label>
                                <input type="text" name="session" value={formData.session} onChange={handleChange} required className="input w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="label">Admission Number</label>
                                <input type="text" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} className="input w-full p-2 border rounded" placeholder="Auto-generated if empty" />
                            </div>
                            <div>
                                <label className="label">Enrollment No.</label>
                                <input type="text" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} required className="input w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="label">Admission Date</label>
                                <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} required className="input w-full p-2 border rounded" />
                            </div>
                        </div>
                    </fieldset>

                    {/* Uploads Section */}
                    <fieldset className="border p-4 rounded-lg" disabled={isReadOnly}>
                        <legend className="font-semibold px-2 text-indigo-600">Uploads</legend>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="label">Student Photo</label>
                                <input type="file" name="photo" onChange={handleFileChange} accept="image/*" required={!files.photoPreview} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                            </div>
                            <div>
                                <label className="label">Student Signature</label>
                                <input type="file" name="signature" onChange={handleFileChange} accept="image/*" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                            </div>
                        </div>
                    </fieldset>

                    {!isReadOnly && (
                        <div className="flex gap-2">
                            {isEditing && (
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition">
                                    Cancel
                                </button>
                            )}
                            <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                                {status === 'approved' ? 'Update Details' : (status === 'rejected' ? 'Resubmit Application' : 'Submit Application')}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Right Column: Preview */}
            <div className="flex flex-col items-center sticky top-8 h-fit">
                <h2 className="text-xl font-bold mb-4 text-gray-700">Live Preview</h2>
                {institutionData ? (
                    <IDCardPreview studentData={previewData} institutionData={institutionData} status={status} approvalDate={approvalDate} />
                ) : (
                    <div className="text-gray-500">Loading Institution Config...</div>
                )}

                {status === 'approved' && (
                    <button
                        onClick={downloadImage}
                        className="mt-6 bg-green-600 text-white px-8 py-3 rounded-full shadow-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <span>⬇️ Download ID Card (PNG)</span>
                    </button>
                )}
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-id-card, #printable-id-card * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #printable-id-card {
                        position: absolute;
                        left: 50%;
                        top: 20px;
                        transform: translateX(-50%);
                        margin: 0;
                        padding: 0;
                        box-shadow: none !important;
                        border: 1px solid #000 !important;
                    }
                }
            `}</style>
        </div >
    );
};

export default IDCardApply;
