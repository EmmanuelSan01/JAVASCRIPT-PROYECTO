const ROOM_IMAGES = {
  1: "https://i.pinimg.com/1200x/80/ab/9c/80ab9cf8bc94f60dbe82bc70314f35c0.jpg",
  2: "https://i.pinimg.com/1200x/6c/ed/08/6ced0858dbb13b1e7c72867174ab59b7.jpg",
  default: "https://i.pinimg.com/1200x/ab/b3/c6/abb3c6bf4f2987172f5f7dcef51c2b07.jpg"
};

const urlParams = new URLSearchParams(window.location.search);
const bookingData = {
  roomId: urlParams.get("roomId"),
  checkIn: urlParams.get("checkIn"),
  checkOut: urlParams.get("checkOut"),
  guests: urlParams.get("guests"),
  totalCost: urlParams.get("totalCost")
};

const getUrlParameters = (data) => {
  return Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
};

const fetchFromServer = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
};

const getImageUrl = (totalBeds) => {
  return ROOM_IMAGES[totalBeds] || ROOM_IMAGES.default;
};

const formatBedInfo = (beds) => {
  if (!Array.isArray(beds)) {
    return '';
  }

  return beds
    .map(bed => {
      let bedDescription = `${bed.count} ${bed.size} bed`;
      if (bed.count > 1) {
        bedDescription += 's';
      }
      return bedDescription;
    })
    .join(", ");
};

const storeBookingLocal = async (bookingData) => {
  const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
  const fullBookingData = {
    ...bookingData,
    userId: loggedInUser.id
  };

  return fetchFromServer('http://localhost:3000/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullBookingData)
  });
};

const storeBookingRemote = async (bookingData) => {
  const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
  const storedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
  const currentUrl = window.location.href;
  const dbUrl = currentUrl.replace(/\/pages\/.*$/, "/data/db.json");
  
  const response = await fetchFromServer(dbUrl);
  const data = await response.json();
  let remoteBookings;

  if (Array.isArray(data)) {
    remoteBookings = data;
  } else if (data.bookings) {
    remoteBookings = data.bookings;
  } else {
    remoteBookings = [];
  }

  const allBookings = [...remoteBookings, ...storedBookings];
  
  const newBooking = {
    ...bookingData,
    userId: loggedInUser.id,
    id: Math.max(...allBookings.map(r => r.id || 0), 0) + 1
  };
  
  storedBookings.push(newBooking);
  localStorage.setItem('bookings', JSON.stringify(storedBookings));
};

const updateUI = (roomData, bookingData) => {
  const totalBeds = roomData.beds.reduce((sum, bed) => sum + bed.count, 0);
  const imageUrl = getImageUrl(totalBeds);
  const bedInfo = formatBedInfo(roomData.beds);

  document.getElementById("room-image-container").innerHTML = `
    <img src="${imageUrl}" alt="Room ${bookingData.roomId}" class="room-image">
  `;

  document.getElementById("room-info").innerHTML = `
    <h2 class="room-title">Room ${bookingData.roomId}</h2>
    <p class="bed-info">${bedInfo}</p>
  `;

  document.getElementById("price-info").innerHTML = `
    <div class="total-price">Total Cost: $${bookingData.totalCost}</div>
  `;
};

const handleBooking = async (isLocalServer, bookingData) => {
  const loggedInUser = sessionStorage.getItem('loggedInUser');
  
  if (loggedInUser) {
    try {
      if (isLocalServer) {
        await storeBookingLocal(bookingData);
      } else {
        await storeBookingRemote(bookingData);
      }
      window.location.href = 'bookings.html';
    } catch (error) {
      alert('Failed to store booking. Please try again.');
      console.error('Booking error:', error);
    }
  } else {
    window.location.href = `register.html?${getUrlParameters(bookingData)}`;
  }
};

const setupBookingButton = (isLocalServer, bookingData) => {
  document.getElementById("book-now-button").addEventListener(
    "click", 
    () => handleBooking(isLocalServer, bookingData)
  );
};

const fetchRoomData = async (bookingData) => {
  try {
    const response = await fetchFromServer(`http://localhost:3000/rooms/${bookingData.roomId}`);
    const roomData = await response.json();
    updateUI(roomData, bookingData);
    setupBookingButton(true, bookingData);
  } catch (error) {
    console.warn("Local server not found, switching to remote server:", error);
    
    try {
      const currentUrl = window.location.href;
      const dbUrl = currentUrl.replace(/\/pages\/.*$/, "/data/db.json");
      const response = await fetchFromServer(dbUrl);
      const data = await response.json();
      let rooms;

      if (Array.isArray(data)) {
        rooms = data;
      } else if (data.rooms) {
        rooms = data.rooms;
      } else {
        rooms = [];
      }
      
      const roomData = rooms.find(room => room.id === bookingData.roomId);
      
      if (!roomData) {
        throw new Error(`Room ${bookingData.roomId} not found`);
      }
      
      updateUI(roomData, bookingData);
      setupBookingButton(false, bookingData);
    } catch (remoteError) {
      console.error("Error fetching room data from remote server:", remoteError);
      document.getElementById("room-info").innerHTML = `
        <p class="error-message">Sorry, we couldn't load the room information. Please try again later.</p>
      `;
    }
  }
};

fetchRoomData(bookingData);