const fetchFromServer = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
};

const getRemoteUrl = () => {
  const currentUrl = window.location.href;
  return currentUrl.replace(/\/pages\/.*$/, "/data/db.json");
};

const parseServerData = async (response) => {
  const text = await response.text();
  const data = JSON.parse(text);
  let parsedData;
  
  if (Array.isArray(data)) {
    parsedData = data;
  } else if (data.users) {
    parsedData = data.users;
  } else {
    parsedData = [];
  }

  return parsedData;
};

const tryFetch = async (localUrl) => {
  try {
    const response = await fetchFromServer(localUrl);
    return { response, isLocal: true };
  } catch (error) {
    console.warn("Local server not found, switching to remote server:", error);
    const response = await fetchFromServer(getRemoteUrl());
    return { response, isLocal: false };
  }
};

const getAllUsers = async (isLocal, response) => {
  if (isLocal) {
    return await response.json();
  }

  const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
  const remoteUsers = await parseServerData(response);
  return [...remoteUsers, ...storedUsers];
};

const validateRegistration = (password, repeatPassword, email) => {
  const errors = {};
  
  if (password !== repeatPassword) {
    errors.password = true;
  }
  
  return errors;
};

const createUser = async (formData, isLocal) => {
  if (isLocal) {
    return fetchFromServer("http://localhost:3000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
  }

  const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
  const remoteUsers = await parseServerData(await fetchFromServer(getRemoteUrl()));
  const allUsers = [...remoteUsers, ...storedUsers];
  
  const newUser = {
    ...formData,
    id: Math.max(...allUsers.map(u => u.id || 0), 0) + 1
  };

  storedUsers.push(newUser);
  localStorage.setItem('users', JSON.stringify(storedUsers));

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

const handleRegistration = async (event) => {
  event.preventDefault();

  document.getElementById("emailError").style.display = "none";
  document.getElementById("passwordError").style.display = "none";

  const formValues = {
    password: document.getElementById("password").value,
    repeatPassword: document.getElementById("repeatPassword").value,
    email: document.getElementById("email").value,
    name: document.getElementById("name").value
  };

  const errors = validateRegistration(formValues.password, formValues.repeatPassword, formValues.email);
  if (errors.password) {
    document.getElementById("passwordError").style.display = "block";
    return;
  }

  try {
    const { response: checkResponse, isLocal } = await tryFetch(
      `http://localhost:3000/users?email=${formValues.email}`
    );

    const existingUsers = await getAllUsers(isLocal, checkResponse);
    const userExists = existingUsers.some(user => user.email === formValues.email);

    if (userExists) {
      document.getElementById("emailError").style.display = "block";
      return;
    }

    const formData = {
      name: formValues.name,
      email: formValues.email,
      password: formValues.password,
    };

    const registerResponse = await createUser(formData, isLocal);

    if (!registerResponse.ok && isLocal) {
      const errorText = await registerResponse.text();
      throw new Error(`Registration failed: ${errorText}`);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const queryString = urlParams.toString();
    
    if (queryString) {
      window.location.href = `login.html?${queryString}`;
    } else {
      window.location.href = "login.html";
    }
    
  } catch (error) {
    console.error("Registration error:", error);
    alert("Error creating user: " + error.message);
  }
};

const updateLoginLink = () => {
  const loginLink = document.querySelector(".login-link a");
  const queryString = window.location.search;
  
  if (queryString) {
    loginLink.href = `${loginLink.href}${queryString}`;
  }
};

window.onload = () => {
  document.getElementById("registrationForm").addEventListener("submit", handleRegistration);
  updateLoginLink();
};