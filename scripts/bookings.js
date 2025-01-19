async function cancelBooking(bookingId, cardElement) {
  // Get the button first to avoid reference error
  const cancelButton = cardElement.querySelector('.cancel-button');
  if (!cancelButton) {
      console.error('Cancel button not found');
      return;
  }

  try {
      // Disable the button
      cancelButton.disabled = true;
      cancelButton.textContent = 'Cancelling...';

      let cancelledOnServer = false;

      try {
          // Try to cancel on remote server first
          const response = await fetch(`http://localhost:3000/bookings/${bookingId}`, {
              method: 'DELETE'
          });

          if (response.ok) {
              cancelledOnServer = true;
          } else {
              throw new Error('Failed to cancel booking on server');
          }
      } catch (serverError) {
          console.log("Server unavailable, updating localStorage");
          
          // Get current bookings from localStorage
          const storedBookings = JSON.parse(localStorage.getItem('bookings')) || [];
          console.log('Before deletion:', storedBookings);
          
          // Find the booking to ensure it exists
          const bookingExists = storedBookings.some(booking => booking.id === parseInt(bookingId));
          if (!bookingExists) {
              throw new Error(`Booking ${bookingId} not found in localStorage`);
          }
          
          // Remove the booking
          const updatedBookings = storedBookings.filter(booking => booking.id !== parseInt(bookingId));
          console.log('After deletion:', updatedBookings);
          
          // Update localStorage
          localStorage.setItem('bookings', JSON.stringify(updatedBookings));
          
          // Verify the deletion
          const verifyBookings = JSON.parse(localStorage.getItem('bookings'));
          if (verifyBookings.some(booking => booking.id === parseInt(bookingId))) {
              throw new Error('Failed to delete booking from localStorage');
          }
          
          console.log('Booking successfully deleted from localStorage');
      }

      // If we get here, the booking was successfully cancelled either on server or in localStorage
      // Remove the card from the UI with a fade-out effect
      cardElement.style.transition = 'opacity 0.3s';
      cardElement.style.opacity = '0';
      
      setTimeout(() => {
          cardElement.remove();
          
          // Check if there are any remaining bookings
          const remainingBookings = document.querySelectorAll('.booking-card');
          if (remainingBookings.length === 0) {
              document.getElementById('bookings-container').innerHTML = `
                  <p>You don't have any bookings yet.</p>
              `;
          }
      }, 300);

  } catch (error) {
      console.error('Error cancelling booking:', error);
      // Reset the button state
      cancelButton.disabled = false;
      cancelButton.textContent = 'Cancel booking';
      alert(error.message || 'Failed to cancel booking. Please try again.');
  }
}

async function displayBookings() {
  const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
  
  if (!loggedInUser) {
      window.location.href = 'login.html';
      return;
  }

  const userId = loggedInUser.id;
  const bookingsContainer = document.getElementById('bookings-container');

  try {
      // Try local server first
      const response = await fetch('http://localhost:3000/bookings');
      
      if (!response.ok) throw new Error('Local server not available');

      const bookings = await response.json();
      const userBookings = bookings.filter(res => res.userId === userId);
      displayBookingsList(userBookings);

  } catch (error) {
      console.log("Server not available, using localStorage");
      
      try {
          const storedBookings = JSON.parse(localStorage.getItem('bookings')) || [];
          console.log('Reading from localStorage:', storedBookings);
          const userBookings = storedBookings.filter(res => res.userId === userId);
          displayBookingsList(userBookings);
      } catch (localStorageError) {
          console.error("Error reading from localStorage:", localStorageError);
          bookingsContainer.innerHTML = `
              <div class="error">
                  Sorry, we couldn't load your bookings. Please try again later.
              </div>
          `;
      }
  }
}

function displayBookingsList(bookings) {
  const bookingsContainer = document.getElementById('bookings-container');
  
  if (bookings.length === 0) {
      bookingsContainer.innerHTML = `
          <p>You don't have any bookings yet.</p>
      `;
      return;
  }

  const bookingsList = bookings.map(booking => `
      <div class="booking-card" id="booking-${booking.id}">
          <h3>Room ${booking.roomId}</h3>
          <div class="booking-details">
              <div class="booking-detail">
                  <strong>Check-in:</strong> ${booking.checkIn}
              </div>
              <div class="booking-detail"><strong>Check-in time:</strong> 14:00</div>
              <div class="booking-detail">
                  <strong>Check-out:</strong> ${booking.checkOut}
              </div>
              <div class="booking-detail">
                  <strong>Guests:</strong> ${booking.guests}
              </div>
              <div class="booking-detail">
                  <strong>Total Cost:</strong> $${booking.totalCost}
              </div>
          </div>
          <button
              class="cancel-button"
              data-booking-id="${booking.id}"
          >
              Cancel booking
          </button>
      </div>
  `).join('');

  bookingsContainer.innerHTML = bookingsList;
}

// Add event listener using event delegation
document.getElementById('bookings-container').addEventListener('click', async (event) => {
  if (event.target.classList.contains('cancel-button')) {
      const bookingId = event.target.dataset.bookingId;
      const cardElement = event.target.closest('.booking-card');
      await cancelBooking(bookingId, cardElement);
  }
});

// Load bookings when the page loads
displayBookings();