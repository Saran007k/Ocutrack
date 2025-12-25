
// Shared constants for the application

// Generate today's date dynamically in YYYY-MM-DD format
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');

export const TODAY = `${year}-${month}-${day}`;
