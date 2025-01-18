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
      const checkResponse = await fetch(
        `http://localhost:3000/users?email=${email}`
      );
      const existingUsers = await checkResponse.json();

      console.log(existingUsers.length);

      if (existingUsers && existingUsers.length > 0) {
        document.getElementById("emailError").style.display = "block";
        return;
      }

      const formData = {
        name: document.getElementById("name").value,
        email: email,
        password: password,
      };  
      const registerResponse = await fetch("http://localhost:3000/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!registerResponse.ok) {
        throw new Error("Registration failed");
      }

      const urlParams = new URLSearchParams(window.location.search);
      const queryString = urlParams.toString();

      window.location.href = `login.html${queryString ? "?" + queryString : ""}`;
    } catch (error) {
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