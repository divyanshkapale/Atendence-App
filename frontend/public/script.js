// Global variables
let currentUser = null;
let stream = null;
let currentLocation = null;
let capturedImageBlob = null;
// selectedAttendanceType is removed
let locationWatchId = null;
let currentDisplayedRecords = []; // Track currently displayed records for export

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    
    // Add event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
});

// Authentication functions
async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMainApp();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showMessage('loginMessage', 'Login successful!', 'success');
            setTimeout(() => {
                showMainApp();
            }, 1000);
        } else {
            showMessage('loginMessage', data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Login error: ' + error.message, 'error');
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        // Clear all user data
        currentUser = null;
        currentLocation = null;
        capturedImageBlob = null;
        currentDisplayedRecords = []; // Clear displayed records
        
        // Stop camera and location tracking
        stopCamera();
        stopLocationTracking();
        
        // Clear user info display
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.textContent = '';
        }
        
        // Reset all UI elements to initial state
        resetUIToInitialState();
        
        // Clear all cookies manually as fallback
        clearAllCookies();
        
        // Clear session storage and local storage
        sessionStorage.clear();
        localStorage.clear();
        
        // Show login screen
        showLogin();
        
        console.log('Logout completed successfully');
    } catch (error) {
        console.error('Logout error:', error);
        
        // Even if logout request fails, clear local data
        currentUser = null;
        document.getElementById('userInfo').textContent = '';
        clearAllCookies();
        showLogin();
    }
}

// Function to clear all cookies
function clearAllCookies() {
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Also clear with domain
    const domain = window.location.hostname;
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=" + domain); 
    });
    
    console.log('All cookies cleared');
}

// UI functions
function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    
    // Clear user info display
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        userInfoElement.textContent = '';
    }
}

function showMainApp() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Update user info
    document.getElementById('userInfo').textContent = `Welcome, ${currentUser.username} (${currentUser.role})`;
    
    // Clear all active states and hide all tabs
    document.querySelectorAll('.tab').forEach(button => button.classList.remove('active'));
    document.querySelectorAll('.card').forEach(tab => tab.classList.add('hidden'));
    
    // Show role-specific tabs and content
    const adminTabs = document.querySelectorAll('.admin-only');
    const memberTabs = document.querySelectorAll('.member-only');
    
    if (currentUser.role === 'admin') {
        // Hide member tabs, show admin tabs
        memberTabs.forEach(tab => tab.classList.add('hidden'));
        adminTabs.forEach(tab => tab.classList.remove('hidden'));
        
        // Show admin panel by default
        showTab('admin');
        loadStats();
    } else {
        // Hide admin tabs, show member tabs
        adminTabs.forEach(tab => tab.classList.add('hidden'));
        memberTabs.forEach(tab => tab.classList.remove('hidden'));
        
        // Reset attendance UI completely for new member user
        resetAttendanceUI();
        
        // Show attendance tab by default for members
        showTab('attendance');
        
        // Check upload status after a short delay to ensure UI is reset
        setTimeout(() => {
            console.log('Checking upload status for member:', currentUser.username);
        checkUploadStatus();
        }, 200);
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // highlight the clicked tab manually
    const clickedTab = document.querySelector(`[onclick*="${tabId}"]`);
    if (clickedTab) {
        clickedTab.classList.add('active');
    }

    // hide all tabs
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('hidden');
    });

    // show selected tab
    if (tabId === 'attendance') {
        document.getElementById('attendanceTab').classList.remove('hidden');
        // Ensure the upload section is visible when tab is shown for members
        if (currentUser && currentUser.role !== 'admin') {
            document.getElementById('uploadSection').classList.remove('hidden');
        }
    }
    if (tabId === 'myRecords') document.getElementById('myRecordsTab').classList.remove('hidden');
    if (tabId === 'admin') document.getElementById('adminTab').classList.remove('hidden');
    if (tabId === 'users') document.getElementById('usersTab').classList.remove('hidden');
}


// Toast notification system
function showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, duration);
}

// Override showMessage to use toast notifications for most cases
function showMessage(elementId, message, type) {
    // Show toast for all except inline info
    if (type === 'success' || type === 'error' || type === 'warning') {
        showToast(message, type);
    }
    // Also update the inline message for context
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.innerHTML = `<div class="message ${type}">${message}</div>`;
        if (type === 'success') {
            setTimeout(() => { messageEl.innerHTML = ''; }, 5000);
        }
    }
}

// Add fade-out animation for toasts
const style = document.createElement('style');
style.innerHTML = `.toast.fade-out { opacity: 0; transform: translateY(-20px); transition: opacity 0.4s, transform 0.4s; }`;
document.head.appendChild(style);

