document.addEventListener("DOMContentLoaded", async function () {
  const tableBody = document.getElementById("leaderboard-table-body");
  const difficultySelect = document.getElementById("difficulty-select");
  const spinner = document.getElementById("spinner");

  const audioElements = {
    backgroundMusic: document.getElementById("backgroundMusic"),
    errorSound: document.getElementById("errorSound"),
    selectDifficulty: document.getElementById("selectDifficulty"),
  };

  // Event listener for initial click
  document.addEventListener("click", function clickHandler() {
    playAudio("backgroundMusic");
    document.removeEventListener("click", clickHandler);
  });

  // Event listener for difficulty selection change
  difficultySelect.addEventListener("change", handleDifficultyChange);

  // Set default difficulty to "easy" on page load
  const defaultDifficulty = "easy";
  difficultySelect.value = defaultDifficulty;

  // Fetch user volume and set background music volume
  await fetchUserVolume();

  // Fetch leaderboard data
  fetchLeaderboardData(defaultDifficulty);

  window.addEventListener("beforeunload", function () {
    // This will be triggered before navigating away from the page
    playAudio("backgroundMusic");
  });

  // Function to format time in minutes and seconds
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  }

  async function fetchUserVolume() {
    try {
      const response = await fetch("/get-volume");

      // Check if the response status is 401 (Unauthorized)
      if (response.status === 401) {
        console.error("User not authenticated");

        // Fallback to using volume from localStorage
        const storedVolume = localStorage.getItem("userVolume");
        if (storedVolume) {
          const parsedVolume = parseInt(storedVolume, 10);

          // Ensure the volume is within the valid range [1, 100]
          if (
            !isNaN(parsedVolume) &&
            parsedVolume >= 1 &&
            parsedVolume <= 100
          ) {
            audioElements.backgroundMusic.volume = parsedVolume / 100;
          } else {
            console.error("Invalid volume value in localStorage");
          }
        } else {
          console.error("No volume found in localStorage");
        }

        return;
      }

      const data = await response.json();

      if (data.success) {
        const userVolume = data.volume;

        // Set the volume of background music (assuming the server provides the volume in the range [1, 100])
        audioElements.backgroundMusic.volume = userVolume / 100;
      } else {
        console.error("Error fetching user volume:", data.error);
        playAudio("errorSound");
        showErrorModal("Failed to retrieve user volume");

        // If user is not authenticated, try to get the volume from localStorage
        const storedVolume = localStorage.getItem("userVolume");
        if (storedVolume) {
          const parsedVolume = parseInt(storedVolume, 10);

          // Ensure the volume is within the valid range [1, 100]
          if (
            !isNaN(parsedVolume) &&
            parsedVolume >= 1 &&
            parsedVolume <= 100
          ) {
            audioElements.backgroundMusic.volume = parsedVolume / 100;
          } else {
            console.error("Invalid volume value in localStorage");
          }
        } else {
          console.error("No volume found in localStorage");
        }
      }
    } catch (error) {
      console.error("Error fetching user volume:", error);
      playAudio("errorSound");
      showErrorModal("An error occurred while fetching user volume");

      // If an error occurs, try to get the volume from localStorage
      const storedVolume = localStorage.getItem("userVolume");
      if (storedVolume) {
        const parsedVolume = parseInt(storedVolume, 10);

        // Ensure the volume is within the valid range [1, 100]
        if (!isNaN(parsedVolume) && parsedVolume >= 1 && parsedVolume <= 100) {
          audioElements.backgroundMusic.volume = parsedVolume / 100;
        } else {
          console.error("Invalid volume value in localStorage");
        }
      } else {
        console.error("No volume found in localStorage");
      }
    }
  }

  function handleDifficultyChange() {
    playAudio("selectDifficulty");
    toggleSpinner(true);
    const selectedDifficulty = difficultySelect.value;
    fetchLeaderboardData(selectedDifficulty);
  }
  function fetchLeaderboardData(difficulty) {
    toggleSpinner(true);

    // Clear existing table rows
    tableBody.innerHTML = "";

    if (!difficulty) {
      // If difficulty is not selected, show a message
      const row = tableBody.insertRow(0);
      const cell = row.insertCell(0);
      cell.colSpan = 5; // Set colspan to cover all columns
      cell.classList.add("text-center", "py-3", "display-4"); // Bootstrap classes for centering, padding, and larger text
      cell.style.fontStyle = "italic"; // Optional: Make the message italic
      cell.textContent = "Please select a difficulty."; // Your message here

      toggleSpinner(false);
      return;
    }

    // Continue fetching leaderboard data
    setTimeout(function () {
      toggleSpinner(false);
      fetch(`/leaderboard/${difficulty}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(data); // Check the structure of the data

          if (data.success) {
            toggleSpinner(false);
            populateTable(data.leaderboard);
            checkLoggedIn();
          } else {
            toggleSpinner(false);
            console.error("Error fetching leaderboard data:", data.error);
            playAudio("errorSound");
            showErrorModal("An error occurred. Please try again later.");
          }
        })
        .catch((error) => {
          console.error("Error fetching leaderboard data:", error);
          playAudio("errorSound");
          showErrorModal("An error occurred. Please try again later.");
        });
    }, 5000);
  }

  function populateTable(leaderboardData) {
    // Clear existing table rows
    tableBody.innerHTML = "";

    if (leaderboardData.length === 0) {
      // If there is no data, display a centered message
      const row = tableBody.insertRow(0);
      const cell = row.insertCell(0);
      cell.colSpan = 5; // Set colspan to cover all columns
      cell.classList.add("text-center", "py-3", "display-4"); // Bootstrap classes for centering, padding, and larger text
      cell.style.fontStyle = "italic"; // Optional: Make the message italic
      cell.textContent = "Be the first one to reach the top!"; // Your message here
    } else {
      // Populate the table with the received data
      leaderboardData.forEach((entry, index) => {
        const row = tableBody.insertRow(index);
        const cells = [
          row.insertCell(0),
          row.insertCell(1),
          row.insertCell(2),
          row.insertCell(3),
          row.insertCell(4),
        ];

        cells[0].textContent = index + 1;
        cells[1].textContent = entry.userId.username; // Access username within userId
        cells[2].textContent = entry.score;
        cells[3].textContent = formatTime(entry.timeLength); // Use formatted time
        cells[4].textContent = entry.difficulty;
      });
    }
  }

  function playAudio(audioName) {
    const audio = audioElements[audioName];
    if (audio) {
      audio.play().catch((error) => {
        console.error("Failed to play audio:", error);
      });
    }
  }

  function showErrorModal(message) {
    const errorModalMessage = document.getElementById("errorModalMessage");

    if (errorModalMessage) {
      // Set the error message
      errorModalMessage.textContent = message;

      // Show the error modal
      $("#errorModal").modal("show");
    }
  }

  function toggleSpinner(isLoading) {
    if (isLoading) {
      spinner.style.display = "block";
    } else {
      spinner.style.display = "none";
    }
  }

  async function checkLoggedIn() {
    fetch("/check-login-status")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // If the user is logged in, highlight their score in the leaderboard
          highlightLoggedInUserScore(data.user.username);
        }
      })
      .catch((error) => {
        console.error("Error checking login status:", error);
      });
  }

  function highlightLoggedInUserScore(loggedInUsername) {
    console.log("Highlighting for:", loggedInUsername);

    const rows = tableBody.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
      console.log("HEloo");
      const cells = rows[i].getElementsByTagName("td");
      const usernameCell = cells[1];

      if (usernameCell) {
        console.log("Username in row", i, ":", usernameCell.textContent);
        if (usernameCell.textContent === loggedInUsername) {
          console.log("Highlighting row:", i);
          rows[i].classList.add("table-active"); // Adjust the class based on your styling
          break;
        }
      }
    }
  }
});
