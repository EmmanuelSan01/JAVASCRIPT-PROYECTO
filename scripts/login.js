function loginUser() {
  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    document.getElementById("emailError").style.display = "none";
    document.getElementById("passwordError").style.display = "none";

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const checkResponse = await fetch(
        `http://localhost:3000/users?email=${email}`
      );
      const users = await checkResponse.json();

      if (!users || users.length === 0) {
        document.getElementById("emailError").style.display = "block";
        return;
      }

      const user = users[0];
      
      if (user.password !== password) {
        document.getElementById("passwordError").style.display = "block";
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.toString()) {
        window.location.href = `booking.html?${urlParams.toString()}`;
      } else {
        window.location.href = "index.html";
      }
    } catch (error) {
      alert("Error during login: " + error.message);
    }
  });
}

window.onload = loginUser;

document.addEventListener("DOMContentLoaded", () => {
  const signUpLink = document.querySelector(".signup-link a");
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.toString()) {
    signUpLink.href = `registration.html?${urlParams.toString()}`;
  }
});