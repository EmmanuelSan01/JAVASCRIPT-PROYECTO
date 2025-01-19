async function tryFetch(localUrl) {
  try {
    const response = await fetch(localUrl);
    if (!response.ok) throw new Error("Local server not available");
    return { response, isLocal: true };
  } catch (error) {
    console.warn("Local server not found, switching to remote server:", error);
    const response = await fetch("https://render-deploy-nodejs-rd1x.onrender.com");
    if (!response.ok) throw new Error("Remote server not available");
    return { response, isLocal: false };
  }
}

function registerUser() {
  document.getElementById("registrationForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    document.getElementById("emailError").style.display = "none";
    document.getElementById("passwordError").style.display = "none";

    const password = document.getElementById("password").value;
    const repeatPassword = document.getElementById("repeatPassword").value;
    const email = document.getElementById("email").value;

    if (password !== repeatPassword) {
      document.getElementById("passwordError").style.display = "block";
      return;
    }

    try {
      // Check for existing users
      const { response: checkResponse, isLocal } = await tryFetch(
        `http://localhost:3000/users?email=${email}`
      );

      let existingUsers = [];
      
      if (isLocal) {
        existingUsers = await checkResponse.json();
      } else {
        // Check local storage first
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const remoteText = await checkResponse.text();
        const remoteData = JSON.parse(remoteText);
        const remoteUsers = Array.isArray(remoteData) ? remoteData : remoteData.users || [];
        
        // Combine remote users and stored users
        existingUsers = [...remoteUsers, ...storedUsers].filter(user => user.email === email);
      }

      if (existingUsers && existingUsers.length > 0) {
        document.getElementById("emailError").style.display = "block";
        return;
      }

      const formData = {
        name: document.getElementById("name").value,
        email: email,
        password: password,
      };

      // Register the user
      let registerResponse;
      if (isLocal) {
        registerResponse = await fetch("http://localhost:3000/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Get existing users from local storage
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Get remote users for ID generation
        const response = await fetch("https://render-deploy-nodejs-rd1x.onrender.com");
        const text = await response.text();
        const data = JSON.parse(text);
        const remoteUsers = Array.isArray(data) ? data : data.users || [];
        
        // Generate new ID based on both remote and stored users
        const allUsers = [...remoteUsers, ...storedUsers];
        const newUser = {
          ...formData,
          id: Math.max(...allUsers.map(u => u.id || 0), 0) + 1
        };
        
        // Add to stored users and save back to local storage
        storedUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(storedUsers));
        
        // Simulate successful response
        registerResponse = new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!registerResponse.ok && isLocal) {
        const errorText = await registerResponse.text();
        throw new Error(`Registration failed: ${errorText}`);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const queryString = urlParams.toString();

      window.location.href = `login.html${queryString ? "?" + queryString : ""}`;
    } catch (error) {
      console.error("Registration error:", error);
      alert("Error creating user: " + error.message);
    }
  });
}

window.onload = () => {
  registerUser();

  const loginLink = document.querySelector(".login-link a");
  const urlParams = new URLSearchParams(window.location.search);
  const queryString = urlParams.toString();

  if (queryString) {
    loginLink.href = `${loginLink.href}?${queryString}`;
  }
};