// Location functions with enhanced error handling
// Location functions with enhanced error handling
function requestLocationPermission() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        // Check if we're on HTTPS or localhost (required for location on most browsers)
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        if (!isSecure) {
            showMessage('attendanceMessage', '⚠️ Location requires HTTPS. Please access this site via HTTPS for location features.', 'warning');
        }

        // Show permission request message with detailed instructions
        showMessage('attendanceMessage', '🔒 Requesting location permission... Please check your browser for location prompt and click "Allow".', 'info');

        // Check if permission is already granted
        if (navigator.permissions) {
            navigator.permissions.query({name: 'geolocation'}).then(function(result) {
                console.log('Location permission state:', result.state);
                if (result.state === 'denied') {
                    showDetailedLocationError('Permission is blocked in browser settings');
                    reject(new Error('Location permission denied'));
                    return;
                }
            }).catch(e => console.log('Permission API not supported'));
        }

        // Try multiple approaches for better compatibility
        let attempts = 0;
        const maxAttempts = 3;

        function tryGetLocation() {
            attempts++;
            console.log(`Location attempt ${attempts}/${maxAttempts}`);

            // 🎯 CRITICAL FIX FOR ACCURACY:
            // enableHighAccuracy: MUST be true to ask for GPS.
            // maximumAge: 0 MUST be set to force a fresh calculation, preventing old, low-accuracy cached data.
            const options = {
                enableHighAccuracy: true,
                timeout: 20000,           // Increased timeout to give GPS satellites time to lock.
                maximumAge: 0             
            };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    
                    console.log('Location obtained:', currentLocation);
                    console.log('Accuracy:', position.coords.accuracy, 'meters');
                    
                    // Show location info
                    const locationInfo = document.getElementById('locationInfo');
                    const locationText = document.getElementById('locationText');
                    
                    if (locationInfo && locationText) {
                        locationInfo.classList.remove('hidden');
                        locationText.innerHTML = 
                            `📍 <strong>Location:</strong> ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}<br>
                             🎯 <strong>Accuracy:</strong> ±${Math.round(currentLocation.accuracy)}m<br>
                             🕐 <strong>Time:</strong> ${new Date().toLocaleString()}`;
                    }
                    
                    // IF ACCURACY IS STILL BAD (e.g., > 50m), you could add client-side code here
                    // to warn the user or block the upload, but that is advanced logic.
                    // For now, we trust the device provided the best result it could.
                    
                    showMessage('attendanceMessage', '✅ Location permission granted! Now starting camera...', 'success');
                resolve(currentLocation);
            },
            (error) => {
                    console.error(`Location error (attempt ${attempts}):`, error);
                    
                    if (attempts < maxAttempts) {
                        showMessage('attendanceMessage', `🔄 Location attempt ${attempts} failed, trying again with different settings...`, 'info');
                        // Keep using maximumAge: 0 on retries for the highest accuracy attempt
                        setTimeout(() => tryGetLocation(), 2000);
                        return;
                    }

                    // Final attempt failed - show detailed error
                    showDetailedLocationError(error);
                    reject(new Error(`Location failed after ${maxAttempts} attempts`));
                },
                options
            );
        }

        // Start the location request
        tryGetLocation();
    });
} 

// Function to show detailed location error with troubleshooting
function showDetailedLocationError(error) {
    let errorMessage = '❌ Location access failed. ';
    let troubleshootingSteps = '';
    
    if (typeof error === 'string') {
        errorMessage += error;
    } else {
        switch(error.code) {
            case 1: // PERMISSION_DENIED
                errorMessage += 'Permission denied.';
                troubleshootingSteps = `
                    <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: left;">
                        <strong>🔧 Troubleshooting Steps:</strong><br>
                        1. <strong>Check browser address bar</strong> - Look for location icon 📍 and click "Allow"<br>
                        2. <strong>Browser settings</strong> - Go to Settings → Privacy → Location and enable for this site<br>
                        3. <strong>Device settings</strong> - Make sure location is enabled in your device settings<br>
                        4. <strong>Refresh page</strong> - Try refreshing and clicking "Start Camera" again<br>
                        5. <strong>Different browser</strong> - Try Chrome, Firefox, or Safari
                    </div>
                `;
                break;
            case 2: // POSITION_UNAVAILABLE
                errorMessage += 'Location unavailable.';
                troubleshootingSteps = `
                    <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: left;">
                        <strong>🔧 Troubleshooting Steps:</strong><br>
                        1. <strong>Enable GPS</strong> - Check if GPS/Location is enabled on your device<br>
                        2. <strong>Move outdoors</strong> - Try moving to an open area with better GPS signal<br>
                        3. <strong>Check services</strong> - Ensure location services are enabled for your browser<br>
                        4. <strong>Wait and retry</strong> - GPS can take time to get a fix
                    </div>
                `;
                break;
            case 3: // TIMEOUT
                errorMessage += 'Location request timed out.';
                troubleshootingSteps = `
                    <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: left;">
                        <strong>🔧 Troubleshooting Steps:</strong><br>
                        1. <strong>Check connection</strong> - Ensure you have a stable internet connection<br>
                        2. <strong>Move outdoors</strong> - Go to an area with better GPS signal<br>
                        3. <strong>Wait and retry</strong> - Try again in a few moments<br>
                        4. <strong>Restart location</strong> - Turn device location off and on again
                    </div>
                `;
                break;
            default:
                errorMessage += `Unknown error (code: ${error.code}).`;
                troubleshootingSteps = `
                    <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: left;">
                        <strong>🔧 Troubleshooting Steps:</strong><br>
                        1. <strong>Refresh page</strong> - Try refreshing and starting over<br>
                        2. <strong>Check console</strong> - Open browser console (F12) for more details<br>
                        3. <strong>Different browser</strong> - Try Chrome, Firefox, or Safari<br>
                        4. <strong>Contact support</strong> - If issue persists, contact technical support
                    </div>
                `;
                break;
        }
    }
    
    // Show detailed error with troubleshooting
    const messageElement = document.getElementById('attendanceMessage');
    if (messageElement) {
        messageElement.innerHTML = `<div class="message error">${errorMessage}${troubleshootingSteps}</div>`;
    }
    
    // Show manual location option as fallback
    showManualLocationOption();
}

