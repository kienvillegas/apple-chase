document.addEventListener("DOMContentLoaded", function () {
  const btnSignIn = document.getElementById("btnSignIn");
  const btnSignUp = document.getElementById("btnSignUp");
  const btnCloseSignIn = document.getElementById("btnCloseSignIn");
  const btnCloseSignUp = document.getElementById("btnCloseSignUp");
  const btnSignout = document.getElementById("btnSignout");
  const btnCancelLogout = document.getElementById("btnCancelLogout");
  const btnConfirmLogout = document.getElementById("btnConfirmLogout");
  const btnPlayAsGuest = document.getElementById("btnPlayAsGuest");
  const btnLeaderboard = document.getElementById("btnLeaderboard");
  const btnInstructions = document.getElementById("btnInstructions");
  const btnSettings = document.getElementById("btnSettings");
  const btnSignInSubmit = document.getElementById("btnSignInSubmit");
  const btnSignUpSubmit = document.getElementById("btnSignUpSubmit");
  const btnDeleteAccount = document.getElementById("btnDeleteAccount");
  const deleteLoading = document.getElementById("deleteLoading");
  const canceDeleteBtn = document.getElementById("canceDeleteBtn");
  const closeSettings = document.getElementById("closeSettings");
  const editUsernameContainer = document.getElementById(
    "editUsernameContainer"
  );
  const deleteAccountContainer = document.getElementById(
    "deleteAccountContainer"
  );
  const deleteConfirmationModal = new bootstrap.Modal(
    document.getElementById("deleteConfirmationModal")
  );
  const logoutConfirmationModal = new bootstrap.Modal(
    document.getElementById("logoutConfirmationModal")
  );

  const signInModal = new bootstrap.Modal(
    document.getElementById("signInModal")
  );
  const signUpModal = new bootstrap.Modal(
    document.getElementById("signUpModal")
  );

  const errorModal = new bootstrap.Modal(document.getElementById("errorModal"));
  const settingsModal = new bootstrap.Modal(
    document.getElementById("settingsModal")
  );

  const instructionsModal = new bootstrap.Modal(
    document.getElementById("instructionsModal")
  );

  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");
  const usernameSignIn = document.getElementById("usernameSignIn");
  const passwordSignIn = document.getElementById("passwordSignIn");
  const newUsername = document.getElementById("newUsername");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const usernameSignInHelp = document.getElementById("usernameHelp");
  const passwordSignInHelp = document.getElementById("passwordHelp");
  const newUsernameHelp = document.getElementById("newUsernameHelp");
  const newPasswordHelp = document.getElementById("newPasswordHelp");
  const confirmPasswordHelp = document.getElementById("confirmPasswordHelp");
  const signInError = document.getElementById("signInError");
  const signUpError = document.getElementById("signUpError");
  const logoutError = document.getElementById("logoutError");
  const difficultySelect = document.getElementById("difficulty");
  const buttonClickSound = document.getElementById("buttonClickSound");
  const errorSound = document.getElementById("errorSound");
  const volumeControl = document.getElementById("volumeControl");
  const btnSaveSettings = document.getElementById("saveSettings");
  const selectDifficulty = document.getElementById("selectDifficulty");
  const instructionSlides = document.querySelectorAll(".instruction-slide");
  const btnPrevSlide = document.getElementById("btnPrevSlide");
  const btnNextSlide = document.getElementById("btnNextSlide");
  const signInLoading = document.getElementById("signInLoading");
  const signUpLoading = document.getElementById("signUpLoading");
  const logOutLoadng = document.getElementById("logOutLoadng");
  const deleteConfirmInput = document.getElementById("deleteConfirmInput");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const confirmDeleteHelp = document.getElementById("confirmDeleteHelp");
  const saveLoading = document.getElementById("saveLoading");
  const usernamePlaceholder = document.getElementById("usernamePlaceholder");

  let currentSlideIndex = 0;

  volumeControl.addEventListener("input", function () {
    const volumeValue = volumeControl.value / 100; // Convert 1-100 range to 0-1
    saveVolumeToLocalStorage(volumeValue);

    const backgroundMusic = document.getElementById("backgroundMusic");
    backgroundMusic.volume = volumeValue;

    // Display the current volume in the UI
    const currentVolumeElement = document.getElementById("currentVolume");
    currentVolumeElement.textContent = ` ${Math.round(volumeControl.value)}`;
  });

  document.addEventListener("click", function clickHandler() {
    checkLoggedIn();
    playBackgroundMusic();
    document.removeEventListener("click", clickHandler);
  });

  btnSignIn.addEventListener("click", function () {
    playButtonClickSound();
    openSignInModal();
  });

  btnSignUp.addEventListener("click", function () {
    playButtonClickSound();
    openSignUpModal();
  });

  btnCloseSignIn.addEventListener("click", function () {
    playButtonClickSound();
    closeSignInModal();
  });

  btnCloseSignUp.addEventListener("click", function () {
    playButtonClickSound();
    closeSignUpModal();
  });

  btnSignout.addEventListener("click", function () {
    playButtonClickSound();
    signout();
  });

  btnCancelLogout.addEventListener("click", function () {
    playButtonClickSound();
    cancelSignout();
  });

  btnConfirmLogout.addEventListener("click", function () {
    playButtonClickSound();
    confirmLogout();
  });

  btnStartGame.addEventListener("click", function () {
    playButtonClickSound();
    startGame();
  });

  btnPlayAsGuest.addEventListener("click", function () {
    playButtonClickSound();
    playAsGuest();
  });

  btnLeaderboard.addEventListener("click", function () {
    playButtonClickSound();
    showLeaderboard();
  });

  btnSettings.addEventListener("click", function () {
    playButtonClickSound();

    if (checkLoggedIn) {
      editUsernameContainer.style.display = "show";
      deleteAccountContainer.style.display = "show";
    } else {
      editUsernameContainer.style.display = "none";
      deleteAccountContainer.style.display = "none";
    }

    editUsername.textContent = "";
    editUsernameHelp.textContent = "";
    editUsernameHelp.classList.remove("text-danger", "is-invalid");
    settingsModal.show();
  });

  btnInstructions.addEventListener("click", function () {
    instructionsModal.show();
    showSlide(currentSlideIndex); // Show the initial slide when the modal is opened  });
  });

  // Add event listeners to show password buttons in Sign In modal
  document
    .getElementById("showPasswordSignIn")
    .addEventListener("click", function () {
      togglePasswordVisibility("passwordSignIn", "showPasswordSignIn");
    });

  // Add event listeners to show password buttons in Sign Up modal
  document
    .getElementById("showPasswordSignUp")
    .addEventListener("click", function () {
      togglePasswordVisibility("newPassword", "showPasswordSignUp");
    });

  document
    .getElementById("showConfirmPasswordSignUp")
    .addEventListener("click", function () {
      togglePasswordVisibility("confirmPassword", "showConfirmPasswordSignUp");
    });

  btnDeleteAccount.addEventListener("click", function () {
    settingsModal.hide();
    deleteConfirmationModal.show();
    deleteConfirmInput.value = ""; // Clear the input field
    confirmDeleteHelp.textContent = ""; // Clear any previous error messages
    confirmDeleteHelp.classList.remove("text-danger", "is-invalid"); // Remove Bootstrap classe
  });

  confirmDeleteBtn.addEventListener("click", function () {
    toggleDeleteLoading(true);
    const confirmationText = "CONFIRM";

    setTimeout(() => {
      if (deleteConfirmInput.value.trim() === confirmationText) {
        // Make a request to the server to delete the account
        fetch("/delete-account", {
          method: "DELETE",
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              location.reload();
            } else {
              // Display a generic error message in the deleteAccountHelp element with Bootstrap classes
              confirmDeleteHelp.textContent =
                data.error || "Failed to delete account. Please try again.";
              confirmDeleteHelp.classList.add("text-danger", "is-invalid");
            }
          })
          .catch((error) => {
            console.error("Error deleting account:", error);
            // Display a generic error message in the deleteAccountHelp element with Bootstrap classes
            confirmDeleteHelp.textContent =
              "An error occurred while deleting the account.";
            confirmDeleteHelp.classList.add("text-danger", "is-invalid");
          });
      } else {
        // Display a specific error message for incorrect confirmation with Bootstrap classes
        confirmDeleteHelp.textContent =
          'Invalid confirmation. Please type "CONFIRM" to proceed.';
        confirmDeleteHelp.classList.add("text-danger", "is-invalid");
        toggleDeleteLoading(false); // Hide the modal in case of an error
      }
    }, 3000);
  });

  // Event listener for closing the deletion confirmation modal
  deleteConfirmationModal._element.addEventListener(
    "hidden.bs.modal",
    function () {
      deleteConfirmInput.value = ""; // Clear the input field
      confirmDeleteHelp.textContent = ""; // Clear any previous error messages
      confirmDeleteHelp.classList.remove("text-danger", "is-invalid"); // Remove Bootstrap classes
    }
  );

  deleteConfirmationModal._element.addEventListener(
    "show.bs.modal",
    function () {
      deleteConfirmInput.value = "";
      deleteConfirmHelp.textContent = "";
      deleteConfirmHelp.classList.remove("text-danger", "is-invalid");
    }
  );

  btnSaveSettings.addEventListener("click", function () {
    playButtonClickSound();

    toggleSaveLoading(true);
    // Validate the username
    if (validateUsername()) {
      saveSettings();
    }
  });

  // Function to validate the editUsername
  async function validateUsername() {
    const editUsername = document.getElementById("editUsername").value.trim();
    const editUsernameHelp = document.getElementById("editUsernameHelp");

    if (editUsername.length < 5) {
      // Username is less than 5 characters, show error and update styles
      editUsernameHelp.textContent =
        "Username must be at least 5 characters long";
      editUsernameHelp.classList.add("text-danger", "is-invalid");
      return false; // Validation failed
    }

    // Reset previous error styles and messages
    editUsernameHelp.textContent = "";
    editUsernameHelp.classList.remove("text-danger", "is-invalid");

    // Check if the new username is unique
    const isUnique = await checkUniqueUsername(editUsername);

    if (!isUnique) {
      // Username is not unique, show error and update styles
      editUsernameHelp.textContent = "Username is already taken";
      editUsernameHelp.classList.add("text-danger", "is-invalid");
      return false; // Validation failed
    }

    return true; // Validation succeeded
  }

  // Function to check if the new username is unique
  async function checkUniqueUsername(newUsername) {
    try {
      const response = await fetch("/check-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newUsername }),
      });

      const data = await response.json();

      return data.success;
    } catch (error) {
      console.error("Error checking username uniqueness:", error);
      return false; // Assume non-unique in case of an error
    }
  }

  difficultySelect.addEventListener("change", function () {
    playSelectDifficultySound();
  });

  btnPrevSlide.addEventListener("click", function () {
    currentSlideIndex--;
    showSlide(currentSlideIndex);
  });

  btnNextSlide.addEventListener("click", function () {
    currentSlideIndex++;
    showSlide(currentSlideIndex);
  });

  checkLoggedIn();
  showSlide(currentSlideIndex);

  function showSlide(index) {
    const slides = document.querySelectorAll(".instruction-slide");
    const btnPrevSlide = document.getElementById("btnPrevSlide");
    const btnNextSlide = document.getElementById("btnNextSlide");

    if (index >= 0 && index < slides.length) {
      // Hide all slides
      slides.forEach((slide) => {
        slide.style.display = "none";
      });

      // Show the current slide
      slides[index].style.display = "block";
      currentSlideIndex = index;

      // Toggle visibility of the "Previous" button based on the current slide index
      if (btnPrevSlide) {
        btnPrevSlide.style.display = index === 0 ? "none" : "block";
      }

      // Toggle visibility of the "Next" button based on the current slide index
      if (btnNextSlide) {
        btnNextSlide.style.display =
          index === slides.length - 1 ? "none" : "block";
      }
    } else {
      console.error("Invalid slide index:", index);
    }
  }
  function playSelectDifficultySound() {
    if (selectDifficulty) {
      selectDifficulty.play();
    }
  }

  function getAndDisplayVolume() {
    // Assuming you have a server endpoint for getting volume, adjust the URL accordingly
    const getVolumeUrl = "/get-volume";

    fetch(getVolumeUrl)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const userVolume = data.volume; // Assuming the volume is already in the range [1, 100]

          // Update the range input value
          volumeControl.value = userVolume;

          // Update the text displaying the current volume
          const volumeText = document.getElementById("currentVolume");
          volumeText.textContent = userVolume;

          // Update the actual volume of the background music (adjust this part based on your specific implementation)
          // For example, if you are using an HTML audio element with id="backgroundMusic"
          const backgroundMusic = document.getElementById("backgroundMusic");
          backgroundMusic.volume = userVolume / 100;
        } else {
          console.error("Error getting user volume:", data.error);
        }
      })
      .catch((error) => {
        console.error("Error getting user volume:", error);
      });
  }

  // Save the user's volume to localStorage
  function saveVolumeToLocalStorage(volume) {
    localStorage.setItem("userVolume", volume);
  }

  // Retrieve the user's volume from localStorage
  function getVolumeFromLocalStorage() {
    return localStorage.getItem("userVolume");
  }

  getAndDisplayVolume();

  // Modify the saveSettings function to check if the username is validated// Modify the saveSettings function to check if the username is validated
  async function saveSettings() {
    const volumeValue = Number(volumeControl.value); // Convert to number without normalizing
    saveVolumeToLocalStorage(volumeValue); // Save to localStorage

    // Validate the username
    const isUsernameValid = await validateUsername();
    const saveSettingsUrl = "/save-settings";
    const updateVolumeUrl = "/update-volume";

    // Check if the user is logged in
    fetch("/check-login-status")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // User is logged in, proceed with saving settings to the server
          const requestOptions = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: isUsernameValid ? editUsername.value : null, // Pass the username if it's valid
              volume: volumeValue ? volumeValue : 1 /*, other settings... */,
            }),
          };

          // Choose the appropriate route based on username validation
          const targetUrl = isUsernameValid ? saveSettingsUrl : updateVolumeUrl;

          fetch(targetUrl, requestOptions)
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                toggleSaveLoading(false);

                // Modify the success message based on the target URL
                const successMessage =
                  targetUrl === saveSettingsUrl
                    ? "Settings saved successfully"
                    : "Volume setting saved successfully";

                displaySettingsMessage(successMessage, "success");
              } else {
                toggleSaveLoading(false);
                displaySettingsMessage("Error saving settings", "danger");
                console.error("Error saving settings:", data.error);
              }
            })
            .catch((error) => {
              toggleSaveLoading(false);
              displaySettingsMessage("Error saving settings", "danger");
              console.error("Error saving settings:", error);
            });
        } else {
          toggleSaveLoading(false);
          // User is not logged in, no need to save settings to the server
          console.warn("User is not logged in. Settings not saved to server.");
          displaySettingsMessage(
            "User is not logged in. Settings not saved to server.",
            "warning"
          );
          // Optionally, you can display a message to the user, or just log the warning
        }
      })
      .catch((error) => {
        console.error("Error checking login status:", error);
        // If there is an error, do not save settings to the server
        displaySettingsMessage("Error saving settings", "danger");
      });
  }

  function displaySettingsMessage(message, messageType) {
    const settingsMessageContainer = document.getElementById(
      "changesSavedMessage"
    );

    settingsMessageContainer.textContent = message;
    settingsMessageContainer.className = `alert mt-3 alert-${messageType}`;
    settingsMessageContainer.style.display = "block";
    // Optionally, you can hide the message after a certain duration
    setTimeout(() => {
      settingsMessageContainer.style.display = "none"; // Hide the message container
    }, 5000); // Adjust the duration in milliseconds
  }

  function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const passwordIcon = document.getElementById(iconId);

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      passwordIcon.innerText = "Hide";
    } else {
      passwordInput.type = "password";
      passwordIcon.innerText = "Show";
    }
  }

  function playErrorSound() {
    // Check if the error modal is displayed or if there is an error message
    if (
      errorModal._isShown || // Assuming _isShown is an internal property indicating whether the modal is displayed
      (signInError && signInError.textContent) ||
      (signUpError && signUpError.textContent) ||
      (logoutError && logoutError.textContent)
    ) {
      if (errorSound) {
        // Check if the audio element is present
        errorSound.play();
      }
    }
  }

  function playButtonClickSound() {
    if (buttonClickSound) {
      // Check if the audio element is present
      buttonClickSound.play();
    }
  }

  // Function to play background music
  function playBackgroundMusic() {
    // Mute the audio initially
    backgroundMusic.muted = true;

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

  // Event listener for navigation events
  window.addEventListener("beforeunload", function () {
    // This will be triggered before navigating away from the page
    playBackgroundMusic();
  });

  function showLeaderboard() {
    window.location.href = "/leaderboard";
  }
  function showErrorModal(message) {
    document.getElementById("errorModalMessage").textContent = message;
    errorModal.show();
    playErrorSound(); // Add this line to play the error sound
  }

  function startGame() {
    const selectedDifficulty = difficultySelect.value;
    console.log("Starting Game...");
    window.location.href = `/game/registered/:${selectedDifficulty}`;
  }

  function playAsGuest() {
    const selectedDifficulty = difficultySelect.value;
    console.log("Play as Guest clicked");

    window.location.href = `/game/guest/:${selectedDifficulty}`;
  }

  logoutConfirmationModal._element.addEventListener(
    "show.bs.modal",
    function () {
      resetErrorMessages();
    }
  );

  signInModal._element.addEventListener("hidden.bs.modal", function () {
    resetErrorMessages();
  });

  signUpModal._element.addEventListener("hidden.bs.modal", function () {
    resetErrorMessages();
  });

  function cancelSignout() {
    logoutConfirmationModal.hide();
    resetErrorMessages();
  }

  function confirmLogout() {
    console.log("Logout Confirmed");
    toggleLogOutLoading(true);

    setTimeout(function () {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      };

      fetch("/sign-out", requestOptions)
        .then((response) => {
          console.log("Response status:", response.status);
          return response.json();
        })
        .then((data) => handleLogoutResponse(data))
        .catch((error) => {
          console.error("Error during POST:", error);
          // Handle any specific error logging or additional actions if needed
        });
    }, 5000);
  }

  function handleLogoutResponse(data) {
    console.log("Log Out processing...");
    if (data && data.success !== undefined) {
      if (data.success) {
        // Handle successful logout on the client side
        console.log("Logout successful");
        // Optionally, you can hide the logout button or redirect the user
        btnSignout.style.display = "none";
        location.reload();
        resetErrorMessages();
      } else {
        // Handle logout failure
        console.error("Logout failed");

        // Check if there is an error message in the response
        if (data.error) {
          console.log("Log Out Error: " + data.error);
          // Display the error message in the logoutError div
          logoutError.textContent = data.error;
          playErrorSound(); // Play the error sound
        } else {
          console.log(
            (logoutError.textContent = "Logout failed. Please try again.")
          );
          // If there is no specific error message, display a generic error
          logoutError.textContent = "Logout failed. Please try again.";
          playErrorSound(); // Play the error sound
        }
      }
    } else {
      // Handle the case where 'data' is undefined or doesn't have 'success' property
      console.error("Invalid response format during logout");
    }
  }
  function checkLoggedIn() {
    const btnSignout = document.getElementById("btnSignout"); // Make sure to use the correct ID
    const usernameContainer = document.getElementById("usernameContainer");

    fetch("/check-login-status")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // User is logged in, hide sign-up, sign-in, and "or" text
          hideElements([
            btnSignIn,
            btnSignUp,
            document.getElementById("orText"),
          ]);
          // Show the logout button
          btnSignout.style.display = "block";
          btnStartGame.style.display = "block";
          btnPlayAsGuest.style.display = "none";
          editUsernameContainer.style.display = "block";
          deleteAccountContainer.style.display = "block";

          // Display the username
          if (usernameContainer) {
            if (usernamePlaceholder) {
              usernamePlaceholder.textContent = data.user.username
                ? data.user.username
                : "Player";
            }
            usernameContainer.style.display = "block";
          }

          // If the user is authenticated, get and display the volume from the server
          getAndDisplayVolume();
        } else {
          // User is not logged in, show sign-up, sign-in, and "or" text
          showElements([
            btnSignIn,
            btnSignUp,
            document.getElementById("orText"),
          ]);
          // Hide the logout button
          btnSignout.style.display = "none";
          btnStartGame.style.display = "none";
          btnPlayAsGuest.style.display = "block";
          editUsernameContainer.style.display = "none";
          deleteAccountContainer.style.display = "none";

          // Display the username
          if (usernameContainer) {
            if (usernamePlaceholder) {
              usernamePlaceholder.textContent = "Player";
            }
            usernameContainer.style.display = "block";
          }

          // Use the volume from localStorage if the user is not authenticated
          const storedVolume = getVolumeFromLocalStorage();
          if (storedVolume !== null) {
            // Set the volume from localStorage
            volumeControl.value = storedVolume;
            const backgroundMusic = document.getElementById("backgroundMusic");
            backgroundMusic.volume = storedVolume / 100;

            // Update the text displaying the current volume
            const volumeText = document.getElementById("currentVolume");
            volumeText.textContent = storedVolume;
          }
        }
      })
      .catch((error) => {
        console.error("Error checking login status:", error);
      });
  }

  function hideElements(elements) {
    elements.forEach((element) => {
      if (element) {
        element.style.display = "none";
      }
    });
  }

  function showElements(elements) {
    elements.forEach((element) => {
      if (element) {
        element.style.display = "block";
      }
    });
  }

  function openSignInModal() {
    signInModal.show();
    resetInputValues(signInForm);
    resetInputValues(signUpForm);
    resetHelpMessages();
    resetErrorMessages(); // Reset error messages when opening the modal
  }

  function closeSignInModal() {
    signInModal.hide();
    resetInputValues(signInForm);
    resetInputValues(signUpForm);
    resetHelpMessages();
    resetErrorMessages(); // Reset error messages when closing the modal
  }

  function openSignUpModal() {
    signUpModal.show();
    resetInputValues(signInForm);
    resetInputValues(signUpForm);
    resetHelpMessages();
    resetErrorMessages(); // Reset error messages when closing the modal
  }

  function closeSignUpModal() {
    signUpModal.hide();
    resetInputValues(signInForm);
    resetInputValues(signUpForm);
    resetHelpMessages();
    resetErrorMessages(); // Reset error messages when closing the modal
  }

  function handleServerResponse(data, action) {
    console.log("Handling server response:", data);
    if (data && data.success !== undefined) {
      if (data.success) {
        action();
        location.reload();
      } else {
        // Check for errors not related to username, password, newPassword, newUsername, or confirmPassword
        if (data.error) {
          console.error("Server error:", data.error);

          if (
            !data.error.includes("User not found") &&
            !data.error.includes("Incorrect password") &&
            !data.error.includes("Username is already taken")
          ) {
            // Display the error in the appropriate element
            if (signInError || signUpError) {
              signInError.textContent = data.error;
              signInError.classList.add("text-danger", "is-invalid");
              signUpError.textContent = data.error;
              signUpError.classList.add("text-danger", "is-invalid");
            } else {
              console.error("Error element not found");
            }
            playErrorSound(); // Add this line to play the error sound
          } else {
            // Handle other errors related to username, password, newPassword, newUsername, or confirmPassword
            if (data.error === "User not found") {
              // User not found, show error and update styles
              console.log("User not found");
              if (usernameSignInHelp) {
                usernameSignInHelp.textContent = "User not found";
                usernameSignInHelp.classList.add("text-danger", "is-invalid");
              } else {
                console.error("usernameSignInHelp is null");
              }

              // Reset password help message
              if (passwordSignInHelp) {
                passwordSignInHelp.textContent = originalHelpMessages.password;
                passwordSignInHelp.classList.remove(
                  "text-danger",
                  "is-invalid"
                );
              }
            } else if (data.error === "Incorrect password") {
              // Invalid password, show error and update styles
              console.log("Incorrect password");
              if (passwordSignInHelp) {
                passwordSignInHelp.textContent = "Incorrect password";
                passwordSignInHelp.classList.add("text-danger", "is-invalid");
              } else {
                console.error("passwordSignInHelp is null");
              }

              // Reset username help message
              if (usernameSignInHelp) {
                usernameSignInHelp.textContent = originalHelpMessages.username;
                usernameSignInHelp.classList.remove(
                  "text-danger",
                  "is-invalid"
                );
              }
            } else if (data.error.includes("Username is already taken")) {
              // Username is already taken, show error and update styles
              console.log("Username is already taken");
              if (newUsernameHelp) {
                newUsernameHelp.textContent = "Username is already taken";
                newUsernameHelp.classList.add("text-danger", "is-invalid");
              } else {
                console.error("newUsernameHelp is null");
              }
            } else {
              // Display the error modal with a specific message
              showErrorModal(data.error);
            }
          }
        }
      }
    } else {
      // Handle the case where 'data' is undefined or doesn't have 'success' property
      console.error("Invalid response format during server response handling");
    }
  }

  function sendRequest(url, method, body, successAction) {
    const requestOptions = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    fetch(url, requestOptions)
      .then((response) => {
        console.log("Response status:", response.status);
        return response.json();
      })
      .then((data) => handleServerResponse(data, successAction))
      .catch((error) => console.error(`Error during ${method}:`, error));
  }
  signInForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const username = usernameSignIn.value.trim();
    const password = passwordSignIn.value.trim();

    // Reset previous error styles and messages
    resetHelpMessages();
    resetErrorMessages();

    // Show loading state
    toggleSignInLoading(true);

    // Simulate a delay for the loading state (replace this with your actual logic)
    setTimeout(function () {
      // Reset the loading state
      toggleSignInLoading(false);

      // Continue with the existing logic for form submission
      sendRequest("/sign-in", "POST", { username, password }, closeSignInModal);
    }, 3000); // Simulated delay of 2 seconds, replace with your actual form submission logic
  });

  signUpForm.addEventListener("submit", function (event) {
    console.log("Clicked");
    event.preventDefault();
    const newUser = newUsername.value.trim();
    const userPassword = newPassword.value.trim();
    const confirmUserPassword = confirmPassword.value.trim();

    // Reset previous error styles
    newUsernameHelp.classList.remove("text-danger", "is-invalid");
    newPasswordHelp.classList.remove("text-danger", "is-invalid");
    confirmPasswordHelp.classList.remove("text-danger", "is-invalid");

    if (newUser.length < 5) {
      // Username is less than 5 characters, show error and update styles
      newUsernameHelp.textContent =
        "Username must be at least 5 characters long";
      newUsernameHelp.classList.add("text-danger", "is-invalid");
      return;
    }

    if (userPassword.length < 8) {
      // Password is less than 8 characters, show error and update styles
      newPasswordHelp.textContent =
        "Password must be at least 8 characters long";
      newPasswordHelp.classList.add("text-danger", "is-invalid");
      return;
    }

    if (userPassword !== confirmUserPassword) {
      // Passwords do not match, show error and update styles
      confirmPasswordHelp.textContent = "Passwords do not match";
      confirmPasswordHelp.classList.add("text-danger", "is-invalid");
      return;
    }

    toggleSignUpLoading(true);

    setTimeout(function () {
      toggleSignUpLoading(false);
      sendRequest(
        "/sign-up",
        "POST",
        { username: newUser, password: userPassword },
        closeSignUpModal
      );
    }, 5000);
  });

  function resetInputValues(form) {
    const inputs = form.getElementsByTagName("input");
    for (let i = 0; i < inputs.length; i++) {
      // Check if the input type is not "submit" before resetting the value
      if (inputs[i].type !== "submit") {
        inputs[i].value = "";
      }
    }
  }

  const originalHelpMessages = {
    username: usernameSignInHelp.textContent,
    password: passwordSignInHelp.textContent,
    newUsername: newUsernameHelp.textContent,
    newPassword: newPasswordHelp.textContent,
    confirmPassword: confirmPasswordHelp.textContent,
  };

  function resetHelpMessages() {
    // Reset all error messages to their original text
    if (usernameSignInHelp) {
      usernameSignInHelp.textContent = originalHelpMessages.username;
      usernameSignInHelp.classList.remove("text-danger", "is-invalid");
    }

    if (passwordSignInHelp) {
      passwordSignInHelp.textContent = originalHelpMessages.password;
      passwordSignInHelp.classList.remove("text-danger", "is-invalid");
    }

    if (newUsernameHelp) {
      newUsernameHelp.textContent = originalHelpMessages.newUsername;
      newUsernameHelp.classList.remove("text-danger", "is-invalid");
    }

    if (newPasswordHelp) {
      newPasswordHelp.textContent = originalHelpMessages.newPassword;
      newPasswordHelp.classList.remove("text-danger", "is-invalid");
    }

    if (confirmPasswordHelp) {
      confirmPasswordHelp.textContent = originalHelpMessages.confirmPassword;
      confirmPasswordHelp.classList.remove("text-danger", "is-invalid");
    }
  }

  function signout() {
    logoutConfirmationModal.show();
    resetErrorMessages();
    console.log("Logout clicked");
  }

  function resetErrorMessages() {
    // Reset the values of error elements
    if (signInError) {
      signInError.textContent = "";
    }
    if (signUpError) {
      signUpError.textContent = "";
    }
    if (logoutError) {
      logoutError.textContent = "";
    }
  }
  function toggleSignInLoading(isLoading) {
    if (isLoading) {
      signInLoading.style.display = "inline-block";
      btnSignInSubmit.style.display = "none";
    } else {
      signInLoading.style.display = "none";
      btnSignInSubmit.style.display = "block";
    }
  }

  function toggleSignUpLoading(isLoading) {
    if (isLoading) {
      signUpLoading.style.display = "inline-block";
      btnSignUpSubmit.style.display = "none";
    } else {
      signUpLoading.style.display = "none";
      btnSignUpSubmit.style.display = "block";
    }
  }

  function toggleLogOutLoading(isLoading) {
    if (isLoading) {
      logOutLoading.style.display = "inline-block";
      btnCancelLogout.style.display = "none";
      btnConfirmLogout.style.display = "none";
    } else {
      logOutLoadng.style.display = "none";
      btnCancelLogout.style.display = "block";
      btnConfirmLogout.style.display = "block";
    }
  }

  function toggleDeleteLoading(isLoading) {
    if (signInLoading) {
      if (isLoading) {
        deleteLoading.style.display = "inline-block";
        confirmDeleteBtn.style.display = "none";
        canceDeleteBtn.style.display = "none";
      } else {
        deleteLoading.style.display = "none";
        confirmDeleteBtn.style.display = "block";
        canceDeleteBtn.style.display = "block";
      }
    }
  }

  function toggleSaveLoading(isLoading) {
    if (isLoading) {
      saveLoading.style.display = "inline-block";
      btnSaveSettings.style.display = "none";
      closeSettings.style.display = "none";
    } else {
      saveLoading.style.display = "none";
      btnSaveSettings.style.display = "block";
      closeSettings.style.display = "block";
    }
  }
});
