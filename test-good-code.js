// Test file with proper production code
const API_KEY = process.env.API_KEY;
const password = process.env.DB_PASSWORD;

async function getUserData() {
  try {
    const response = await fetch("https://api.example.com/users", {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch user data:', error);
    throw new Error('Unable to retrieve user data');
  }
}