// Start continuous location tracking for better accuracy
function startLocationTracking() {
    if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000 // Update every second
    };

    locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            // Update location display
            if (document.getElementById('locationInfo')) {
                document.getElementById('locationText').innerHTML = 
                    `📍 <strong>Location:</strong> ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}<br>
                     🎯 <strong>Accuracy:</strong> ±${Math.round(currentLocation.accuracy)}m<br>
                     🕐 <strong>Time:</strong> ${new Date().toLocaleString()}`;
            }
        },
        (error) => {
            console.error('Location tracking error:', error);
        },
        options
    );
}

// Stop location tracking
function stopLocationTracking() {
    if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
}

// Manual location fallback function
function useManualLocation() {
    const lat = parseFloat(document.getElementById('manualLatitude').value);
    const lng = parseFloat(document.getElementById('manualLongitude').value);
    
    if (isNaN(lat) || isNaN(lng)) {
        showMessage('attendanceMessage', '❌ Please enter valid latitude and longitude values.', 'error');
        return;
    }
    
    if (lat < -90 || lat > 90) {
        showMessage('attendanceMessage', '❌ Latitude must be between -90 and 90 degrees.', 'error');
        return;
    }
    
    if (lng < -180 || lng > 180) {
        showMessage('attendanceMessage', '❌ Longitude must be between -180 and 180 degrees.', 'error');
        return;
    }
    
    currentLocation = {
        latitude: lat,
        longitude: lng,
        accuracy: 999 // Mark as manual entry
    };
    
    // Show location info
    const locationInfo = document.getElementById('locationInfo');
    const locationText = document.getElementById('locationText');
    
    if (locationInfo && locationText) {
        locationInfo.classList.remove('hidden');
        locationText.innerHTML = 
            `📍 <strong>Location (Manual):</strong> ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}<br>
             ⚠️ <strong>Source:</strong> Manual Entry<br>
             🕐 <strong>Time:</strong> ${new Date().toLocaleString()}`;
    }
    
    // Hide manual location section
    document.getElementById('manualLocationSection').classList.add('hidden');
    
    showMessage('attendanceMessage', '✅ Manual location set! Now starting camera...', 'success');
    
    // Now that location is set, start the camera automatically
    setTimeout(() => {
        startCameraAfterLocation();
    }, 1000);
}

// Function to show manual location option when automatic fails
function showManualLocationOption() {
    document.getElementById('manualLocationSection').classList.remove('hidden');
}

