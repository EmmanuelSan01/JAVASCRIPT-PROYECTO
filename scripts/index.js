class RoomSearch {
  constructor() {
    this.form = document.getElementById("searchForm");
    this.roomList = document.getElementById("roomList");
    this.checkInInput = document.getElementById("checkIn");
    this.checkOutInput = document.getElementById("checkOut");
    this.baseUrl = "http://localhost:3000";
    this.bedCosts = {
      twin: 100,
      full: 150,
      queen: 200,
      king: 250,
    };
    this.bedCapacities = {
      twin: 1,
      full: 2,
      queen: 2,
      king: 2,
    };
    this.initializeDateInputs();
    this.form.addEventListener("submit", this.handleSearch.bind(this));
  }

  initializeDateInputs() {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowFormatted = tomorrow.toISOString().split("T")[0];

    this.checkInInput.min = today;
    this.checkOutInput.min = tomorrowFormatted;

    this.checkInInput.addEventListener("change", () => {
      const selectedCheckIn = new Date(this.checkInInput.value);
      const minCheckOut = new Date(selectedCheckIn);

      minCheckOut.setDate(minCheckOut.getDate() + 1);

      this.checkOutInput.min = minCheckOut.toISOString().split("T")[0];

      if (new Date(this.checkOutInput.value) <= selectedCheckIn) {
        this.checkOutInput.value = "";
      }
    });
  }

  calculateRoomCapacity(beds) {
    return beds.reduce((total, bed) => {
      return total + this.bedCapacities[bed.size] * bed.count;
    }, 0);
  }

  calculateRoomCost(beds) {
    return beds.reduce((total, bed) => {
      return total + this.bedCosts[bed.size] * bed.count;
    }, 0);
  }

  async fetchRooms() {
    try {
      const response = await fetch(`${this.baseUrl}/rooms`);
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const rooms = await response.json();

      return rooms.map((room) => ({
        ...room,
        maxGuests: this.calculateRoomCapacity(room.beds),
        costPerNight: this.calculateRoomCost(room.beds),
      }));
    } catch (error) {
      console.error("Error fetching rooms:", error);
      this.showError("Failed to load room data. Please try again.");
      return [];
    }
  }

  calculateTotalCost(costPerNight, checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = (end - start) / (1000 * 60 * 60 * 24);    
    return costPerNight * nights;
  }

  async handleSearch(event) {
    event.preventDefault();

    const checkIn = this.checkInInput.value;
    const checkOut = this.checkOutInput.value;
    const guests = parseInt(document.getElementById("guests").value);
    const rooms = await this.fetchRooms();
    const availableRooms = this.filterAndSortRooms(rooms, guests);

    this.displayResults(availableRooms, checkIn, checkOut);
  }

  filterAndSortRooms(rooms, guests) {
    const filteredRooms = rooms.filter((room) => room.maxGuests >= guests);
    return filteredRooms.sort((a, b) => a.costPerNight - b.costPerNight);
  }

  displayResults(rooms, checkIn, checkOut) {
    this.roomList.innerHTML = "";

    if (rooms.length === 0) {
      this.showError("No rooms available for the selected criteria.");
      return;
    }

    rooms.forEach((room) => {
      const totalCost = this.calculateTotalCost(room.costPerNight, checkIn, checkOut);
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
        <button onclick="window.location.href='pages/booking.html?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${room.maxGuests}&totalCost=${totalCost}'">See more</button>
      `;

      this.roomList.appendChild(roomCard);
    });
  }

  showError(message) {
    this.roomList.innerHTML = `<div class="error">${message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new RoomSearch();
});