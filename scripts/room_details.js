const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");
const checkIn = urlParams.get("checkIn");
const checkOut = urlParams.get("checkOut");
const guests = urlParams.get("guests")
const totalCost = urlParams.get("totalCost");

async function storeBooking(isLocalServer) {
  const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
  const userId = loggedInUser.id;

  const bookingData = {
    roomId,
    checkIn,
    checkOut,
    totalCost,
    guests,
    userId
  };

  if (isLocalServer) {
    try {
      const response = await fetch('http://localhost:3000/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error('Failed to store booking on local server');
      }
    } catch (error) {
      console.error('Error storing booking:', error);
      throw error;
    }
  } else {
    try {
      const storedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const currentUrl = window.location.href;
      const newUrl = currentUrl.replace(/\/pages\/.*$/, "/data/db.json");
      const response = await fetch(newUrl);
      const text = await response.text();
      const data = JSON.parse(text);
      let remoteBookings;

      if (Array.isArray(data)) {
        remoteBookings = data;
      } else if (data.bookings) {
        remoteBookings = data.bookings;
      } else {
        remoteBookings = [];
      }

      const allBookings = [...remoteBookings, ...storedBookings];
      const newbooking = {
        ...bookingData,
        id: Math.max(...allBookings.map(r => r.id || 0), 0) + 1
      };
      
      storedBookings.push(newbooking);
      localStorage.setItem('bookings', JSON.stringify(storedBookings));
    } catch (error) {
      console.error('Error storing booking in localStorage:', error);
      throw error;
    }
  }
}

async function fetchRoomData() {
  try {
    const response = await fetch(`http://localhost:3000/rooms/${roomId}`);
    let isLocalServer = true;

    if (!response.ok) throw new Error("Local server not available");

    const roomData = await response.json();
    const totalBeds = roomData.beds.reduce((sum, bed) => sum + bed.count, 0);
    let imageUrl;

    if (totalBeds === 1) {
      imageUrl = "https://i.pinimg.com/1200x/80/ab/9c/80ab9cf8bc94f60dbe82bc70314f35c0.jpg";
    } else if (totalBeds === 2) {
      imageUrl = "https://i.pinimg.com/1200x/6c/ed/08/6ced0858dbb13b1e7c72867174ab59b7.jpg";
    } else {
      imageUrl = "https://i.pinimg.com/1200x/ab/b3/c6/abb3c6bf4f2987172f5f7dcef51c2b07.jpg";
    }    

    document.getElementById("room-image-container").innerHTML = `
      <img src="${imageUrl}" alt="Room ${roomId}" class="room-image">
    `;

    let bedInfo = "";

    if (roomData.beds && Array.isArray(roomData.beds)) {
      bedInfo = roomData.beds
        .map((bed) => {
          let bedDescription = `${bed.count} ${bed.size} bed`;
          if (bed.count > 1) {
            bedDescription += "s";
          }
          return bedDescription;
        })
        .join(", ");
    }    

    document.getElementById("room-info").innerHTML = `
      <h2 class="room-title">Room ${roomId}</h2>
      <p class="bed-info">${bedInfo}</p>
    `;

    document.getElementById("price-info").innerHTML = `
      <div class="total-price">Total Cost: $${totalCost}</div>
    `;

    document.getElementById("book-now-button").addEventListener("click", async () => {
      const loggedInUser = sessionStorage.getItem('loggedInUser');
      const urlParameters = `roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&totalCost=${totalCost}`;
      
      if (loggedInUser) {
        try {
          await storeBooking(isLocalServer);
          window.location.href = `bookings.html`;
        } catch (error) {
          alert('Failed to store booking. Please try again.');
        }
      } else {
        window.location.href = `register.html?${urlParameters}`;
      }
    });
  } catch (error) {
    console.warn("Local server not found, switching to remote server:", error);
    let isLocalServer = false;

    try {
      const currentUrl = window.location.href;
      const newUrl = currentUrl.replace(/\/pages\/.*$/, "/data/db.json");
      const response = await fetch(newUrl);

      if (!response.ok) throw new Error("Failed to fetch room data from remote server");

      const text = await response.text();
      const data = JSON.parse(text);
      let rooms;

      if (Array.isArray(data)) {
        rooms = data;
      } else if (data.rooms) {
        rooms = data.rooms;
      } else {
        rooms = [];
      }
      
      const roomData = rooms.find(room => room.id === roomId);
      
      if (!roomData) {
        throw new Error(`Room ${roomId} not found`);
      }

      const totalBeds = roomData.beds.reduce((sum, bed) => sum + bed.count, 0);
      let imageUrl;

      if (totalBeds === 1) {
        imageUrl = "https://i.pinimg.com/1200x/80/ab/9c/80ab9cf8bc94f60dbe82bc70314f35c0.jpg";
      } else if (totalBeds === 2) {
        imageUrl = "https://i.pinimg.com/1200x/6c/ed/08/6ced0858dbb13b1e7c72867174ab59b7.jpg";
      } else {
        imageUrl = "https://i.pinimg.com/1200x/ab/b3/c6/abb3c6bf4f2987172f5f7dcef51c2b07.jpg";
      }      

      document.getElementById("room-image-container").innerHTML = `
        <img src="${imageUrl}" alt="Room ${roomId}" class="room-image">
      `;

      let bedInfo = "";

      if (roomData.beds && Array.isArray(roomData.beds)) {
        bedInfo = roomData.beds
          .map((bed) => {
            let bedDescription = `${bed.count} ${bed.size} bed`;
            if (bed.count > 1) {
              bedDescription += "s";
            }
            return bedDescription;
          })
          .join(", ");
      }      

      document.getElementById("room-info").innerHTML = `
        <h2 class="room-title">Room ${roomId}</h2>
        <p class="bed-info">${bedInfo}</p>
      `;

      document.getElementById("price-info").innerHTML = `
        <div class="total-price">Total Cost: $${totalCost}</div>
      `;

      document.getElementById("book-now-button").addEventListener("click", async () => {
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        const urlParameters = `roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&totalCost=${totalCost}`;
        
        if (loggedInUser) {
          try {
            await storeBooking(isLocalServer);
            window.location.href = `bookings.html`;
          } catch (error) {
            alert('Failed to store booking. Please try again.');
          }
        } else {
          window.location.href = `register.html?${urlParameters}`;
        }
      });
    } catch (remoteError) {
      console.error("Error fetching room data from remote server:", remoteError);
      document.getElementById("room-info").innerHTML = `
        <p class="error-message">Sorry, we couldn't load the room information. Please try again later.</p>
      `;
    }
  }
}

fetchRoomData();