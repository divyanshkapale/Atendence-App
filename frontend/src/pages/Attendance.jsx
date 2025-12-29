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

        <div className="hero min-h-screen bg-base-200 lg:items-start lg:pt-8">
            <div className="hero-content flex-col w-full max-w-2xl">

                <div className="text-center pb-4">
                    <h1 className="text-3xl font-bold text-base-content">Daily Attendance</h1>
                    <p className="py-2 text-base-content/70">Verify your location and capture a clear photo.</p>
                </div>

                <div className="card w-full bg-base-100 shadow-xl">
                    <div className="card-body">
                        {/* Status Messages */}
                        {error && (
                            <div className="alert alert-error shadow-sm mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success shadow-sm mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Initial State / Start Camera */}
                        {!stream && !image && (
                            <div className="flex flex-col items-center gap-6 py-8">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-primary">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                    </svg>
                                </div>
                                <button className="btn btn-primary btn-lg gap-3 shadow-lg" onClick={startCamera}>
                                    Start Camera & GPS
                                </button>
                                <p className="text-sm text-base-content/60 max-w-xs text-center">
                                    We need access to your camera and location to mark your attendance accurately.
                                </p>
                            </div>
                        )}

                        {/* Manual Location Fallback */}
                        {showManualLocation && (
                            <div className="collapse collapse-arrow bg-base-200 mb-4">
                                <input type="checkbox" className="peer" defaultChecked />
                                <div className="collapse-title font-medium">
                                    📍 Manual Location Entry (GPS Failed)
                                </div>
                                <div className="collapse-content">
                                    <div className="form-control gap-2">
                                        <div className="flex gap-2">
                                            <input type="number" placeholder="Latitude" className="input input-bordered w-full" value={manualLocation.lat} onChange={e => setManualLocation({ ...manualLocation, lat: e.target.value })} />
                                            <input type="number" placeholder="Longitude" className="input input-bordered w-full" value={manualLocation.lng} onChange={e => setManualLocation({ ...manualLocation, lng: e.target.value })} />
                                        </div>
                                        <button className="btn btn-warning btn-sm w-full" onClick={handleManualLocation}>Set Custom Location</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Camera View */}
                        <div className="relative w-full rounded-2xl overflow-hidden bg-black/5 min-h-[200px] flex items-center justify-center">
                            {/* Video  */}
                            <video
                                ref={videoRef}
                                className={`w-full h-auto object-cover ${!stream ? 'hidden' : ''}`}
                                autoPlay
                                playsInline
                                muted
                            />

                            {/* Captured Image Preview */}
                            {image && (
                                <div className="w-full relative">
                                    <img src={URL.createObjectURL(image)} className="w-full" alt="Captured" />
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
                                        <div className="flex gap-4">
                                            <button className="btn btn-success gap-2 text-white shadow-lg" onClick={uploadAttendance} disabled={loading}>
                                                {loading ? <span className="loading loading-spinner"></span> : '✅ Confirm Upload'}
                                            </button>
                                            <button className="btn btn-circle btn-error text-white shadow-lg" onClick={retakePhoto} disabled={loading} title="Retake">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Capture Button Overlay */}
                            {stream && !image && (
                                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
                                    <button className="btn btn-error btn-circle shadow-lg" onClick={stopCamera}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <button className="btn btn-white text-primary btn-circle btn-lg border-4 border-primary/50 shadow-xl scale-125 hover:scale-110 transition-transform" onClick={capturePhoto}>
                                        <div className="w-16 h-16 rounded-full border-2 border-primary"></div>
                                    </button>
                                </div>
                            )}
                        </div>

                        <canvas ref={canvasRef} className="hidden"></canvas>

                        {/* Location Stats */}
                        {location && (
                            <div className="stats shadow mt-4 w-full">
                                <div className="stat py-2">
                                    <div className="stat-figure text-secondary">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    </div>
                                    <div className="stat-title">Current Location</div>
                                    <div className="stat-value text-lg text-primary">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</div>
                                    <div className="stat-desc">Accuracy: ±{Math.round(location.accuracy)}m</div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
