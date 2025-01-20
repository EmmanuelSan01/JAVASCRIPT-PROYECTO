document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.querySelector("#carousel .flex")
  const prevBtn = document.querySelector("#prevBtn")
  const nextBtn = document.querySelector("#nextBtn")
  const slides = carousel.children
  let currentIndex = 0

  function showSlide(index) {
    carousel.style.transform = `translateX(-${index * 100}%)`
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length
    showSlide(currentIndex)
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length
    showSlide(currentIndex)
  }

  nextBtn.addEventListener("click", nextSlide)
  prevBtn.addEventListener("click", prevSlide)

  // Auto-advance slides every 5 seconds
  setInterval(nextSlide, 5000)
})