async function testSignup() {
  const testData = {
    fullName: "Ibrahim Munaser",
    email: "ibrahimmunaser@gmail.com",
    password: "Fatass222?",
  };

  console.log("\n🧪 Testing signup API...");
  console.log("Data:", testData);

  try {
    const response = await fetch("http://localhost:3000/api/auth/signup-student", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();
    
    console.log("\n📊 Response Status:", response.status);
    console.log("📊 Response Data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("\n❌ Signup failed:", data.error);
    } else {
      console.log("\n✅ Signup successful!");
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

testSignup();
