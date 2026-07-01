const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const fetchAPI = async (endpoint, options = {}) => {
  const { headers, ...restOptions } = options;
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {})
      },
      ...restOptions
    });
    
    let data;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }
    
    return { status: res.status, data };
  } catch (err) {
    return { status: 500, error: err.message };
  }
};

const runTests = async () => {
  console.log('🚀 Starting U-SPORT Automated Test Suite...\n');
  
  let passed = 0;
  let failed = 0;
  let context = {
    testUserEmail: `student_${Date.now()}@chitkara.edu.in`,
    accessToken: null,
    refreshToken: null,
  };

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} | ${details}`);
      failed++;
    }
  };

  // 1. Health Check
  const health = await fetchAPI('/health');
  assert(health.status === 200 && health.data?.success, 'Server Health Check');

  // 2. Register New User
  const registerRes = await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Student',
      email: context.testUserEmail,
      password: 'SecurePassword123!',
      role: 'student',
      rollNumber: '11223344',
      department: 'CSE'
    })
  });
  
  assert(registerRes.status === 201 && registerRes.data?.success, 'User Registration', JSON.stringify(registerRes.data));

  // 3. Login (Triggers OTP)
  const loginRes = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: context.testUserEmail,
      password: 'SecurePassword123!'
    })
  });

  // Login for unverified user should return 403 RequiresVerification but it still sends OTP!
  // Oh wait, in authController, login for unverified returns 403 requiresVerification: true.
  assert(loginRes.status === 403 && loginRes.data?.requiresVerification, 'Login (Unverified User) - Sends OTP', JSON.stringify(loginRes.data));

  // Since we don't have access to the DB directly in this script, we can't extract the exact OTP easily without DB access.
  // We need to bypass or mock the OTP for the test script. 
  // Wait, I can connect to MongoDB to grab the OTP for the test!
  
  console.log('\n📊 Test Results:');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) process.exit(1);
};

// Connect to mongoose to fetch OTP for testing
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('📦 Connected to MongoDB for testing.');
    
    const User = require('./models/User');
    
    // Override fetch to include OTP step
    const runFullTests = async () => {
      console.log('🚀 Starting U-SPORT Automated Test Suite...\n');
      
      let passed = 0;
      let failed = 0;
      let context = {
        testUserEmail: `student_${Date.now()}@chitkara.edu.in`,
        accessToken: null,
        refreshToken: null,
      };

      const assert = (condition, testName, details = '') => {
        if (condition) {
          console.log(`✅ PASS: ${testName}`);
          passed++;
        } else {
          console.error(`❌ FAIL: ${testName} | ${details}`);
          failed++;
        }
      };

      const health = await fetchAPI('/health');
      assert(health.status === 200, 'Server Health Check');

      const registerRes = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Student',
          email: context.testUserEmail,
          password: 'SecurePassword123!',
          role: 'student',
          rollNumber: '11223344',
          department: 'CSE'
        })
      });
      assert(registerRes.status === 201, 'User Registration');

      // Fetch OTP from DB
      const userDoc = await User.findOne({ email: context.testUserEmail }).select('+otp');
      const otp = userDoc?.otp;
      assert(!!otp, 'OTP Generated in DB');

      // Verify OTP
      const verifyRes = await fetchAPI('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: context.testUserEmail,
          otp
        })
      });
      
      assert(verifyRes.status === 200 && verifyRes.data?.data?.accessToken, 'OTP Verification & Token Generation');
      
      context.accessToken = verifyRes.data?.data?.accessToken;
      context.refreshToken = verifyRes.data?.data?.refreshToken;

      // Profile Fetch
      const profileRes = await fetchAPI('/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${context.accessToken}`
        }
      });
      assert(profileRes.status === 200 && profileRes.data?.data?.email === context.testUserEmail, 'Fetch Authenticated Profile');

      // Token Refresh
      const refreshRes = await fetchAPI('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: context.refreshToken
        })
      });
      assert(refreshRes.status === 200 && refreshRes.data?.data?.accessToken, 'Refresh Access Token');

      // Invalid route
      const invalidRes = await fetchAPI('/this-does-not-exist');
      assert(invalidRes.status === 404, '404 Error Handler Works');

      console.log('\n--- Running Admin & Domain Tests ---');
      
      // Seed an admin user directly using Mongoose
      let adminToken;
      try {
        const adminEmail = `admin_${Date.now()}@chitkara.edu.in`;
        const salt = await require('bcryptjs').genSalt(12);
        const hashedPassword = await require('bcryptjs').hash('AdminPass123!', salt);
        
        const adminUser = await User.create({
          name: 'Super Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          department: 'Admin',
          isEmailVerified: true
        });

        // Generate tokens directly for test
        const jwt = require('jsonwebtoken');
        adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        assert(!!adminToken, 'Admin Seed & Token Generation');

        // Test Admin Dashboard Stats
        const adminStats = await fetchAPI('/admin/stats', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert(adminStats.status === 200, 'Admin Dashboard Stats');

        // Test Sports Creation (Admin)
        const sportRes = await fetchAPI('/sports', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: `Basketball_${Date.now()}`,
            category: 'outdoor',
            totalFacilities: 2,
            location: 'Main Court'
          })
        });
        assert(sportRes.status === 201, 'Admin Sport Creation');
        
        const sportId = sportRes.data?.data?._id;
        console.log('[DEBUG TEST] sportRes.data:', sportRes.data);
        console.log('[DEBUG TEST] sportId:', sportId);

        // Test Sports Fetching (Student)
        const fetchSports = await fetchAPI('/sports', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${context.accessToken}` }
        });
        assert(fetchSports.status === 200 && Array.isArray(fetchSports.data?.data), 'Student Fetch Sports');

        if (sportId) {
           const bodyData = {
             sportId,
             startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
             endTime: new Date(Date.now() + 7200000).toISOString(),   // 2 hours from now
             purpose: 'Practice test'
           };
           console.log('[DEBUG TEST] Sending bodyData:', bodyData);

           // Test Facility Request (Student)
           const reqRes = await fetchAPI('/facility/request', {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${context.accessToken}` },
             body: JSON.stringify(bodyData)
           });
           assert(reqRes.status === 201, 'Student Facility Request Creation', JSON.stringify(reqRes.data));
           
           const reqId = reqRes.data?.data?._id;

           if (reqId) {
             // Test Admin Approving Request
             const approveRes = await fetchAPI(`/facility/approve/${reqId}`, {
               method: 'PUT',
               headers: { 'Authorization': `Bearer ${adminToken}` }
             });
             assert(approveRes.status === 200, 'Admin Approve Facility Request');
           }
        }

      } catch (err) {
        console.error('Domain Test Error:', err);
        assert(false, 'Admin & Domain Tests Execution');
      }

      console.log('\n📊 Test Results:');
      console.log(`Passed: ${passed}`);
      console.log(`Failed: ${failed}`);
      
      mongoose.disconnect();
      if (failed > 0) process.exit(1);
    };

    runFullTests();
  })
  .catch(err => console.error('DB Connection Failed:', err));
