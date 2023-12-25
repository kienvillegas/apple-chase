document.addEventListener("DOMContentLoaded", function () {
  // Select form and submit status elements
  const contactForm = document.querySelector("#contactForm");
  const submitButton = document.querySelector("#submit-button");
  const submitStatus = document.querySelector("#submit-status");
  const backgroundMusic = document.getElementById("backgroundMusic");
  const errorSound = document.getElementById("errorSound");
  const buttonClickSound = document.getElementById("buttonClickSound");
  const errorModal = $("#errorModal");

  document.addEventListener("click", function clickHandler() {
    fetchAndPlayVolume();
    document.removeEventListener("click", clickHandler);
  });

  window.addEventListener("beforeunload", function () {
    // This will be triggered before navigating away from the page
    fetchAndPlayVolume();
  });

  // Event listener for form submission
  contactForm.addEventListener("submit", async function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Fetch form data
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // Validate form data (you can add more validation if needed)
    if (!name || !email || !message) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Play button click sound
      playButtonClickSound();

      // Send a POST request to the server
      const response = await fetch("/submit-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      // Parse the response data
      const responseData = await response.json();

      if (response.ok) {
        // Successful form submission
        displayStatusMessage("Message sent", "alert-success");
      } else {
        // Handle errors
        displayStatusMessage("Error sending message", "alert-danger");

        // Play error sound on error
        playErrorSound();
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("An unexpected error occurred:", error);
      displayStatusMessage("Unexpected error", "alert-danger");

      // Play error sound on unexpected error
      playErrorSound();

      // Display error modal with a message
      showErrorModal("An unexpected error occurred. Please try again later.");
    }

    // Reset the form after submission
    contactForm.reset();

    // Clear the status message after a few seconds
    setTimeout(() => {
      submitStatus.innerHTML = "";
    }, 5000);
  });

  // Event listener for button click
  submitButton.addEventListener("click", function () {
    // Play button click sound
    playButtonClickSound();
  });

  // Function to display a status message
  function displayStatusMessage(message, className) {
    submitStatus.innerHTML = `<div class="alert ${className}">${message}</div>`;
  }

  // Function to fetch and play the volume
  async function fetchAndPlayVolume() {
    try {
      // Fetch the user's volume from the server
      const response = await fetch("/get-volume", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Include any other headers needed for authentication
        },
      });

      if (response.ok) {
        // If the response is successful, parse the JSON data
        const responseData = await response.json();
        const userVolume = responseData.volume;

        // Now you can use the userVolume as needed
        console.log("User volume from server:", userVolume);

        // Play background music with the fetched volume
        playBackgroundMusic(userVolume);
      } else if (response.status === 401) {
        // If the server responds with a 401 status (unauthenticated), try to get the volume from localStorage
        const localStorageVolume = localStorage.getItem("userVolume");

        if (localStorageVolume !== null) {
          // Use the volume from localStorage
          console.log("User volume from localStorage:", localStorageVolume);

          // Play background music with the localStorage volume
          playBackgroundMusic(localStorageVolume);
        } else {
          // Handle the case where the user is not authenticated and localStorage volume not found
          console.error(
            "User not authenticated, and localStorage volume not found"
          );
        }
      } else {
        // Handle other error cases
        console.error("Error fetching user volume:", response.statusText);
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    }
  }

  // Function to play background music with a specified volume
  function playBackgroundMusic(volume) {
    // Ensure the volume is within the valid range [0, 1]
    const clampedVolume = Math.min(100, Math.max(1, parseFloat(volume))); // Assuming the volume range is 1 to 100

    // Scale the volume to fit within the [0, 1] range
    const scaledVolume = clampedVolume / 100;

    // Mute the audio initially
    backgroundMusic.muted = true;

    // Set the volume to the scaled value
    backgroundMusic.volume = scaledVolume;

    console.log("Background music is about to play.");

    // Play the background music
    backgroundMusic
      .play()
      .then(() => {
        console.log("Background music started playing.");

        // Unmute the audio after a short delay (adjust the delay as needed)
        setTimeout(() => {
          backgroundMusic.muted = false;
          console.log("Background music unmuted.");
        }, 1000); // Adjust the delay in milliseconds
      })
      .catch((error) => {
        console.error("Failed to play background music:", error);
      });
  }

  // Function to play error sound
  function playErrorSound() {
    if (errorSound) {
      errorSound.play();
    }
  }

  // Function to play button click sound
  function playButtonClickSound() {
    if (buttonClickSound) {
      buttonClickSound.play();
    }
  }

  // Function to display error modal
  function showErrorModal(message) {
    const errorModalMessage = document.getElementById("errorModalMessage");

    if (errorModalMessage) {
      // Set the error message
      errorModalMessage.textContent = message;

      // Show the error modal
      errorModal.modal("show");
    }
  }
});
