const API_URL = 'http://localhost:7000/api/search';

export const saveSearch = async (text) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to save search');
        }
        return data;
    } catch (error) {
        throw error;
    }
};

export const getSearchHistory = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get search history');
        }
        return data;
    } catch (error) {
        throw error;
    }
};

export const deleteSearch = async (searchId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_URL}/${searchId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete search');
        }
        return data;
    } catch (error) {
        throw error;
    }
};
