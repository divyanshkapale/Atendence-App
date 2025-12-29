import React, { useRef } from 'react';
import QRCode from 'react-qr-code';

const IDCardPreview = ({ studentData, institutionData, status, approvalDate, disableWatermark }) => {
    const cardRef = useRef();

    if (!studentData || !institutionData) return <div className="text-gray-500">Preview not available</div>;

    const { personalDetails, academicDetails, uploads } = studentData;
    const { name: collegeName, sealImage, principalSignature } = institutionData;

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('blob:')) return path; // File object URL
        if (path.startsWith('data:')) return path; // Base64
        if (path.startsWith('http')) return path; // External

        // Local upload - try to extract relative path
        const normalized = path.replace(/\\/g, '/');
        if (normalized.includes('uploads/')) {
            const cleanPath = normalized.split('uploads/')[1];
            return `http://localhost:3000/uploads/${cleanPath}`;
        }
        return path; // Fallback
    };

    const qrData = `Name: ${personalDetails?.name}\nEnroll: ${academicDetails?.enrollmentNumber}\nClass: ${academicDetails?.course}\nSession: ${academicDetails?.session}`;

    return (
        <div className="flex flex-col items-center">
            <div
                ref={cardRef}
                className="w-[350px] h-[550px] bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden relative flex flex-col font-sans print:shadow-none print:border print:w-[350px] print:h-[550px]"
                id="printable-id-card"
            >
                {/* Header */}
                <div className="bg-[#1a237e] text-white p-4 text-center">
                    <h2 className="text-lg font-bold uppercase tracking-wide leading-tight">{collegeName}</h2>
                    <p className="text-xs opacity-90 mt-1">Identity Card {academicDetails?.session}</p>
                </div>

                {/* Photo & QR Code */}
                <div className="flex justify-between items-start px-6 mt-6">
                    <div className="w-24 h-24 border-2 border-[#1a237e] rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        {uploads?.photo ? (
                            <img src={getImageUrl(uploads.photo)} crossOrigin="anonymous" alt="Student" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs text-gray-400">No Photo</span>
                        )}
                    </div>
                    <div className="bg-white p-1 border border-gray-200">
                        <QRCode value={qrData} size={80} level="M" />
                    </div>
                </div>

                {/* Details Table */}
                <div className="px-6 py-2 flex-grow text-sm mt-2">
                    <div className="grid grid-cols-3 gap-y-2 items-start">
                        <div className="col-span-3 mb-2 text-center border-b pb-2 border-dashed border-gray-300">
                            <h3 className="text-xl font-bold text-[#1a237e] uppercase leading-tight">{personalDetails?.name}</h3>
                        </div>

                        <div className="font-semibold text-gray-600">Class</div>
                        <div className="col-span-2 font-bold text-gray-800 uppercase">: {academicDetails?.course}</div>

                        <div className="font-semibold text-gray-600">Enroll No</div>
                        <div className="col-span-2 font-bold text-gray-800 uppercase">: {academicDetails?.enrollmentNumber}</div>

                        <div className="font-semibold text-gray-600">DOB</div>
                        <div className="col-span-2 text-gray-800">: {new Date(personalDetails?.dob).toLocaleDateString()}</div>

                        <div className="font-semibold text-gray-600">Father Name</div>
                        <div className="col-span-2 text-gray-800">: {personalDetails?.fatherName}</div>

                        <div className="font-semibold text-gray-600">Mobile</div>
                        <div className="col-span-2 text-gray-800">: {personalDetails?.mobileNumber}</div>

                        <div className="font-semibold text-gray-600">Address</div>
                        <div className="col-span-2 text-xs text-gray-800 leading-tight">: {personalDetails?.address}</div>
                    </div>
                </div>

                {/* Footer / Signatures */}
                <div className="mt-auto mb-4 px-6 w-full flex justify-between items-end relative z-10">
                    <div className="flex flex-col items-center">
                        {uploads?.signature && (
                            <img src={getImageUrl(uploads.signature)} crossOrigin="anonymous" alt="Student Sig" className="h-8 object-contain mb-1" />
                        )}
                        <div className="border-t border-gray-400 w-24 text-center text-[10px] font-semibold text-gray-500">Student Sign</div>
                    </div>

                    <div className="flex flex-col items-center justify-end h-16 w-52">
                        {(status === 'approved' || (status === 'pending' && disableWatermark)) ? (
                            <div className="text-center font-serif text-blue-900 leading-tight">
                                <span className="text-[10px] font-semibold block">Digitally signed by</span>
                                <strong className="text-sm block py-0.5">Dr. Rupesh Kapale</strong>
                                <span className="text-[8px] font-semibold block">(H.O.D. Department of Botany & Zoology)</span>
                                <span className="text-[8px] block mt-0.5">
                                    Date: {(approvalDate ? new Date(approvalDate) : new Date()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                            </div>
                        ) : status === 'pending' ? (
                            <div className="border-t border-gray-400 w-32 text-center text-[10px] font-semibold text-gray-500">HOD / Principal Sign</div>
                        ) : (
                            <>
                                {principalSignature && (
                                    <img src={getImageUrl(principalSignature)} crossOrigin="anonymous" alt="Principal Sig" className="h-10 object-contain mb-1" />
                                )}
                                <div className="border-t border-gray-400 w-32 text-center text-[10px] font-semibold text-gray-500">HOD / Principal Sign</div>
                            </>
                        )}
                    </div>
                </div>

                {/* Seal - Background Overlay */}
                {sealImage && (
                    <div className="absolute bottom-20 right-8 opacity-25 pointer-events-none z-0">
                        <img src={getImageUrl(sealImage)} crossOrigin="anonymous" alt="Seal" className="w-32 h-32 object-contain" />
                    </div>
                )}

                {/* Status Overlay (if not approved) */}
                {status && status !== 'approved' && !disableWatermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-white/50">
                        <div className="transform -rotate-45 border-4 border-red-500 text-red-500 text-4xl font-bold opacity-70 p-4 rounded uppercase tracking-widest">
                            {status === 'rejected' ? 'REJECTED' : 'PREVIEW'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IDCardPreview;
