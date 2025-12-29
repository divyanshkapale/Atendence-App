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
        <div className="hero min-h-screen bg-base-200 items-start pt-4 md:pt-8 pb-12">
            <div className="hero-content flex-col lg:flex-row items-start w-full max-w-7xl gap-8 p-4">

                {/* Left Column: Form Section */}
                <div className="card w-full lg:w-3/5 bg-base-100 shadow-xl shrink-0">
                    <div className="card-body p-4 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
                            <div>
                                <h1 className="card-title text-2xl md:text-3xl font-bold">ID Card Application</h1>
                                <p className="text-sm text-base-content/70">Fill in your details to generate your digital ID card.</p>
                            </div>
                            {status === 'approved' && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-outline btn-sm gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    Edit Details
                                </button>
                            )}
                        </div>

                        {status && (
                            <div className={`alert shadow-lg mb-6 ${status === 'approved' ? 'alert-success' :
                                    status === 'rejected' ? 'alert-error' :
                                        'alert-warning'
                                }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <h3 className="font-bold uppercase tracking-wider text-sm">Status: {status}</h3>
                                    {status === 'rejected' && <div className="text-xs mt-1">Reason: {rejectionReason}</div>}
                                    {status === 'approved' && <div className="text-xs mt-1">Your card is ready! Use the Download button to save it.</div>}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Personal Details Section */}
                            <div>
                                <h3 className="text-lg font-bold text-primary border-b border-base-300 pb-2 mb-4">Personal Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Full Name</span></label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input input-bordered w-full focus:input-primary" disabled={isReadOnly} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Father's Name</span></label>
                                        <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required className="input input-bordered w-full focus:input-primary" disabled={isReadOnly} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Mother's Name</span></label>
                                        <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className="input input-bordered w-full focus:input-primary" disabled={isReadOnly} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Date of Birth</span></label>
                                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="input input-bordered w-full focus:input-primary" disabled={isReadOnly} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Gender</span></label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} required className="select select-bordered w-full focus:select-primary" disabled={isReadOnly}>
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Category</span></label>
                                        <select name="category" value={formData.category} onChange={handleChange} required className="select select-bordered w-full focus:select-primary" disabled={isReadOnly}>
                                            <option value="">Select Category</option>
                                            <option value="General">General</option>
                                            <option value="OBC">OBC</option>
                                            <option value="SC">SC</option>
                                            <option value="ST">ST</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Blood Group</span></label>
                                        <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="input input-bordered w-full focus:input-primary" placeholder="e.g. O+" disabled={isReadOnly} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Mobile Number</span></label>
                                        <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required className="input input-bordered w-full focus:input-primary" disabled={isReadOnly} />
                                    </div>
                                    <div className="form-control md:col-span-2">
                                        <label className="label"><span className="label-text font-semibold">Full Address</span></label>
                                        <textarea name="address" value={formData.address} onChange={handleChange} required className="textarea textarea-bordered h-24 focus:textarea-primary" disabled={isReadOnly}></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Details Section */}
                            <div>
                                <h3 className="text-lg font-bold text-primary border-b border-base-300 pb-2 mb-4">Academic Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Course / Class</span></label>
                                        <input type="text" name="course" value={formData.course} onChange={handleChange} required className="input input-bordered w-full focus:input-primary" placeholder="e.g. B.Sc CS" disabled={isReadOnly} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Session</span></label>
                                        <input type="text" name="session" value={formData.session} onChange={handleChange} required className="input input-bordered w-full focus:input-primary" placeholder="e.g. 2024-25" disabled={isReadOnly} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Admission Number</span></label>
                                        <input type="text" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} className="input input-bordered w-full focus:input-primary" placeholder="Auto-generated if empty" disabled={isReadOnly} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Enrollment Number</span></label>
                                        <input type="text" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} required className="input input-bordered w-full focus:input-primary" disabled={isReadOnly} />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Admission Date</span></label>
                                        <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} required className="input input-bordered w-full focus:input-primary" disabled={isReadOnly} />
                                    </div>
                                </div>
                            </div>

                            {/* Uploads Section */}
                            <div>
                                <h3 className="text-lg font-bold text-primary border-b border-base-300 pb-2 mb-4">Documents Upload</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Student Photo</span></label>
                                        <input type="file" name="photo" onChange={handleFileChange} accept="image/*" required={!files.photoPreview} className="file-input file-input-bordered file-input-primary w-full" disabled={isReadOnly} />
                                        <label className="label"><span className="label-text-alt">Supported: JPG, PNG (Max 2MB)</span></label>
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Student Signature</span></label>
                                        <input type="file" name="signature" onChange={handleFileChange} accept="image/*" className="file-input file-input-bordered file-input-primary w-full" disabled={isReadOnly} />
                                        <label className="label"><span className="label-text-alt">Supported: JPG, PNG (Max 2MB)</span></label>
                                    </div>
                                </div>
                            </div>

                            {!isReadOnly && (
                                <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-base-300">
                                    {isEditing && (
                                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-ghost flex-1">
                                            Cancel
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary flex-1 text-lg shadow-lg">
                                        {status === 'approved' ? 'Update & Resubmit' : (status === 'rejected' ? 'Resubmit Application' : 'Submit Application')}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div className="w-full lg:w-2/5 flex flex-col items-center sticky top-8 h-fit">
                    <div className="alert alert-info shadow-sm mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>Live Preview – This is how your card will look.</span>
                    </div>

                    {institutionData ? (
                        <div className="shadow-2xl rounded-lg overflow-hidden ring-4 ring-base-300 transform hover:scale-[1.02] transition-transform duration-300">
                            <IDCardPreview studentData={previewData} institutionData={institutionData} status={status} approvalDate={approvalDate} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 bg-base-100 rounded-xl shadow w-full h-64">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                            <span className="mt-4 text-base-content/60">Loading Template...</span>
                        </div>
                    )}

                    {status === 'approved' && (
                        <button
                            onClick={downloadImage}
                            className="btn btn-success btn-lg w-full mt-8 shadow-xl text-white gap-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download ID Card
                        </button>
                    )}
                </div>
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
        </div>
    );
};

export default IDCardApply;