// Start camera after location is already obtained
async function startCameraAfterLocation() {
    try {
        // Check for camera support with mobile compatibility
        if (!navigator.mediaDevices) {
            // Fallback for older browsers
            if (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia) {
                showMessage('attendanceMessage', '📱 Using legacy camera API for your browser...', 'info');
                return startCameraLegacy();
            } else {
                showMessage('attendanceMessage', '❌ Camera not supported by this browser. Please update your browser or use Chrome/Firefox/Safari.', 'error');
            return;
            }
        }

        // Start location tracking for continuous updates
        startLocationTracking();

        // Now request camera permission with mobile-optimized constraints
        showMessage('attendanceMessage', '📷 Requesting camera permission...', 'info');
        
        // Mobile-friendly video constraints
        const constraints = {
            video: {
                width: { ideal: 640, max: 1280 },
                height: { ideal: 480, max: 720 },
                facingMode: { ideal: 'user' },
                frameRate: { ideal: 15, max: 30 }
            },
            audio: false
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        const video = document.getElementById('video');
        video.srcObject = stream;
        
        // Ensure video plays on mobile
        video.setAttribute('playsinline', true);
        video.setAttribute('muted', true);
        video.play();

        document.getElementById('cameraControls').classList.add('hidden');
        document.getElementById('videoSection').classList.remove('hidden');
        
        showMessage('attendanceMessage', '✅ Camera started! Position yourself and click "Capture Photo".', 'success');
    } catch (error) {
        console.error('Camera start error:', error);
        
        // Provide specific error messages for common issues
        let errorMessage = 'Camera error: ';
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Camera permission denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found. Please ensure your device has a camera.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage += 'Camera not supported in this browser. Please use Chrome, Firefox, or Safari.';
        } else if (error.name === 'NotReadableError') {
            errorMessage += 'Camera is being used by another application. Please close other apps and try again.';
        } else {
            errorMessage += error.message || 'Unknown error occurred. Please try again.';
        }
        
        showMessage('attendanceMessage', errorMessage, 'error');
    }
}

// Legacy camera support for older mobile browsers
async function startCameraLegacy() {
    return new Promise((resolve, reject) => {
        const getUserMedia = navigator.getUserMedia || 
                           navigator.webkitGetUserMedia || 
                           navigator.mozGetUserMedia || 
                           navigator.msGetUserMedia;
        
        if (!getUserMedia) {
            reject(new Error('Camera not supported'));
            return;
        }
        
        const constraints = {
            video: {
                width: 640,
                height: 480,
                facingMode: 'user'
            }
        };
        
        getUserMedia.call(navigator, constraints,
            (mediaStream) => {
                stream = mediaStream;
                const video = document.getElementById('video');
                
                // Handle different browser prefixes
                if (video.mozSrcObject !== undefined) {
                    video.mozSrcObject = stream;
                } else if (video.srcObject !== undefined) {
                    video.srcObject = stream;
                } else {
                    video.src = window.URL.createObjectURL(stream);
                }
                
                video.setAttribute('playsinline', true);
                video.setAttribute('muted', true);
                video.play();
                
                document.getElementById('cameraControls').classList.add('hidden');
                document.getElementById('videoSection').classList.remove('hidden');
                
                showMessage('attendanceMessage', '✅ Camera started! Position yourself and click "Capture Photo".', 'success');
                resolve();
            },
            (error) => {
                showMessage('attendanceMessage', 'Camera permission denied or not available: ' + error.message, 'error');
                reject(error);
            }
        );
    });
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    document.getElementById('cameraControls').classList.remove('hidden');
    document.getElementById('videoSection').classList.add('hidden');
    document.getElementById('photoPreview').classList.add('hidden');
}

function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        showMessage('attendanceMessage', 'Video not loaded. Please wait a moment and try again.', 'error');
        return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
        capturedImageBlob = blob;
        
        // Show preview
        const capturedImage = document.getElementById('capturedImage');
        capturedImage.src = URL.createObjectURL(blob);
        
        document.getElementById('videoSection').classList.add('hidden');
        document.getElementById('photoPreview').classList.remove('hidden');
        
        showMessage('attendanceMessage', 'Photo captured! Review and click "Upload Attendance" to submit.', 'success');
    }, 'image/jpeg', 0.8);
}

