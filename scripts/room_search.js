const bedCosts = {
  twin: 100,
  full: 150,
  queen: 200,
  king: 250,
};
const bedCapacities = {
  twin: 1,
  full: 2,
  queen: 2,
  king: 2,
};

function initializeApp() {
  const form = document.getElementById("searchForm");
  const checkInInput = document.getElementById("checkIn");
  const checkOutInput = document.getElementById("checkOut");
  
  initializeDateInputs(checkInInput, checkOutInput);
  form.addEventListener("submit", (event) => handleSearch(event, checkInInput, checkOutInput));
}

function initializeDateInputs(checkInInput, checkOutInput) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toISOString().split("T")[0];

  checkInInput.min = today;
  checkOutInput.min = tomorrowFormatted;

  checkInInput.addEventListener("change", () => {
    const selectedCheckIn = new Date(checkInInput.value);
    const minCheckOut = new Date(selectedCheckIn);
    minCheckOut.setDate(minCheckOut.getDate() + 1);
    
    checkOutInput.min = minCheckOut.toISOString().split("T")[0];

    if (new Date(checkOutInput.value) <= selectedCheckIn) {
      checkOutInput.value = "";
    }
  });
}

function calculateRoomCapacity(beds) {
  return beds.reduce((total, bed) => {
    return total + bedCapacities[bed.size] * bed.count;
  }, 0);
}

function calculateRoomCost(beds) {
  return beds.reduce((total, bed) => {
    return total + bedCosts[bed.size] * bed.count;
  }, 0);
}

async function fetchRooms() {
  try {
    const response = await fetch("http://localhost:3000/rooms");
    if (!response.ok) throw new Error("Local server not available");

    const rooms = await response.json();
    return enhanceRoomsData(rooms);
  } catch (error) {
    console.warn("Local server not found, switching to remote server:", error);

    try {
      const currentUrl = window.location.href;
      const newUrl = currentUrl.replace(/\/pages\/.*$/, "/data/db.json");
      const response = await fetch(newUrl);
      if (!response.ok) throw new Error("Failed to fetch rooms from remote server");

      const text = await response.text();
      const data = JSON.parse(text);
      const rooms = Array.isArray(data) ? data : data.rooms || [];

      return enhanceRoomsData(rooms);
    } catch (remoteError) {
      console.error("Error fetching rooms from remote server:", remoteError);
      return [];
    }
  }
}

function enhanceRoomsData(rooms) {
  return rooms.map((room) => ({
    ...room,
    maxGuests: calculateRoomCapacity(room.beds),
    costPerNight: calculateRoomCost(room.beds),
  }));
}

function calculateTotalCost(costPerNight, checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = (end - start) / (1000 * 60 * 60 * 24);
  return costPerNight * nights;
}

async function handleSearch(event, checkInInput, checkOutInput) {
  event.preventDefault();

  const checkIn = checkInInput.value;
  const checkOut = checkOutInput.value;
  const guests = parseInt(document.getElementById("guests").value);
  const roomList = document.getElementById("roomList");
  
  const rooms = await fetchRooms();
  const availableRooms = filterAndSortRooms(rooms, guests);

  displayResults(roomList, availableRooms, checkIn, checkOut, guests);
}

function filterAndSortRooms(rooms, guests) {
  const filteredRooms = rooms.filter((room) => room.maxGuests >= guests);
  return filteredRooms.sort((a, b) => a.costPerNight - b.costPerNight);
}

function displayResults(roomList, rooms, checkIn, checkOut, guests) {
  roomList.innerHTML = "";

  if (rooms.length === 0) {
    roomList.innerHTML = `<div class="error">No rooms available for the selected criteria.</div>`;
    return;
  }

  rooms.forEach((room) => {
    const totalCost = calculateTotalCost(room.costPerNight, checkIn, checkOut);
    const bedInfo = room.beds
      .map((bed) => `${bed.count} ${bed.size}`)
      .join(", ");
    
    const roomCard = document.createElement("div");
    roomCard.className = "room-card";
    roomCard.innerHTML = `
      <h3>Room ${room.id}</h3>
      <div class="room-info">Beds: ${bedInfo}</div>
      <div class="room-info">Max Guests: ${room.maxGuests}</div>
      <div class="room-info">Cost per night: $${room.costPerNight}</div>
      <div class="total-cost">Total Cost: $${totalCost}</div>
      <button onclick="window.location.href='room_details.html?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&totalCost=${totalCost}'">See more</button>
    `;

    roomList.appendChild(roomCard);
  });
}

document.addEventListener("DOMContentLoaded", initializeApp);