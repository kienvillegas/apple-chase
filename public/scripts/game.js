document.addEventListener("DOMContentLoaded", function () {
  // Constants
  const SPEED_INCREASE_INTERVAL = 60;
  const INITIAL_WORM_LENGTH = 3;
  const OBSTACLE_SIZE = 30;
  const NUM_OBSTACLES = 200;
  const IMMUNITY_TIME = 10;
  const DEFAULT_WORM_SPEED = 50;
  const DEFAULT_RECALCULATION_INTERVAL = 120;
  const SCORE_UPDATE_INTERVAL = 1;

  // Variables
  let canvas, ctx, apple, worm, wormBody, timer;
  let obstacles = [];
  let immunityTime = IMMUNITY_TIME;
  let isImmune = true;
  let timerInterval;
  let isGameOver = false;
  let currentTime = 0;
  let isPaused = false;
  let displayStatusText = false;
  let lastFrameTime;
  let score = 0;
  let recalculationInterval = DEFAULT_RECALCULATION_INTERVAL;
  let scoreIncrementPerSecond = 1;
  let lastScoreUpdateTime = 0;
  let isMuted = false;

  const wormSprites = {
    top: [],
    left: [],
    down: [],
    right: [],
  };

  for (let i = 1; i < 5; i++) {
    wormSprites.top.push(loadWormImage(`/assets/wormTop${i}.png`));
    wormSprites.left.push(loadWormImage(`/assets/wormLeft${i}.png`));
    wormSprites.down.push(loadWormImage(`/assets/wormDown${i}.png`));
    wormSprites.right.push(loadWormImage(`/assets/wormRight${i}.png`));
  }

  function loadWormImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  const exitConfirmationModal = new bootstrap.Modal(
    document.getElementById("exitConfirmationModal")
  );
  const gameOverModal = new bootstrap.Modal(
    document.getElementById("gameOverModal")
  );
  const btnCancelExit = document.getElementById("btnCancelExit");
  const btnConfirmExit = document.getElementById("btnConfirmExit");
  const btnMute = document.getElementById("btnMute");
  const btnPause = document.getElementById("btnPause");
  const btnExit = document.getElementById("btnExit");
  const backgroundMusic = new Audio("/audio/game_bg_music.mp3");
  const clickMusic = new Audio("/audio/click_sound.ogg");
  const collisionMusic = new Audio("/audio/collision_obstacle.ogg");
  const wormMovementMusic = new Audio("/audio/worm_movement.mp3");
  const gameOverMusic = new Audio("/audio/game_over_music.mp3");
  const tapMusic = new Audio("/audio/tap_sound.mp3");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const redAppleSprite = document.getElementById("redAppleSprite");
  const yellowAppleSprite = document.getElementById("yellowAppleSprite");
  const obstacleSprite = document.getElementById("obstacleSprite");
  const btnPlayAgain = document.getElementById("btnPlayAgain");
  const btnMainMenu = document.getElementById("btnMainMenu");

  function startCountdownTimer(seconds) {
    let timer = seconds;
    const countdownElement = document.getElementById("countdownTimer");

    const countdownInterval = setInterval(function () {
      countdownElement.textContent = timer;
      timer--;

      if (timer < 0) {
        clearInterval(countdownInterval);
        // Do something when the countdown reaches 0, e.g., close the modal
        const bootstrapModal = new bootstrap.Modal(
          document.getElementById("gameOverModal")
        );
        bootstrapModal.hide();
        location.href = "/";
      }
    }, 1000);
  }

  document.addEventListener("keydown", () => {
    if (!isMuted && !isPaused) {
      playBackgroundMusic();
    }
  });

  document.addEventListener("click", () => {
    if (!isMuted && !isPaused) {
      playBackgroundMusic();
    }
  });
  btnPause.addEventListener("click", togglePause);
  btnMute.addEventListener("click", toggleMute);
  btnExit.addEventListener("click", exit);
  btnCancelExit.addEventListener("click", cancelExit);
  btnConfirmExit.addEventListener("click", confirmExit);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  let validDifficulties = ["easy", "medium", "hard"];
  const selectedDifficulty = getQueryParam();

  if (validDifficulties.includes(selectedDifficulty)) {
    console.log(`Valid difficulty: ${selectedDifficulty}`);
    adjustRecalculationInterval(selectedDifficulty);
  } else {
    console.log(`Not valid difficulty: ${selectedDifficulty}`);
    adjustRecalculationInterval("easy");
  }
  async function isLoggedIn() {
    try {
      const userRole = await getRoleFromUrl();

      if (userRole === "guest") {
        return; // No further action needed for guest users
      }

      const response = await fetch("/check-login-status");
      const data = await response.json();

      if (data.success) {
        console.log("User is logged in");
      } else {
        console.log("User is not logged in, redirecting to the home page");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  }

  function hideLoadingScreen() {
    loadingOverlay.style.display = "none";
  }
  function playBackgroundMusic() {
    if (getRoleFromUrl() === "guest") {
      // Assuming backgroundMusic is a pre-defined audio element
      const userVolume = localStorage.getItem("userVolume");

      // Set the volume based on the user's stored preference or default to 100%
      backgroundMusic.volume = userVolume
        ? Math.min(1, Math.max(0, parseFloat(userVolume) / 100))
        : 1;

      // Check if the audio is not muted before playing
      if (!isMuted && !isPaused) {
        backgroundMusic.play();
      }
    } else if (getRoleFromUrl() === "registered") {
      // Make a request to get the volume for registered users
      fetch("/get-volume")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          // Assuming the server returns the volume in the 'volume' field
          const serverVolume = data.volume;

          // Use the received volume data for registered users
          console.log("Registered User Volume:", serverVolume);

          // Set the volume of backgroundMusic based on the server response
          backgroundMusic.volume = Math.min(
            1,
            Math.max(0, parseFloat(serverVolume) / 100)
          );
        })
        .catch((error) => {
          console.error(
            "Error fetching volume for registered user:",
            error.message
          );
        });
    }

    // Check if the audio is not muted before playing
    if (!isMuted) {
      backgroundMusic.play();
    }
  }

  function playClickSound() {
    if (!isMuted) {
      clickMusic.play();
    }
  }

  function playCollisionSound() {
    if (!isMuted) {
      collisionMusic.play();
    }
  }

  function playWormMovementSound() {
    if (!isMuted) {
      wormMovementMusic.play();
    }
  }

  function playGameOverMusic() {
    if (!isMuted) {
      gameOverMusic.play();
    }
  }

  function playTapSound() {
    if (!isMuted) {
      tapMusic.play();
    }
  }

  function resetVolume() {
    clickMusic.volume = 100 / 100;
    tapMusic.volume = 100 / 100;
    wormMovementMusic.volume = 100 / 100;
    collisionMusic.volume = 100 / 100;
    gameOverMusic.volume = 100 / 100;
  }

  function adjustRecalculationInterval(difficulty) {
    switch (difficulty) {
      case "easy":
        recalculationInterval = DEFAULT_RECALCULATION_INTERVAL * 2;
        break;
      case "medium":
        recalculationInterval = DEFAULT_RECALCULATION_INTERVAL;
        break;
      case "hard":
        recalculationInterval = DEFAULT_RECALCULATION_INTERVAL;
        // Math.floor(DEFAULT_RECALCULATION_INTERVAL / 2);
        break;
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, pause the game
      if (!isPaused && !isGameOver) {
        togglePause();
        backgroundMusic.pause();
        console.log("Game Paused");
      }
    } else {
      // Page is visible, do not automatically resume the game
      console.log("Game is paused. Press the 'Resume' button to continue.");
    }
  }
  function exit() {
    playClickSound();

    exitConfirmationModal.show();
  }

  function cancelExit() {
    playClickSound();
  }

  function confirmExit() {
    playClickSound();

    const difficulty = getQueryParam();
    const gameOverTime = timer;
    const currentScore = score;

    if (getRoleFromUrl === "registered")
      submitScore(difficulty, currentScore, gameOverTime);

    exitConfirmationModal.hide();
    window.location.href = "/";
  }
  function toggleMute() {
    playClickSound(); // Assuming this function plays a click sound

    const muteIconPath =
      '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 576 512"><path d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z"/></svg>';
    const unmuteIconPath =
      '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 640 512"><path d="M533.6 32.5C598.5 85.2 640 165.8 640 256s-41.5 170.7-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"/></svg>';

    isMuted = !isMuted; // Toggle the mute state

    if (isMuted) {
      backgroundMusic.volume = 0;
      clickMusic.volume = 0;
      tapMusic.volume = 0;
      wormMovementMusic.volume = 0;
      collisionMusic.volume = 0;
      gameOverMusic.volume = 0;
      btnMute.innerHTML = unmuteIconPath;
    } else {
      btnMute.innerHTML = muteIconPath;
      playBackgroundMusic();
      resetVolume();
    }
  }

  function togglePause() {
    playClickSound();
    const pauseIconPath =
      '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 320 512"><path d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"/></svg>';
    const resumeIconPath =
      '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 384 512"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>';

    isPaused = !isPaused; // Toggle the pause state
    if (isPaused) {
      backgroundMusic.pause();
      wormMovementMusic.pause();

      btnPause.innerHTML = resumeIconPath;
      pausedSpeed = worm.speed;
      cancelAnimationFrame(requestAnimationFrame);
      displayStatusText = true; // Set the flag to display the status text
      render();
    } else {
      playBackgroundMusic();

      btnPause.innerHTML = pauseIconPath;
      worm.speed = pausedSpeed;

      displayStatusText = false;

      requestAnimationFrame(gameLoop);
    }
  }

  let audioFilesLoaded = 0;
  const totalAudioFiles = 6;

  const checkAudioFiles = () => {
    audioFilesLoaded++;
    console.log(audioFilesLoaded);

    if (audioFilesLoaded === totalAudioFiles) {
      canvas = document.getElementById("gameCanvas");
      ctx = canvas.getContext("2d");

      initializeGameObjects();
      initializeObstacles();
      window.addEventListener("keydown", handleKeyPress);

      if (!isPaused) {
        startTimer();
      }

      setInterval(() => {
        if (!isPaused) {
          decrementImmunityTime();
        }
      }, 1000);

      setInterval(() => {
        if (!isPaused && !isImmune) {
          increaseSpeedAndTime();
        }
      }, 1000);

      document.addEventListener("visibilitychange", handleVisibilityChange);
      adjustRecalculationInterval(selectedDifficulty);

      requestAnimationFrame(gameLoop);
      hideLoadingScreen();
    }
  };

  function setup() {
    if (!isLoggedIn()) {
      window.location.href = "/";
      return;
    }
    loadingOverlay.style.display = "flex";

    backgroundMusic.addEventListener("canplaythrough", checkAudioFiles);
    clickMusic.addEventListener("canplaythrough", checkAudioFiles);
    collisionMusic.addEventListener("canplaythrough", checkAudioFiles);
    wormMovementMusic.addEventListener("canplaythrough", checkAudioFiles);
    gameOverMusic.addEventListener("canplaythrough", checkAudioFiles);
    tapMusic.addEventListener("canplaythrough", checkAudioFiles);

    backgroundMusic.load();
    clickMusic.load();
    collisionMusic.load();
    wormMovementMusic.load();
    gameOverMusic.load();
    tapMusic.load();
  }

  function decrementImmunityTime() {
    if (!isPaused) {
      immunityTime = Math.max(0, immunityTime - 1);
      if (immunityTime === 0) {
        isImmune = false;
        if (timerInterval === undefined) {
          startTimer();
        }
      }
    }
  }

  function increaseSpeedAndTime() {
    if (!isPaused) {
      currentTime++;
      if (currentTime % SPEED_INCREASE_INTERVAL === 0) {
        // Make sure the worm's speed is not reduced below its default value
        worm.speed = Math.max(worm.speed + 10, DEFAULT_WORM_SPEED);
      }
    }
  }

  function startTimer() {
    // Set the initial timer value to 10 seconds
    timer = 10;

    // Reset the immunity flag
    isImmune = true;

    // Clear the previous timer interval
    clearInterval(timerInterval);

    // Set up a timer to decrement/increment the timer value every second
    timerInterval = setInterval(() => {
      if (isImmune && !isPaused) {
        // Only update the timer if not paused
        // If the apple is still immune, decrement the timer during the initial 10 seconds
        if (timer > 0) {
          timer--;
        } else {
          // If the initial 10 seconds are over, clear the interval and start counting upwards
          clearInterval(timerInterval);
          startCountingUp();
        }
      } else if (!isPaused) {
        // If the apple is not immune, increment the timer
        timer++;
      }
    }, 1000);
  }

  function startCountingUp() {
    if (!isPaused) {
      // Set up a timer to increment the timer value every second
      timerInterval = setInterval(() => {
        timer++;
      }, 1000);
    }
  }

  function initializeObstacles() {
    obstacles = [];
    const squareSize = 10 * OBSTACLE_SIZE; // Adjust the size of the square as needed

    const squareX = canvas.width / 2 - squareSize / 2;
    const squareY = canvas.height / 2 - squareSize / 2;

    for (let i = 0; i < NUM_OBSTACLES; i++) {
      let obstacleX, obstacleY;

      do {
        // Generate random obstacle coordinates within the grid boundaries
        obstacleX =
          Math.floor(Math.random() * (canvas.width / OBSTACLE_SIZE)) *
          OBSTACLE_SIZE;
        obstacleY =
          Math.floor(Math.random() * (canvas.height / OBSTACLE_SIZE)) *
          OBSTACLE_SIZE;
      } while (
        // Check if the obstacles are outside the square
        obstacleX >= squareX &&
        obstacleX < squareX + squareSize &&
        obstacleY >= squareY &&
        obstacleY < squareY + squareSize
      );

      obstacles.push({
        x: obstacleX,
        y: obstacleY,
        size: OBSTACLE_SIZE,
        color: "#0000FF",
      });
    }
  }

  function initializeGameObjects() {
    console.log("Initializing game objects...");

    // Reset game over flag
    isGameOver = false;

    // Set initial position for the worm and apple in the center
    const canvasCenterX = Math.floor(canvas.width / 2);
    const canvasCenterY = Math.floor(canvas.height / 2);

    const wormInitialX =
      canvasCenterX - (INITIAL_WORM_LENGTH - 1) * OBSTACLE_SIZE;
    const wormInitialY = canvasCenterY;

    worm = {
      x: wormInitialX,
      y: wormInitialY,
      size: 30,
      color: "#00FF00",
      speed: DEFAULT_WORM_SPEED,
    };

    // Initialize worm body
    wormBody = [];
    for (let i = 0; i < INITIAL_WORM_LENGTH; i++) {
      wormBody.push({ x: worm.x - i * worm.size, y: worm.y });
    }

    // Set initial position for the apple away from obstacles and worm
    const appleInitialX = canvasCenterX;
    const appleInitialY = canvasCenterY;

    do {
      apple = {
        x: appleInitialX,
        y: appleInitialY,
        size: 30,
        color: "#FF0000",
      };
    } while (isCollisionWithObstacles(apple) || isCollisionWithWorm(apple) || isCollisionWithApple());

    console.log("Game objects initialized.");
  }

  function isCollisionWithWorm(object) {
    // Check if the object collides with the worm's body
    for (let segment of wormBody) {
      if (
        object.x < segment.x + worm.size &&
        object.x + object.size > segment.x &&
        object.y < segment.y + worm.size &&
        object.y + object.size > segment.y
      ) {
        console.log("Collision with worm detected.");
        playCollisionSound();
        return true; // Collision detected
      }
    }
    return false; // No collision
  }

  function isCollisionWithObstacles(object) {
    for (let obstacle of obstacles) {
      if (
        object.x < obstacle.x + obstacle.size &&
        object.x + object.size > obstacle.x &&
        object.y < obstacle.y + obstacle.size &&
        object.y + object.size > obstacle.y
      ) {
        playCollisionSound();
        return true; // Collision detected
      }
    }
    return false; // No collision
  }
  function handleKeyPress(event) {
    playTapSound();
    // Arrow key codes: 37 (left), 38 (up), 39 (right), 40 (down)
    // "a": 65, "w": 87, "s": 83, "d": 68
    switch (event.keyCode) {
      case 37: // Left arrow
      case 65: // "a"
        moveApple(-OBSTACLE_SIZE, 0);
        break;
      case 38: // Up arrow
      case 87: // "w"
        moveApple(0, -OBSTACLE_SIZE);
        break;
      case 39: // Right arrow
      case 68: // "d"
        moveApple(OBSTACLE_SIZE, 0);
        break;
      case 40: // Down arrow
      case 83: // "s"
        moveApple(0, OBSTACLE_SIZE);
        break;
      case 77: // "m" - Mute shortcut key
        toggleMute();
        break;
      case 27: // Escape key - Exit shortcut key
        exit();
        break;
      case 80: // "p" - Pause shortcut key
        togglePause();
        break;
    }
  }

  function moveApple(dx, dy) {
    // Move the apple, checking for collisions with obstacles
    let newAppleX = apple.x + dx;
    let newAppleY = apple.y + dy;

    // Ensure that the new position is within the canvas boundaries
    if (
      newAppleX < 0 ||
      newAppleX + apple.size > canvas.width ||
      newAppleY < 0 ||
      newAppleY + apple.size > canvas.height
    ) {
      // The apple is attempting to move outside the canvas boundaries
      playCollisionSound();
      return; // Do not update the apple's position
    }

    // Ensure that the new position is aligned with the grid
    newAppleX = Math.floor(newAppleX / OBSTACLE_SIZE) * OBSTACLE_SIZE;
    newAppleY = Math.floor(newAppleY / OBSTACLE_SIZE) * OBSTACLE_SIZE;

    // Check for collisions with obstacles before updating the apple's position
    if (
      !isCollisionWithObstacles({
        x: newAppleX,
        y: newAppleY,
        size: apple.size,
      })
    ) {
      apple.x = newAppleX;
      apple.y = newAppleY;
    }
  }

  let frameCount = 0; // Add this variable to track the number of frames

  function gameLoop(currentTime) {
    if (!lastFrameTime) {
      lastFrameTime = currentTime;
    }

    const deltaTime = (currentTime - lastFrameTime) / 1000; // Calculate deltaTime in seconds

    if (isPaused) {
      // If the game is paused, don't proceed with the game logic
      requestAnimationFrame(gameLoop); // Continue waiting for resume
      return;
    }

    frameCount++;

    // if (frameCount % recalculationInterval === 0) {
    //   // Recalculate the path at the adjusted interval
    //   path = calculatePath(worm, apple, obstacles);
    // }

    if (isImmunityTimeElapsed()) {
      if (path.length === 0) {
        // Calculate the initial path when immunity time elapses
        path = calculatePath(worm, apple, obstacles);

        // Check if a new path was found
        if (path.length === 0) {
          // No path found, regenerate the apple position and continue
          console.error("No path found!");
        }
      }

      moveWorm(deltaTime); // Pass deltaTime to moveWorm
      checkCollision();

      // Update the score every SCORE_UPDATE_INTERVAL seconds
      if (currentTime - lastScoreUpdateTime >= SCORE_UPDATE_INTERVAL * 1000) {
        score +=
          scoreIncrementPerSecond * getDifficultyMultiplier(selectedDifficulty);

        console.log("Score: " + score);
        lastScoreUpdateTime = currentTime; // Update the last score update time
      }
    }

    render();

    lastFrameTime = currentTime; // Update lastFrameTime

    requestAnimationFrame(gameLoop);
  }

  function getDifficultyMultiplier(difficulty) {
    console.log("Get Difficulty: " + difficulty);
    switch (difficulty) {
      case "easy":
        return 1; // Example: Lower multiplier for easy difficulty
      case "medium":
        return 1.25; // Use the default multiplier for medium difficulty
      case "hard":
        return 1.5; // Example: Higher multiplier for hard difficulty
      // Add more cases as needed
    }
  }

  frameCount = 0;
  let path = []; // Path for the worm to follow

  function moveWorm(deltaTime) {
    let difficulty = getQueryParam();
    if (!isPaused) {
      playWormMovementSound();
      // Only move the worm if the game is not paused
      // Store the last position of the head
      const lastHeadPosition = { x: worm.x, y: worm.y };

      if (path.length > 0) {
        const speedMultiplier = getDifficultyMultiplier(difficulty);
        const speed = worm.speed * speedMultiplier; // Adjust speed based on difficulty
        console.log(speed);
        // Move the worm along the path at a variable speed
        const dx = path[0].x - worm.x;
        const dy = path[0].y - worm.y;

        const distanceToTravel = speed * deltaTime;

        // Calculate the distance to the destination
        const distanceToDestination = Math.sqrt(dx * dx + dy * dy);

        // Check if the worm has reached the destination
        if (distanceToTravel >= distanceToDestination) {
          // Move the worm to the destination directly
          worm.x = path[0].x;
          worm.y = path[0].y;
          // Remove the reached node from the path
          path.shift();
        } else {
          // Interpolate the worm's position
          const interpolationFactor = distanceToTravel / distanceToDestination;
          worm.x += dx * interpolationFactor;
          worm.y += dy * interpolationFactor;
        }

        // Move the worm's body
        for (let i = wormBody.length - 1; i > 0; i--) {
          wormBody[i] = { ...wormBody[i - 1] };
        }

        wormBody[0] = lastHeadPosition; // Update the first segment of the body

        // Check if the worm has reached the apple
        // if (isCollisionWithApple()) {
        //   console.log("Collision with Apple Detected");
        //   endGame();
        // }
      } else {
        // No valid path found, handle accordingly (recalculate path, stop the worm, etc.)
        console.error("No valid path found!");
        // Example: Recalculate the path
        path = calculatePath(worm, apple, obstacles);
      }
    }
  }

  function calculatePath(start, target, obstacles) {
    const gridWidth = Math.floor(canvas.width / OBSTACLE_SIZE);
    const gridHeight = Math.floor(canvas.height / OBSTACLE_SIZE);
    const grid = new PF.Grid(gridWidth, gridHeight);

    for (let obstacle of obstacles) {
      const obstacleX = Math.floor(obstacle.x / OBSTACLE_SIZE);
      const obstacleY = Math.floor(obstacle.y / OBSTACLE_SIZE);

      if (
        obstacleX >= 0 &&
        obstacleX < gridWidth &&
        obstacleY >= 0 &&
        obstacleY < gridHeight
      ) {
        grid.setWalkableAt(obstacleX, obstacleY, false);
      }
    }

    const finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true,
      heuristic: PF.Heuristic.euclidean,
    });

    try {
      const pathNodes = finder.findPath(
        Math.floor(start.x / OBSTACLE_SIZE),
        Math.floor(start.y / OBSTACLE_SIZE),
        Math.floor(target.x / OBSTACLE_SIZE),
        Math.floor(target.y / OBSTACLE_SIZE),
        grid
      );

      if (pathNodes.length > 0) {
        const path = convertPathNodesToCoordinates(pathNodes);
        return path;
      } else {
        console.error("No valid path found. Recalculating...");

        // Recalculate the path using a different method or strategy
        const newPath = recalculatePath(start, target, obstacles);

        if (newPath.length > 0) {
          console.log("New path found after recalculation.");
          return newPath;
        } else {
          console.error("Still no valid path after recalculation.");
          return [];
        }
      }
    } catch (error) {
      // Handle any errors that occur during pathfinding
      console.error("Error in calculatePath:", error);
      return [];
    }
  }

  function recalculatePath(start, target, obstacles) {
    // Implement your own logic for recalculating the path here
    // You might use a different pathfinding algorithm or adjust parameters
    // Example: You can use the same logic with allowDiagonal: false for a different attempt
    const recalculationFinder = new PF.AStarFinder({
      allowDiagonal: false,
      dontCrossCorners: true,
    });

    try {
      const recalculationNodes = recalculationFinder.findPath(
        Math.floor(start.x / OBSTACLE_SIZE),
        Math.floor(start.y / OBSTACLE_SIZE),
        Math.floor(target.x / OBSTACLE_SIZE),
        Math.floor(target.y / OBSTACLE_SIZE),
        new PF.Grid(
          Math.floor(canvas.width / OBSTACLE_SIZE),
          Math.floor(canvas.height / OBSTACLE_SIZE)
        )
      );

      if (recalculationNodes.length > 0) {
        return convertPathNodesToCoordinates(recalculationNodes);
      } else {
        console.error("No valid path found after recalculation.");
        return [];
      }
    } catch (error) {
      console.error("Error in recalculatePath:", error);
      return [];
    }
  }

  function convertPathNodesToCoordinates(pathNodes) {
    return pathNodes.map((node) => ({
      x: node[0] * OBSTACLE_SIZE,
      y: node[1] * OBSTACLE_SIZE,
    }));
  }

  function checkCollision() {
    if (!isImmune && isCollisionWithApple() && isImmunityTimeElapsed()) {
      endGame();
    }
  }

  function isCollisionWithApple() {
    return (
      worm.x < apple.x + apple.size &&
      worm.x + worm.size > apple.x &&
      worm.y < apple.y + apple.size &&
      worm.y + worm.size > apple.y
    );
  }

  function isImmunityTimeElapsed() {
    return immunityTime === 0;
  }
  function endGame() {
    togglePause();
    wormMovementMusic.pause();
    backgroundMusic.pause();
    playGameOverMusic();

    const gameOverScore = document.getElementById("gameOverScore");
    const gameOverDifficulty = document.getElementById("gameOverDifficulty");
    const gameOverTime = document.getElementById("gameOverTime");
    const difficulty = getQueryParam();
    const timeLength = timer;
    const currentScore = score;

    gameOverScore.textContent = currentScore;
    gameOverDifficulty.textContent = difficulty;

    // Format the time as "00:00"
    const formattedTime = formatTime(timeLength);
    gameOverTime.textContent = formattedTime;

    gameOverModal.show();
    startCountdownTimer(10);

    if (getRoleFromUrl === "registered")
      submitScore(difficulty, currentScore, timeLength);

    btnPause.disabled = true;
    btnMute.disabled = true;
    btnExit.disabled = true;

    apple = null;
    worm = null;
    wormBody = [];
    obstacles = [];
    immunityTime = IMMUNITY_TIME;
    isImmune = true;
    currentTime = 0;
    isGameOver = false;
    isPaused = false;
    displayStatusText = false;
    score = 0;
    lastScoreUpdateTime = 0;
    isMuted = false;

    clearInterval(timer);
    clearInterval(recalculationInterval);

    wormSprites.top = [];
    wormSprites.left = [];
    wormSprites.down = [];
    wormSprites.right = [];
  }

  // Function to format time as "00:00"
  function formatTime(timeInSeconds) {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    const formattedHours = padZero(hours);
    const formattedMinutes = padZero(minutes);
    const formattedSeconds = padZero(seconds);

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  btnMainMenu.addEventListener("click", function () {
    playClickSound();
    gameOverModal.hide();
    window.location.href = "/";
  });

  btnPlayAgain.addEventListener("click", function () {
    btnPause.disabled = true;
    btnMute.disabled = true;
    btnExit.disabled = true;

    location.reload();
  });

  function submitScore(difficulty, score, timeLength) {
    const userRole = getRoleFromUrl();

    if (userRole === null) {
      console.error("Player is guest, cannot submit score");
      return;
    }

    // Make a POST request to submit the score
    fetch("/submit-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: userRole,
        difficulty: difficulty,
        score: score,
        timeLength: timeLength,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        // Handle the response as needed
        // For example, you can redirect the user or display a success message
      })
      .catch((error) => console.error("Error submitting score:", error));
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#212529";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#555555"; // Color for canvas border
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#555555"; // Color of the gridlines
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += OBSTACLE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += OBSTACLE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = "#6c757d"; // Dark gray color for obstacles
    for (let obstacle of obstacles) {
      ctx.drawImage(
        obstacleSprite,
        obstacle.x,
        obstacle.y,
        obstacle.size,
        obstacle.size
      );
    }

    if (isImmune && immunityTime % 2 === 0) {
      // ctx.fillStyle = "#FFFF00"; // Blinking color (e.g., yellow)
      ctx.drawImage(
        yellowAppleSprite,
        apple.x,
        apple.y,
        apple.size,
        apple.size
      );
    } else {
      ctx.drawImage(redAppleSprite, apple.x, apple.y, apple.size, apple.size);
      // ctx.fillStyle = "#dc3545"; // Red color for apple
    }
    // ctx.beginPath();
    // ctx.arc(
    //   apple.x + apple.size / 2,
    //   apple.y + apple.size / 2,
    //   apple.size / 2,
    //   0,
    //   2 * Math.PI
    // );
    // ctx.fill();

    // ctx.fillStyle = "#28a745"; // Green color for worm
    // for (let segment of wormBody) {
    //   ctx.fillRect(segment.x, segment.y, worm.size, worm.size);
    // }

    const wormSprite = getWormSprite();
    ctx.drawImage(wormSprite, worm.x, worm.y, worm.size, worm.size);

    ctx.fillStyle = "#ffffff"; // Timer color (white)
    ctx.font = "20px Arial";

    const hours = Math.floor(timer / 3600);
    const minutes = Math.floor((timer % 3600) / 60);
    const seconds = timer % 60;

    const formattedTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(
      seconds
    )}`;
    ctx.fillText("Time: " + formattedTime, 10, 20);

    ctx.fillStyle = "#ffffff"; // Score color (white)
    ctx.font = "20px Arial";
    const renderedScore = isNaN(score)
      ? "Score: N/A"
      : "Score: " + Math.floor(score);
    const scoreTextWidth = ctx.measureText(renderedScore).width;
    ctx.fillText(renderedScore, canvas.width - scoreTextWidth - 10, 20);

    if (displayStatusText) {
      ctx.fillStyle = "#ffffff"; // Status text color (e.g., red)
      ctx.font = "30px Arial";
      ctx.fillText("Game Paused", canvas.width / 2 - 100, canvas.height / 2);
    }
  }

  let spriteIndex = 0; // Add this variable to track the current sprite index
  let frameCounter = 0; // Add this variable to count frames

  function getWormSprite() {
    if (path.length > 0) {
      const dx = path[0].x - worm.x;
      const dy = path[0].y - worm.y;

      let directionArray;
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement
        directionArray = dx > 0 ? wormSprites.right : wormSprites.left;
      } else {
        // Vertical movement
        directionArray = dy > 0 ? wormSprites.down : wormSprites.top;
      }

      // Update the frame counter
      frameCounter++;
      // Change sprite every 15 frames for a slower animation
      const framesPerSprite = 15;
      if (frameCounter % framesPerSprite === 0) {
        // Increment the sprite index
        spriteIndex = (spriteIndex + 1) % directionArray.length;
      }
      return directionArray[spriteIndex];
    } else {
      // Default sprite when no path is available
      return wormSprites.top[0];
    }
  }

  function padZero(num) {
    return num < 10 ? "0" + num : num;
  }

  function getQueryParam() {
    const pathArray = window.location.pathname.split("/");
    const difficultyIndex = pathArray.indexOf("game") + 2; // Assuming difficulty is always two levels after "game"
    const difficultyWithColon =
      difficultyIndex >= 0 && difficultyIndex < pathArray.length
        ? pathArray[difficultyIndex]
        : null;

    const difficulty = difficultyWithColon
      ? difficultyWithColon.replace(":", "")
      : null;

    return difficulty;
  }

  function getRoleFromUrl() {
    const url = window.location.pathname; // Get the current path
    const parts = url.split("/"); // Split the path into parts
    const roleIndex = parts.indexOf("game") + 1; // Find the index of 'game' and add 1 to get the role
    return roleIndex < parts.length ? parts[roleIndex] : null; // Return the role if found, otherwise null
  }

  window.onload = setup;
});