// MODIFIED: Simplified uploadPhoto to remove the 'type' field
async function uploadPhoto() {
    if (!capturedImageBlob) {
        showMessage('attendanceMessage', 'Please capture a photo first.', 'error');
        return;
    }
    
    if (!currentLocation) {
        showMessage('attendanceMessage', '❌ Location not available. Please restart the camera to get location first.', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('photo', capturedImageBlob, 'attendance.jpg');
    formData.append('latitude', currentLocation.latitude);
    formData.append('longitude', currentLocation.longitude);
    // Removed: formData.append('type', selectedAttendanceType); 
    
    try {
        const response = await fetch('/api/attendance/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('attendanceMessage', 'Attendance uploaded successfully!', 'success');
            stopCamera();
            checkUploadStatus(); // Refresh upload status
        } else {
            // Check for explicit server error message (e.g., from updated backend)
            const errorMessage = data.error || 'Upload failed: Server Bad Request (400)'; 
            showMessage('attendanceMessage', errorMessage, 'error');
        }
    } catch (error) {
        showMessage('attendanceMessage', 'Upload error: ' + error.message, 'error');
    }
}

// MODIFIED: Simplified Upload status check - now checking for ANY upload today
async function checkUploadStatus() {
    try {
        // NOTE: The backend API /api/attendance/upload-status MUST be updated 
        // to return the new 'hasUploadedToday' status instead of check-in/out flags.
        const response = await fetch('/api/attendance/upload-status', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Upload status for current user:', data);
            
            resetAttendanceUI(); // Reset UI first
            
            updateAttendanceUI(data);
        } else {
            console.error('Failed to check upload status');
            // Default to allowing upload if status check fails
            document.getElementById('uploadSection').classList.remove('hidden');
            document.getElementById('uploadDisabled').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error checking upload status:', error);
        // Default to allowing upload if status check fails
        document.getElementById('uploadSection').classList.remove('hidden');
        document.getElementById('uploadDisabled').classList.add('hidden');
    }
}

// MODIFIED: Update attendance UI based on simplified upload status
function updateAttendanceUI(statusData) {
    // Assuming the backend now returns { hasUploadedToday: true/false, todayUploads: [...] }
    const hasUploadedToday = statusData.hasUploadedToday || (statusData.todayUploads && statusData.todayUploads.length > 0);
    
    console.log('Updating attendance UI with status:', statusData);
    
    // Hide the old attendance type selection completely
    const attendanceTypeSelection = document.getElementById('attendanceTypeSelection');
    if (attendanceTypeSelection) attendanceTypeSelection.classList.add('hidden');
    
    const statusDiv = document.getElementById('attendanceStatus');
    const uploadSection = document.getElementById('uploadSection');
    const uploadDisabled = document.getElementById('uploadDisabled');
    
    // Update button states
    const startCamBtn = document.getElementById('startCameraBtn');
    if (startCamBtn) {
        startCamBtn.disabled = hasUploadedToday;
    }
    
    // Show status information
    if (statusDiv) {
        let statusHTML = '<div class="today-status">';
        if (hasUploadedToday) {
            const lastRecord = statusData.todayUploads && statusData.todayUploads.length > 0 ? 
                                statusData.todayUploads[statusData.todayUploads.length - 1] : 
                                null;
            const uploadTime = lastRecord ? new Date(lastRecord.createdAt).toLocaleTimeString() : 'N/A';
            statusHTML += `<p>✅ <strong>Attendance Submitted for Today!</strong> (Last upload at ${uploadTime})</p>`;
        } else {
            statusHTML += `<p>⚠️ <strong>No Attendance Submitted Today.</strong> Please upload your record.</p>`;
        }
        statusHTML += '</div>';
        statusDiv.innerHTML = statusHTML;
    }
    
    // Show/hide sections based on status
    if (hasUploadedToday) {
        if (uploadSection) uploadSection.classList.add('hidden');
        if (uploadDisabled) uploadDisabled.classList.remove('hidden');
        document.getElementById('uploadDisabled').innerHTML = `
            <div class="message info">
                <p>✅ You have already uploaded your attendance photo for today!</p>
                <p>You can upload again tomorrow.</p>
            </div>
        `;
    } else {
        if (uploadSection) uploadSection.classList.remove('hidden');
        if (uploadDisabled) uploadDisabled.classList.add('hidden');
    }
}

// Reset attendance UI to clean state
function resetAttendanceUI() {
    // Reset all attendance-related UI elements
    const elements = {
        'uploadSection': 'hidden',
        'uploadDisabled': 'hidden', 
        'attendanceTypeSelection': 'hidden', // Keep hidden
        'manualLocationSection': 'hidden',
        'locationInfo': 'hidden',
        'cameraControls': '',
        'videoSection': 'hidden',
        'photoPreview': 'hidden'
    };
    
    Object.entries(elements).forEach(([id, className]) => {
        const element = document.getElementById(id);
        if (element) {
            if (className === 'hidden') {
                element.classList.add('hidden');
            } else if (className === '') {
                element.classList.remove('hidden');
            }
        }
    });
    
    // Reset button states (Now only one button 'Start Camera')
    const startCamBtn = document.getElementById('startCameraBtn');
    if (startCamBtn) {
        startCamBtn.disabled = false;
        startCamBtn.innerHTML = '📷 Start Camera';
    }
    
    // Clear status displays
    const statusElements = ['attendanceStatus', 'selectedType']; 
    statusElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
        }
    });
    
    // Clear any messages
    const attendanceMessage = document.getElementById('attendanceMessage');
    if (attendanceMessage) {
        attendanceMessage.innerHTML = '';
    }
}

// Records functions
async function loadMyRecords() {
    try {
        const response = await fetch('/api/attendance/my-records', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const records = await response.json();
            displayRecords(records, 'myRecordsGrid', false);
        } else {
            showMessage('myRecordsMessage', 'Failed to load records', 'error');
        }
    } catch (error) {
        console.error('Error loading records:', error);
    }
}

