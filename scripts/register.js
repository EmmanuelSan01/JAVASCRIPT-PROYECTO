async function tryFetch(localUrl) {
  try {
    const response = await fetch(localUrl);
    if (!response.ok) throw new Error("Local server not available");
    return { response, isLocal: true };
  } catch (error) {
    console.warn("Local server not found, switching to remote server:", error);
    const currentUrl = window.location.href;
    const newUrl = currentUrl.replace(/\/pages\/.*$/, "/data/db.json");
    const response = await fetch(newUrl);
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
      const { response: checkResponse, isLocal } = await tryFetch(
        `http://localhost:3000/users?email=${email}`
      );

      let existingUsers = [];
      
      if (isLocal) {
        existingUsers = await checkResponse.json();
      } else {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const remoteText = await checkResponse.text();
        const remoteData = JSON.parse(remoteText);
        let remoteUsers;

        if (Array.isArray(remoteData)) {
          remoteUsers = remoteData;
        } else if (remoteData.users) {
          remoteUsers = remoteData.users;
        } else {
          remoteUsers = [];
        }
        
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
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUrl = window.location.href;
        const newUrl = currentUrl.replace(/\/pages\/.*$/, "/data/db.json");
        const response = await fetch(newUrl);
        const text = await response.text();
        const data = JSON.parse(text);
        let remoteUsers;

        if (Array.isArray(data)) {
          remoteUsers = data;
        } else if (data.users) {
          remoteUsers = data.users;
        } else {
          remoteUsers = [];
        }

        const allUsers = [...remoteUsers, ...storedUsers];
        const newUser = {
          ...formData,
          id: Math.max(...allUsers.map(u => u.id || 0), 0) + 1
        };

        storedUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(storedUsers));

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