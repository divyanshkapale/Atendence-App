const API_URL = '/api/holidays';

export const getHolidays = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch holidays');
    }
    return response.json();
};

export const saveHoliday = async (holiday) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(holiday),
    });
    if (!response.ok) {
        throw new Error('Failed to save holiday');
    }
    return response.json();
};

export const deleteHoliday = async (date) => {
    const response = await fetch(`${API_URL}/${date}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete holiday');
    }
    return response.json();
};