async function loadAllRecords() {
    try {
        const response = await fetch('/api/attendance/all', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const records = await response.json();
            displayRecords(records, 'allRecordsGrid', true);
        } else {
            console.error('Failed to load all records');
        }
    } catch (error) {
        console.error('Error loading all records:', error);
    }
}

async function filterRecordsByDate() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate && !endDate) {
        alert('Please select at least one date to filter.');
        return;
    }
    
    try {
        let url = '/api/attendance/all';
        const params = new URLSearchParams();
        
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const records = await response.json();
            displayRecords(records, 'allRecordsGrid', true);
            
            const dateRange = startDate && endDate ? 
                `${startDate} to ${endDate}` : 
                startDate ? `from ${startDate}` : `until ${endDate}`;
            alert(`Showing ${records.length} records ${dateRange}`);
        } else {
            alert('Failed to filter records');
        }
    } catch (error) {
        console.error('Error filtering records:', error);
        alert('Error filtering records');
    }
}

function clearDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    loadAllRecords();
}

function displayRecords(records, containerId, showDeleteButton) {
    const container = document.getElementById(containerId);
    
    // Store current records for export (only for admin panel)
    if (containerId === 'allRecordsGrid') {
        currentDisplayedRecords = records;
        updateExportStatus(records.length);
    }
    
    if (records.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><h3>No records found</h3><p>Records will appear here once attendance is taken.</p></div>';
        if (containerId === 'allRecordsGrid') {
            updateExportStatus(0);
        }
        return;
    }
    
    container.innerHTML = records.map(record => {
        // MODIFIED: Simplified type logic
        const typeIcon = '📸';
        // Use the 'type' field if present, otherwise default to 'Attendance Record'
        const typeLabel = record.type ? record.type.charAt(0).toUpperCase() + record.type.slice(1).replace('-', ' ') : 'Attendance Record';
        
        // Format date and time separately for better readability
        const uploadDate = new Date(record.createdAt);
        const dateStr = uploadDate.toLocaleDateString();
        const timeStr = uploadDate.toLocaleTimeString();
        
        // ** 🎯 CORRECTED Google Maps URL 🎯 **
        // Uses the universally recognized 'place' query format for coordinates
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${parseFloat(record.latitude).toFixed(6)},${parseFloat(record.longitude).toFixed(6)}`;
        
        return `
         <div class="attendance-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #333; margin: 0;">👤 ${record.username}</h3>
                <div class="attendance-type-badge" style="background: #e2e3e5; color: #383d41; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                    ${typeIcon} ${typeLabel}
                </div>
            </div>
             <img src="/${record.photo}" alt="Attendance photo" class="attendance-image" style="max-width: 200px; border-radius: 8px;">
             <div style="font-size: 14px; color: #666; margin-top: 15px;">
                <p style="margin-bottom: 8px;">📅 <strong>Upload Date:</strong> ${dateStr}</p>
                <p style="margin-bottom: 8px;">🕐 <strong>Upload Time:</strong> ${timeStr}</p>
                <p style="margin-bottom: 8px;">📍 <strong>Location:</strong> 
                    <a href="${mapsUrl}" target="_blank" style="color: #667eea; text-decoration: none;">
                        ${parseFloat(record.latitude).toFixed(6)}, ${parseFloat(record.longitude).toFixed(6)}
                    </a>
                </p>
                                 <p style="margin-bottom: 8px;">🆔 <strong>ID:</strong> ${record._id}</p>
            </div>
                         ${showDeleteButton ? `<button class="btn btn-danger" onclick="deleteRecord('${record._id}')" style="margin-top: 15px;">🗑️ Delete</button>` : ''}
        </div>
        `;
    }).join('');
}

// Admin functions
async function loadStats() {
    try {
        // NOTE: Backend /api/attendance/stats should be updated to remove check-in/out counts
        const response = await fetch('/api/attendance/stats', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalRecords').textContent = stats.totalRecords;
            document.getElementById('todayRecords').textContent = stats.todayRecords;
            
            document.getElementById('uniqueUsers').textContent = stats.uniqueUsers;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function deleteRecord(recordId) {
    if (!confirm('⚠️ Are you sure you want to delete this attendance record?\n\nThis will permanently delete:\n• The database record\n• The uploaded photo file\n\nThis action cannot be undone.')) {
        return;
    }
    
    try {
        // Show deleting message
        showMessage('adminMessage', '🗑️ Deleting record and photo...', 'info');
        
        const response = await fetch(`/api/attendance/${recordId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Reload data
            loadAllRecords();
            loadStats();
            
            // Show success message with details
            showMessage('adminMessage', `✅ ${data.message}`, 'success');
            
            console.log(`Record ${recordId} deleted successfully`);
        } else {
            const data = await response.json();
            showMessage('adminMessage', `❌ ${data.error || 'Failed to delete record'}`, 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showMessage('adminMessage', `❌ Error deleting record: ${error.message}`, 'error');
    }
}

// Admin function to cleanup orphaned photos
async function cleanupPhotos() {
    if (!confirm('🧹 This will delete all orphaned photos (photos not linked to any attendance record).\n\nAre you sure you want to continue?')) {
        return;
    }
    
    try {
        showMessage('adminMessage', '🧹 Cleaning up orphaned photos...', 'info');
        
        const response = await fetch('/api/attendance/cleanup-photos', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            showMessage('adminMessage', 
                `✅ ${data.message}\n📊 Deleted: ${data.deleted} orphaned photos\n📁 Kept: ${data.kept} referenced photos`, 
                'success'
            );
            console.log('Photo cleanup result:', data);
        } else {
            const errorData = await response.json();
            showMessage('adminMessage', `❌ ${errorData.error || 'Failed to cleanup photos'}`, 'error');
        }
    } catch (error) {
        console.error('Photo cleanup error:', error);
        showMessage('adminMessage', `❌ Error during photo cleanup: ${error.message}`, 'error');
    }
}

// User management functions
async function handleAddUser(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('userMessage', 'User created successfully!', 'success');
            document.getElementById('addUserForm').reset();
            loadUsers();
        } else {
            showMessage('userMessage', data.error || 'Failed to create user', 'error');
        }
    } catch (error) {
        showMessage('userMessage', 'Error creating user: ' + error.message, 'error');
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/api/auth/users', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else {
            console.error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const container = document.getElementById('usersGrid');
    
    if (users.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><h3>No users found</h3></div>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="attendance-card">
            <h3 style="color: #333; margin-bottom: 15px;">👤 ${user.username}</h3>
            <div style="font-size: 14px; color: #666;">
                <p style="margin-bottom: 8px;"><strong>Role:</strong> ${user.role}</p>
                <p style="margin-bottom: 8px;"><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                                 <p style="margin-bottom: 8px;"><strong>ID:</strong> ${user._id}</p>
            </div>
                         ${user._id !== currentUser._id ? `<button class="btn btn-danger" onclick="deleteUser('${user._id}')" style="margin-top: 15px;">🗑️ Delete User</button>` : '<p style="margin-top: 15px; color: #666; font-style: italic;">Current User</p>'}
        </div>
    `).join('');
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This will also delete all their attendance records.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/auth/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            loadUsers();
            showMessage('userMessage', 'User deleted successfully', 'success');
        } else {
            const data = await response.json();
            showMessage('userMessage', data.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        showMessage('userMessage', 'Error deleting user: ' + error.message, 'error');
    }
} 

// Main camera start function - location first, then camera
async function startCamera() {
    try {
        // First request location permission explicitly - REQUIRED before camera
        showMessage('attendanceMessage', '🔒 Please allow location access when prompted by your browser...', 'info');
        
        await requestLocationPermission();
        
        // Location is now successfully obtained, proceed with camera
        console.log('Location obtained successfully, proceeding with camera setup');
        
        // Start camera after location is confirmed
        await startCameraAfterLocation();
        
    } catch (error) {
        console.error('Location or camera error:', error);
        // Error handling is already done in requestLocationPermission
        // Manual location option will be shown automatically
    }
} 

// CSV Export Functions

// Update export status display
function updateExportStatus(recordCount) {
    const statusElement = document.getElementById('exportStatus');
    if (statusElement) {
        if (recordCount === 0) {
            statusElement.textContent = 'No records to export';
            statusElement.style.color = '#999';
        } else {
            statusElement.textContent = `${recordCount} record${recordCount !== 1 ? 's' : ''} ready for export`;
            statusElement.style.color = '#28a745';
        }
    }
}

// MODIFIED: Format data for CSV export to remove type column (or set to generic)
function formatRecordsForCSV(records) {
    const headers = [
        'Username',
        'Upload Date',
        'Upload Time',
        'Latitude',
        'Longitude',
        'Google Maps Link',
        'Location Accuracy',
        'Photo Filename',
        'Record ID'
    ];
    
    const csvData = [headers];
    
    records.forEach(record => {
        const uploadDate = new Date(record.createdAt);
        const dateStr = uploadDate.toLocaleDateString();
        const timeStr = uploadDate.toLocaleTimeString();
        
        // Create Google Maps link - Must match the format in displayRecords
        const mapsLink = (record.latitude && record.longitude) 
             ? `https://www.google.com/maps/search/?api=1&query=${record.latitude.toFixed(6)},${record.longitude.toFixed(6)}`
            : 'N/A';
        
        const row = [
            record.username || 'N/A',
            dateStr,
            timeStr,
            record.latitude ? record.latitude.toFixed(6) : 'N/A',
            record.longitude ? record.longitude.toFixed(6) : 'N/A',
            mapsLink,
            record.accuracy ? `±${Math.round(record.accuracy)}m` : 'N/A',
            record.photo ? record.photo.split('/').pop() : 'N/A',
            record._id || 'N/A'
        ];
        
        csvData.push(row);
    });
    
    return csvData;
}

// Convert array data to CSV string
function arrayToCSV(data) {
    return data.map(row => {
        return row.map(field => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return '"' + stringField.replace(/"/g, '""') + '"';
            }
            return stringField;
        }).join(',');
    }).join('\n');
}

