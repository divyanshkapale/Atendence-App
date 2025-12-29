import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';

const IDCard = ({ user }) => {
    const defaultPhoto = '/assets/default-profile.png';
    const cardRef = useRef(null);

    const handleDownload = async () => {
        if (cardRef.current) {
            try {
                const dataUrl = await toPng(cardRef.current, { cacheBust: true, backgroundColor: 'white' });
                const link = document.createElement('a');
                link.download = `${user.username}_ID_Card.png`;
                link.href = dataUrl;
                link.click();
            } catch (error) {
                console.error('Error generating ID card image:', error);
            }
        }
    };

    return (
        <div className="flex flex-col items-center p-4 gap-4">
            <div ref={cardRef} className="bg-white rounded-2xl shadow-xl border-2 border-blue-600 w-full max-w-sm overflow-hidden">
                <div className="p-6 flex flex-col items-center text-center">

                    <h2 className="text-2xl font-bold text-blue-600 mb-4">STUDENT ID CARD</h2>

                    <div className="mb-4 flex justify-center">
                        <div className="w-32 h-32 rounded-full ring-4 ring-blue-600 ring-offset-2 ring-offset-white overflow-hidden">
                            <img
                                src={user.profilePhoto || defaultPhoto}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = defaultPhoto; }}
                            />
                        </div>
                    </div>

                    <div className="w-full text-left space-y-2">
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-bold">Name:</span>
                            <span>{user.username}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-bold">Enrollment No:</span>
                            <span>{user.enrollmentNumber || ''}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-bold">Email:</span>
                            <span>{user.email || ''}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-bold">Contact:</span>
                            <span>{user.contactNumber || ''}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-bold">Role:</span>
                            <span className="uppercase">{user.role}</span>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center">
                        <div className="bg-white p-2 rounded-lg">
                            <QRCode
                                value={`Name: ${user.username}\nEnrollment No: ${user.enrollmentNumber || ''}\nEmail: ${user.email || ''}\nContact: ${user.contactNumber || ''}\nRole: ${user.role}`}
                                size={100}
                                level="M"
                            />
                        </div>
                        <p className="text-[10px] mt-1 text-gray-400">Scan for details</p>
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                        <p>Govt Pench Valley PG College</p>
                        <p>Dept of Botany • E-Attendance System</p>
                    </div>
                </div>
            </div>

            <button onClick={handleDownload} className="btn btn-primary gap-2">
                <Download size={20} />
                Download ID Card
            </button>
        </div>
    );
};

export default IDCard;
