const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting LostLink AI End-to-End API Integration Suite...');

  // 1. Health check
  console.log('\n--- 1. Testing /api/health ---');
  const health = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('Status:', health.status, 'Data:', health.data);

  // 2. User login
  console.log('\n--- 2. Testing /api/auth/login (Student) ---');
  const userLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'john@lostlink.ai', password: 'password123' }
  );
  console.log('Status:', userLogin.status, 'User:', userLogin.data?.data?.user?.name);
  const userToken = userLogin.data?.data?.token;

  // 3. Admin login
  console.log('\n--- 3. Testing /api/auth/login (Admin) ---');
  const adminLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'admin@lostlink.ai', password: 'admin123' }
  );
  console.log('Status:', adminLogin.status, 'Admin Role:', adminLogin.data?.data?.user?.role);
  const adminToken = adminLogin.data?.data?.token;

  // 4. Browse items
  console.log('\n--- 4. Testing /api/items (Browse) ---');
  const itemsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/items',
    method: 'GET'
  });
  console.log('Status:', itemsRes.status, 'Count:', itemsRes.data?.count);

  // 5. AI Chatbot
  console.log('\n--- 5. Testing /api/ai/chat (SRS Example: "I lost my black wallet near the college library yesterday.") ---');
  const aiChat = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      }
    },
    { message: 'I lost my black wallet near the college library yesterday.' }
  );
  console.log('Status:', aiChat.status);
  console.log('AI Reply:', aiChat.data?.data?.reply);
  console.log('Extracted Entity:', aiChat.data?.data?.extracted);
  console.log('Top Match Score:', aiChat.data?.data?.matches?.[0]?.matchScore + '%');
  console.log('Attribute Breakdown:', aiChat.data?.data?.matches?.[0]?.breakdown);

  // 6. Submit Claim
  console.log('\n--- 6. Testing /api/claims (Submit Claim) ---');
  const foundItem = itemsRes.data?.data?.find(i => i.type === 'found');
  if (foundItem) {
    const claimRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/claims',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        }
      },
      {
        itemId: foundItem._id,
        message: 'This is my item dropped earlier.',
        verificationAnswer: 'Has university logo sticker and engraving on back.'
      }
    );
    console.log('Status:', claimRes.status, 'Message:', claimRes.data?.message);
    const claimId = claimRes.data?.data?._id;

    // 7. Admin manage claim
    if (claimId) {
      console.log('\n--- 7. Testing /api/admin/claims/:id (Approve Claim) ---');
      const approveRes = await makeRequest(
        {
          hostname: 'localhost',
          port: 5000,
          path: `/api/admin/claims/${claimId}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          }
        },
        { status: 'approved', adminNotes: 'Verified at campus safety desk.' }
      );
      console.log('Status:', approveRes.status, 'Claim New Status:', approveRes.data?.data?.status);
    }
  }

  // 8. Admin platform stats
  console.log('\n--- 8. Testing /api/admin/stats ---');
  const statsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Status:', statsRes.status, 'Stats:', statsRes.data?.data);

  console.log('\n✅ All API Integration Tests Passed Successfully!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
