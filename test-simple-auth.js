const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function test() {
  // Register
  const email = `test-${Date.now()}@example.com`;
  const regResp = await axios.post(`${API_BASE}/auth/register`, {
    email,
    password: 'TestPass123!',
    name: 'Test User'
  });
  
  console.log('Registration response:', {
    userId: regResp.data.user.id,
    token: regResp.data.token.substring(0, 20) + '...'
  });
  
  const token = regResp.data.token;
  
  // Try to get user info with the token
  try {
    const meResp = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Token works! User:', meResp.data.email);
  } catch (err) {
    console.error('❌ Token failed:', err.response?.data || err.message);
  }
}

test().catch(console.error);
