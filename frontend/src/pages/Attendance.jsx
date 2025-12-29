import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Attendance = () => {
    const [stream, setStream] = useState(null);
    const [image, setImage] = useState(null);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasUploadedToday, setHasUploadedToday] = useState(false);
    const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });
    const [showManualLocation, setShowManualLocation] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        checkUploadStatus();
        return () => stopCamera();
    }, []);

    const checkUploadStatus = async () => {
        try {
            const response = await axios.get('/api/attendance/upload-status');
            const { hasUploadedToday, todayUploads } = response.data;
            if (hasUploadedToday || (todayUploads && todayUploads.length > 0)) {
                setHasUploadedToday(true);
            }
        } catch (err) {
            console.error('Error checking status:', err);
        }
    };

    const startCamera = async () => {
        setError('');
        try {
            // Get location first
            const loc = await getLocation();
            setLocation(loc);

            // Start camera
            const constraints = {
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    facingMode: 'user'
                }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError(err.message);
            if (err.message.includes('Location')) {
                setShowManualLocation(true);
            }
        }
    };

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (err) => {
                    reject(new Error('Location access failed: ' + err.message));
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        });
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            setImage(blob);
            stopCamera();
        }, 'image/jpeg', 0.8);
    };

    const retakePhoto = () => {
        setImage(null);
        startCamera();
    };

    const handleManualLocation = () => {
        const lat = parseFloat(manualLocation.lat);
        const lng = parseFloat(manualLocation.lng);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            setError('Invalid coordinates');
            return;
        }

        setLocation({
            latitude: lat,
            longitude: lng,
            accuracy: 999 // Manual
        });
        setShowManualLocation(false);
        setError('');

        // Start camera after manual location
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            .then(mediaStream => {
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            })
            .catch(err => setError('Camera error: ' + err.message));
    };

    const uploadAttendance = async () => {
        if (!image || !location) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('photo', image, 'attendance.jpg');
        formData.append('latitude', location.latitude);
        formData.append('longitude', location.longitude);

        try {
            await axios.post('/api/attendance/upload', formData);
            setSuccess('Attendance uploaded successfully!');
            setHasUploadedToday(true);
            setImage(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    if (hasUploadedToday) {
        return (
            <div className="flex justify-center items-center min-h-[50vh] p-4">
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body text-center">
                        <h2 className="card-title justify-center text-2xl mb-4">📸 Take Attendance</h2>
                        <div className="alert alert-success">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <h3 className="font-bold">Attendance Recorded!</h3>
                                <div className="text-xs">You have already uploaded your attendance photo for today. You can upload again tomorrow.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 md:p-4 max-w-2xl mx-auto">
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-4 md:p-8">
                    <h2 className="card-title justify-center text-2xl md:text-3xl mb-4 md:mb-6 text-primary">📸 Take Attendance</h2>

                    {error && (
                        <div className="alert alert-error mb-4 text-sm md:text-base">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success mb-4 text-sm md:text-base">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{success}</span>
                        </div>
                    )}

                    {!stream && !image && (
                        <div className="text-center space-y-4 md:space-y-6">
                            <button className="btn btn-primary btn-md md:btn-lg gap-2 w-full md:w-auto" onClick={startCamera}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                </svg>
                                Start Camera
                            </button>
                            <div className="alert alert-info shadow-lg text-sm md:text-base">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span><strong>Permissions Required:</strong> Location and Camera access.</span>
                            </div>
                        </div>
                    )}

                    {showManualLocation && (
                        <div className="alert alert-warning shadow-lg mt-4 text-sm md:text-base">
                            <div className="w-full">
                                <h3 className="font-bold">📍 Manual Location Entry</h3>
                                <div className="flex flex-col md:flex-row gap-2 mt-2">
                                    <input
                                        type="number"
                                        placeholder="Latitude"
                                        className="input input-bordered input-sm w-full"
                                        value={manualLocation.lat}
                                        onChange={e => setManualLocation({ ...manualLocation, lat: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Longitude"
                                        className="input input-bordered input-sm w-full"
                                        value={manualLocation.lng}
                                        onChange={e => setManualLocation({ ...manualLocation, lng: e.target.value })}
                                    />
                                    <button className="btn btn-sm w-full md:w-auto" onClick={handleManualLocation}>Use Location</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="relative w-full max-w-lg mx-auto mt-4">
                        <video
                            ref={videoRef}
                            className={`w-full rounded-xl shadow-lg ${!stream ? 'hidden' : ''}`}
                            autoPlay
                            playsInline
                            muted
                        />

                        {image && (
                            <div id="photoPreview" className="space-y-4">
                                <img src={URL.createObjectURL(image)} className="w-full rounded-xl shadow-lg" alt="Captured" />
                                <div className="flex flex-col md:flex-row gap-2 justify-center">
                                    <button className="btn btn-success gap-2 text-white w-full md:w-auto" onClick={uploadAttendance} disabled={loading}>
                                        {loading ? <span className="loading loading-spinner"></span> : '✅ Upload Attendance'}
                                    </button>
                                    <button className="btn btn-outline btn-error gap-2 w-full md:w-auto" onClick={retakePhoto} disabled={loading}>
                                        🔄 Retake Photo
                                    </button>
                                </div>
                            </div>
                        )}

                        {stream && !image && (
                            <div className="flex justify-center gap-4 mt-4">
                                <button className="btn btn-primary btn-circle btn-lg" onClick={capturePhoto}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                    </svg>
                                </button>
                                <button className="btn btn-circle btn-ghost btn-lg text-error" onClick={stopCamera}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <canvas ref={canvasRef} className="hidden"></canvas>

                    {location && (
                        <div className="alert alert-ghost mt-4 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <div>
                                <div className="font-bold">Location Acquired</div>
                                <div className="text-xs">Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)} (±{Math.round(location.accuracy)}m)</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
