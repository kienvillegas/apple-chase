document.addEventListener("DOMContentLoaded", function () {
  const backgroundMusic = document.getElementById("backgroundMusic");
  const buttonClickSound = document.getElementById("buttonClickSound");
  const playNowButton = document.querySelector("#btnPlayNow");

  function playButtonClickSound() {
    buttonClickSound.play();
  }

  function handleUserInteraction() {
    backgroundMusic.muted = false;
    backgroundMusic.play(); // Play background music on user interaction
    document.removeEventListener("click", handleUserInteraction);
  }

  // Mute background music initially
  backgroundMusic.muted = true;

  // Fetch user volume from server
  fetch("/get-volume")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const userVolume = data.volume;
        // Set the background music volume based on userVolume
        backgroundMusic.volume = userVolume / 100; // Assuming userVolume is a percentage (0 to 100)
      } else {
        // User not authenticated, fetch volume from localStorage
        const userVolume = localStorage.getItem("userVolume") || 0; // Replace 'yourLocalStorageKey' with the actual key
        // Set the background music volume based on userVolume
        console.log(userVolume);
        backgroundMusic.volume = userVolume / 100; // Assuming userVolume is a percentage (0 to 100)
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });

  playNowButton.addEventListener("click", playButtonClickSound);
  document.addEventListener("click", handleUserInteraction);

  window.addEventListener("beforeunload", function () {
    // Autoplaying audio on beforeunload may not work consistently due to browser restrictions
    backgroundMusic.play();
  });
});
