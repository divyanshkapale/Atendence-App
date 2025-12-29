const API_URL = '/api/attendance';

export const getMyAttendance = async () => {
    const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
    const response = await fetch(`${API_URL}/my-records`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
    }
    return response.json();
};
