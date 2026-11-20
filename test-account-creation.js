#!/usr/bin/env node

/**
 * Account Creation Flow Test
 * Tests the complete registration and login flow
 */

const axios = require('axios');
const bcrypt = require('bcryptjs');

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'Test User'
};

console.log('🧪 Testing Account Creation Flow\n');
console.log('API Base:', API_BASE);
console.log('Test User:', TEST_USER.email, '\n');

async function testRegistration() {
  console.log('📝 Step 1: Testing Registration...');
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, TEST_USER);
    console.log('✅ Registration successful');
    console.log('   - User ID:', response.data.user.id);
    console.log('   - Email:', response.data.user.email);
    console.log('   - Name:', response.data.user.name);
    console.log('   - Role:', response.data.user.role);
    console.log('   - Token received:', response.data.token ? 'Yes' : 'No');
    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function testDuplicateRegistration() {
  console.log('\n📝 Step 2: Testing Duplicate Registration Prevention...');
  try {
    await axios.post(`${API_BASE}/auth/register`, TEST_USER);
    console.error('❌ Duplicate registration should have failed!');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && /already|exist/i.test(error.response.data.error)) {
      console.log('✅ Duplicate registration correctly rejected');
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testProfileUpdate(token) {
  console.log('\n📝 Step 3: Testing Profile Update...');
  try {
    const profileData = {
      birthday: '1995-05-15',
      address: '123 Test Street, Manila, Philippines',
      mobile_number: '+639171234567',
      username: TEST_USER.email,
      access_type: 'User'
    };
    
    const response = await axios.patch(`${API_BASE}/auth/me`, profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile updated successfully');
    console.log('   - Birthday:', response.data.birthday);
    console.log('   - Address:', response.data.address);
    console.log('   - Mobile:', response.data.mobile_number);
    return true;
  } catch (error) {
    console.error('❌ Profile update failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n📝 Step 4: Testing Login...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    console.log('✅ Login successful');
    console.log('   - User ID:', response.data.user.id);
    console.log('   - Token received:', response.data.token ? 'Yes' : 'No');
    console.log('   - Last login updated:', response.data.user.lastLogin ? 'Yes' : 'No');
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function testWrongPassword() {
  console.log('\n📝 Step 5: Testing Wrong Password...');
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_USER.email,
      password: 'WrongPassword123!'
    });
    console.error('❌ Login with wrong password should have failed!');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Wrong password correctly rejected');
      console.log('   - Error:', error.response.data.error);
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGetUserInfo(token) {
  console.log('\n📝 Step 6: Testing Get User Info...');
  try {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ User info retrieved successfully');
    console.log('   - ID:', response.data.id);
    console.log('   - Email:', response.data.email);
    console.log('   - Name:', response.data.name);
    console.log('   - Role:', response.data.role);
    console.log('   - Access Type:', response.data.access_type);
    console.log('   - Birthday:', response.data.birthday || 'Not set');
    console.log('   - Address:', response.data.address || 'Not set');
    console.log('   - Mobile:', response.data.mobile_number || 'Not set');
    return true;
  } catch (error) {
    console.error('❌ Get user info failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testPasswordReuse(token) {
  console.log('\n📝 Step 7: Testing Password Reuse Prevention...');
  try {
    // Try to change password to the same one
    await axios.patch(`${API_BASE}/auth/change-password`, {
      currentPassword: TEST_USER.password,
      newPassword: TEST_USER.password
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.error('❌ Password reuse should have been prevented!');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && /reuse|previous/i.test(error.response.data.error)) {
      console.log('✅ Password reuse correctly prevented');
      console.log('   - Error:', error.response.data.error);
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    total: 7
  };

  try {
    // Test 1: Registration
    const regData = await testRegistration();
    results.passed++;
    
    // Test 2: Duplicate registration
    if (await testDuplicateRegistration()) results.passed++;
    else results.failed++;
    
    // Test 3: Profile update
    if (await testProfileUpdate(regData.token)) results.passed++;
    else results.failed++;
    
    // Test 4: Login
    const loginData = await testLogin();
    results.passed++;
    
    // Test 5: Wrong password
    if (await testWrongPassword()) results.passed++;
    else results.failed++;
    
    // Test 6: Get user info
    if (await testGetUserInfo(loginData.token)) results.passed++;
    else results.failed++;
    
    // Test 7: Password reuse
    if (await testPasswordReuse(loginData.token)) results.passed++;
    else results.failed++;
    
  } catch (error) {
    results.failed++;
    console.error('\n❌ Test suite failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  console.log('='.repeat(50));

  if (results.passed === results.total) {
    console.log('\n🎉 All tests passed! Account creation flow is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error.message);
  process.exit(1);
});
