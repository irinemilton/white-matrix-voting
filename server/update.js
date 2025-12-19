const db = require('./config/db');

async function updateUser() {
  try {
    await db.query("UPDATE users SET linkedin_profile_url = 'https://www.linkedin.com/in/irine-milton' WHERE linkedin_id = '8a_n-E2YiL'");
    console.log('User updated successfully');
  } catch (err) {
    console.error('Error:', err);
  }
}

updateUser();