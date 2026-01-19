const API_URL = 'http://localhost:5000/api';

// Initialize empty DB structure to prevent runtime errors before load
let db = {
    regulations: [],
    programs: [],
    branches: [],
    pb_mappings: [],
    courses: [],
    faculty: [],
    fc_mappings: [],
    blooms: [],
    difficulties: [],
    units: [],
    course_outcomes: [],
    questions: []
};

async function loadAllData() {
    try {
        const tables = [
            'regulations', 'programs', 'branches', 'pb_mappings',
            'courses', 'faculty', 'fc_mappings', 'blooms',
            'difficulties', 'units', 'course_outcomes', 'questions'
        ];

        const promises = tables.map(table =>
            fetch(`${API_URL}/${table}`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${table}`);
                    return res.json();
                })
                .then(data => ({ [table]: data }))
        );

        const results = await Promise.all(promises);

        // Merge all results into db
        results.forEach(result => {
            Object.assign(db, result);
        });

        console.log('Data loaded:', db);
        return true;
    } catch (error) {
        console.error('Failed to load data:', error);
        alert('Failed to load data from server. Please ensure the backend is running.');
        return false;
    }
}

async function apiSave(table, item) {
    try {
        const response = await fetch(`${API_URL}/${table}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        return await response.json();
    } catch (error) {
        console.error(`Failed to save to ${table}:`, error);
        throw error;
    }
}

async function apiDelete(table, id) {
    try {
        await fetch(`${API_URL}/${table}/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Failed to delete from ${table}:`, error);
        throw error;
    }
}

// Authentication
async function apiLogin(role, username, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, username, password })
        });
        return await response.json();
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network Error' };
    }
}
