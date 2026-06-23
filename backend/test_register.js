async function testRegister() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'testtest@chitkara.edu.in',
        password: 'password123',
        role: 'student',
        rollNumber: '1234567890',
        department: 'CSE'
      })
    });
    const data = await res.json();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", data);
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}

testRegister();
