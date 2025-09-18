// Test file with problematic code
const API_KEY = "sk-prod-12345"; // Hardcoded secret
const password = "admin123"; 

function getUserData() {
  // TODO: Implement real database call
  console.log("Mock response for testing");
  return { mock: true, data: "placeholder" };
}

fetch("http://api.example.com/users"); // Insecure HTTP