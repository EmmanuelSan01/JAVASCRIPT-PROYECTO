async function tryFetch(localUrl) {
  try {
    const response = await fetch(localUrl);
    if (!response.ok) throw new Error("Local server not available");
    return { response, isLocal: true };
  } catch (error) {
    console.warn("Local server not found, switching to local storage:", error);
    return { isLocal: false };
  }
}

function loginUser() {
  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    document.getElementById("emailError").style.display = "none";
    document.getElementById("passwordError").style.display = "none";

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const { response, isLocal } = await tryFetch(`http://localhost:3000/users?email=${email}`);

      let user = null;
      
      if (isLocal) {
        const users = await response.json();
        if (users && users.length > 0) {
          user = users[0];
        }
      } else {
        const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
        user = storedUsers.find(u => u.email === email);
      }

      if (!user) {
        document.getElementById("emailError").style.display = "block";
        return;
      }

      if (user.password !== password) {
        document.getElementById("passwordError").style.display = "block";
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);

      sessionStorage.setItem("loggedInUser", JSON.stringify(user));
      
      if (urlParams.toString()) {
        window.location.href = `room_details.html?${urlParams.toString()}`;
      } else {
        window.location.href = "bookings.html";
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Error during login: " + error.message);
    }
  });
}

window.onload = loginUser;

document.addEventListener("DOMContentLoaded", () => {
  const signUpLink = document.querySelector(".signup-link a");
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.toString()) {
    signUpLink.href = `register.html?${urlParams.toString()}`;
  }
});