// Generate filename for CSV export
function generateCSVFilename() {
    const now = new Date();
    const dateStr = now.getFullYear() + 
                   String(now.getMonth() + 1).padStart(2, '0') + 
                   String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') + 
                   String(now.getMinutes()).padStart(2, '0');
    
    return `attendance_records_${dateStr}_${timeStr}.csv`;
}

// Main export function
function exportRecordsToCSV() {
    try {
        if (!currentDisplayedRecords || currentDisplayedRecords.length === 0) {
            showMessage('adminMessage', '❌ No records to export. Please load some records first.', 'error');
            return;
        }
        
        // Show exporting status
        const statusElement = document.getElementById('exportStatus');
        if (statusElement) {
            statusElement.textContent = 'Exporting...';
            statusElement.style.color = '#007bff';
        }
        
        // Format data for CSV
        const csvData = formatRecordsForCSV(currentDisplayedRecords);
        const csvString = arrayToCSV(csvData);
        
        // Create and download file
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            // Modern browsers
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', generateCSVFilename());
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showMessage('adminMessage', `✅ Successfully exported ${currentDisplayedRecords.length} records to CSV!`, 'success');
            
            // Reset status
            setTimeout(() => {
                updateExportStatus(currentDisplayedRecords.length);
            }, 2000);
            
        } else {
            // Fallback for older browsers
            const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString);
            window.open(csvContent, '_blank');
            
            showMessage('adminMessage', `✅ CSV data opened in new window. Save the file manually.`, 'success');
        }
        
        console.log(`Exported ${currentDisplayedRecords.length} records to CSV`);
        
    } catch (error) {
        console.error('CSV export error:', error);
        showMessage('adminMessage', `❌ Error exporting CSV: ${error.message}`, 'error');
        
        // Reset status
        const statusElement = document.getElementById('exportStatus');
        if (statusElement) {
            updateExportStatus(currentDisplayedRecords ? currentDisplayedRecords.length : 0);
        }
    }
} 

