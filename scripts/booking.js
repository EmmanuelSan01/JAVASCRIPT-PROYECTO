const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");
const checkIn = urlParams.get("checkIn");
const checkOut = urlParams.get("checkOut");
const totalCost = urlParams.get("totalCost");

async function fetchRoomData() {
  try {
    const response = await fetch(`http://localhost:3000/rooms/${roomId}`);

    if (!response.ok) throw new Error("Local server not available");

    const roomData = await response.json();
    const totalBeds = roomData.beds.reduce((sum, bed) => sum + bed.count, 0);
    const imageUrl =
      totalBeds === 1
        ? "https://i.pinimg.com/1200x/80/ab/9c/80ab9cf8bc94f60dbe82bc70314f35c0.jpg"
        : totalBeds === 2
        ? "https://i.pinimg.com/1200x/6c/ed/08/6ced0858dbb13b1e7c72867174ab59b7.jpg"
        : "https://i.pinimg.com/1200x/ab/b3/c6/abb3c6bf4f2987172f5f7dcef51c2b07.jpg";

    document.getElementById("room-image-container").innerHTML = `
      <img src="${imageUrl}" alt="Room ${roomId}" class="room-image">
    `;

    const bedInfo = roomData.beds
      .map((bed) => `${bed.count} ${bed.size} bed${bed.count > 1 ? "s" : ""}`)
      .join(", ");

    document.getElementById("room-info").innerHTML = `
      <h2 class="room-title">Room ${roomId}</h2>
      <p class="bed-info">${bedInfo}</p>
    `;

    document.getElementById("price-info").innerHTML = `
      <div class="total-price">Total Cost: $${totalCost}</div>
    `;

    document.getElementById("book-now-button").addEventListener("click", () => {
      const registrationUrl = `register.html?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}&totalCost=${totalCost}`;
      window.location.href = registrationUrl;
    });
  } catch (error) {
    console.warn("Local server not found, switching to remote server:", error);

    try {
      const response = await fetch(`https://render-deploy-nodejs-rd1x.onrender.com`);

      if (!response.ok) throw new Error("Failed to fetch room data from remote server");

      const text = await response.text();
      const data = JSON.parse(text);
      const rooms = Array.isArray(data) ? data : data.rooms || [];
      
      // Find the specific room
      const roomData = rooms.find(room => room.id === roomId);
      
      if (!roomData) {
        throw new Error(`Room ${roomId} not found`);
      }

      // Reuse the same display logic for remote data
      const totalBeds = roomData.beds.reduce((sum, bed) => sum + bed.count, 0);
      const imageUrl =
        totalBeds === 1
          ? "https://i.pinimg.com/1200x/80/ab/9c/80ab9cf8bc94f60dbe82bc70314f35c0.jpg"
          : totalBeds === 2
          ? "https://i.pinimg.com/1200x/6c/ed/08/6ced0858dbb13b1e7c72867174ab59b7.jpg"
          : "https://i.pinimg.com/1200x/ab/b3/c6/abb3c6bf4f2987172f5f7dcef51c2b07.jpg";

      document.getElementById("room-image-container").innerHTML = `
        <img src="${imageUrl}" alt="Room ${roomId}" class="room-image">
      `;

      const bedInfo = roomData.beds
        .map((bed) => `${bed.count} ${bed.size} bed${bed.count > 1 ? "s" : ""}`)
        .join(", ");

      document.getElementById("room-info").innerHTML = `
        <h2 class="room-title">Room ${roomId}</h2>
        <p class="bed-info">${bedInfo}</p>
      `;

      document.getElementById("price-info").innerHTML = `
        <div class="total-price">Total Cost: $${totalCost}</div>
      `;

      document.getElementById("book-now-button").addEventListener("click", () => {
        const registrationUrl = `register.html?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}&totalCost=${totalCost}`;
        window.location.href = registrationUrl;
      });
    } catch (remoteError) {
      console.error("Error fetching room data from remote server:", remoteError);
      // Display error message to user
      document.getElementById("room-info").innerHTML = `
        <p class="error-message">Sorry, we couldn't load the room information. Please try again later.</p>
      `;
    }
  }
}

fetchRoomData();