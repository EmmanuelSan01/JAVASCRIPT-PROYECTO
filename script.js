class RoomSearch {
  constructor() {
    this.form = document.getElementById("searchForm");
    this.roomList = document.getElementById("roomList");
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

    this.form.addEventListener("submit", this.handleSearch.bind(this));
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

    const checkIn = document.getElementById("checkIn").value;
    const checkOut = document.getElementById("checkOut").value;
    const guests = parseInt(document.getElementById("guests").value);

    if (!this.validateDates(checkIn, checkOut)) {
      this.showError(
        "Please select valid dates. Check-out must be after check-in."
      );
      return;
    }

    const rooms = await this.fetchRooms();
    const availableRooms = this.filterAndSortRooms(rooms, guests);
    this.displayResults(availableRooms, checkIn, checkOut);
  }

  validateDates(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return start < end;
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
      const totalCost = this.calculateTotalCost(
        room.costPerNight,
        checkIn,
        checkOut
      );
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
        <button id="book">Book</button>
      `;

      this.roomList.appendChild(roomCard);
    });

    const bookButton = document.getElementById("book");
    bookButton.addEventListener("click", function() {
      window.location.replace("login.html");
    });
  }

  showError(message) {
    this.roomList.innerHTML = `<div class="error">${message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new RoomSearch();
});