// Reset all UI elements to initial state
function resetUIToInitialState() {
    // Clear all message displays
    const messageElements = ['attendanceMessage', 'adminMessage', 'userMessage', 'myRecordsMessage'];
    messageElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
        }
    });
    
    // Reset attendance UI
    const attendanceElements = {
        'uploadSection': 'hidden',
        'uploadDisabled': 'hidden',
        'attendanceTypeSelection': 'hidden',
        'manualLocationSection': 'hidden',
        'locationInfo': 'hidden',
        'cameraControls': '',
        'videoSection': 'hidden',
        'photoPreview': 'hidden'
    };
    
    Object.entries(attendanceElements).forEach(([id, className]) => {
        const element = document.getElementById(id);
        if (element) {
            if (className === 'hidden') {
                element.classList.add('hidden');
            } else if (className === '') {
                element.classList.remove('hidden');
            }
        }
    });
    
    // Reset form inputs
    const inputs = ['manualLatitude', 'manualLongitude', 'startDate', 'endDate'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    // Clear grids and containers
    const grids = ['allRecordsGrid', 'myRecordsGrid', 'usersGrid'];
    grids.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
        }
    });
    
    // Reset stats display (assuming you keep todayRecords)
    const stats = ['totalRecords', 'todayRecords', 'uniqueUsers'];
    stats.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '0';
        }
    });
    
    // Reset export status
    const exportStatus = document.getElementById('exportStatus');
    if (exportStatus) {
        exportStatus.textContent = '';
    }
    
    // Reset button states (only Start Camera button is relevant now)
    const startCamBtn = document.getElementById('startCameraBtn');
    if (startCamBtn) {
        startCamBtn.disabled = false;
        startCamBtn.innerHTML = '📷 Start Camera';
    }
    
    // Clear attendance status
    const attendanceStatus = document.getElementById('attendanceStatus');
    if (attendanceStatus) {
        attendanceStatus.innerHTML = '';
    }
    
    console.log('UI reset to initial state');
}