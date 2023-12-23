document.addEventListener("DOMContentLoaded", function () {
  // Constants
  const SPEED_INCREASE_INTERVAL = 60;
  const INITIAL_WORM_LENGTH = 3;
  const OBSTACLE_SIZE = 30;
  const NUM_OBSTACLES = 100;
  const IMMUNITY_TIME = 10;
  const PATH_RECALCULATION_INTERVAL = 60;
  const DEFAULT_WORM_SPEED = 1;
  const DEFAULT_RECALCULATION_INTERVAL = 120; // Default interval in frames

  // Variables
  let canvas, ctx, apple, worm, wormBody, timer, btnPause;
  let obstacles = [];
  let immunityTime = IMMUNITY_TIME;
  let isImmune = true;
  let timerInterval;
  let isGameOver = false;
  let currentTime = 0;
  let isPaused = false;
  let isPageVisible = true;
  let displayStatusText = false;
  let lastFrameTime; // Declare lastFrameTime at a higher scope
  let score = 0;
  let difficulty = selectedDifficulty;
  let recalculationInterval = DEFAULT_RECALCULATION_INTERVAL;

  btnPause = document.getElementById("btnPause");
  btnPause.addEventListener("click", togglePause);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  function adjustRecalculationInterval(difficulty) {
    switch (difficulty) {
      case "easy":
        recalculationInterval = DEFAULT_RECALCULATION_INTERVAL * 2; // Example: Double the interval for easy
        break;
      case "medium":
        recalculationInterval = DEFAULT_RECALCULATION_INTERVAL; // Use the default interval for medium
        break;
      case "hard":
        recalculationInterval = Math.floor(DEFAULT_RECALCULATION_INTERVAL / 2); // Example: Halve the interval for hard
        break;
      // Add more cases as needed
    }
    console.log(
      `Recalculation Interval adjusted for ${difficulty} difficulty: ${recalculationInterval}`
    );
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, pause the game
      if (!isPaused && !isGameOver) {
        togglePause();
        console.log("Game Paused");
      }
    } else {
      // Page is visible, do not automatically resume the game
      console.log("Game is paused. Press the 'Resume' button to continue.");
    }
  }
  function togglePause() {
    isPaused = !isPaused; // Toggle the pause state

    if (isPaused) {
      btnPause.textContent = "Resume";

      // If paused, store the current speed
      pausedSpeed = worm.speed;
      console.log("Paused Speed: " + worm.speed);
      cancelAnimationFrame(requestAnimationFrame);
      displayStatusText = true; // Set the flag to display the status text
      render();
    } else {
      btnPause.textContent = "Pause";
      // If resumed, restore the stored speed and restart the game loop
      worm.speed = pausedSpeed;
      console.log("Resumed Speed: " + worm.speed);

      // Reset the displayStatusText flag when resuming
      displayStatusText = false;

      requestAnimationFrame(gameLoop);
    }
  }

  function setup() {
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

    // Add event listener for visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange);
    adjustRecalculationInterval(selectedDifficulty);

    requestAnimationFrame(gameLoop);
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
        worm.speed = Math.max(worm.speed + 0.5, DEFAULT_WORM_SPEED);
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
      console.log(`Obstacle at: ${obstacleX} ${obstacleY}`);
    }
  }

  function initializeGameObjects() {
    console.log("Initializing game objects...");

    // Reset game over flag
    isGameOver = false;

    // Set initial position for the worm inside the empty square
    const squareSize = 10 * OBSTACLE_SIZE;
    const squareX = canvas.width / 2 - squareSize / 2;
    const squareY = canvas.height / 2 - squareSize / 2;

    // Set the worm's speed to its default value
    worm = {
      x:
        Math.floor(Math.random() * (canvas.width / OBSTACLE_SIZE)) *
        OBSTACLE_SIZE,
      y:
        Math.floor(Math.random() * (canvas.height / OBSTACLE_SIZE)) *
        OBSTACLE_SIZE,
      size: 30,
      color: "#00FF00",
      speed: DEFAULT_WORM_SPEED, // Set the speed to the default value
    };

    // Initialize worm body
    wormBody = [];
    for (let i = 0; i < INITIAL_WORM_LENGTH; i++) {
      wormBody.push({ x: worm.x - i * worm.size, y: worm.y });
    }

    // Set initial position for the apple away from obstacles and worm
    do {
      apple = {
        x:
          Math.floor(Math.random() * (canvas.width / OBSTACLE_SIZE)) *
          OBSTACLE_SIZE,
        y:
          Math.floor(Math.random() * (canvas.height / OBSTACLE_SIZE)) *
          OBSTACLE_SIZE,
        size: 30,
        color: "#FF0000",
      };
    } while (
      isCollisionWithObstacles(apple) ||
      isCollisionWithWorm(apple) ||
      isCollisionWithApple() // Call isCollisionWithApple after apple is assigned
    );

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
        return true; // Collision detected
        console.log("Collision with obstacle detected");
      }
    }
    return false; // No collision
  }

  // Inside the handleKeyPress function
  function handleKeyPress(event) {
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
      case 80: // "p" - Pause shortcut key
        togglePause();
        break;
    }

    // Wrap around the canvas after updating the apple's position
    wrapAroundCanvas(apple);
  }

  function wrapAroundCanvas(object) {
    // Wrap the object around the canvas if it goes beyond the boundaries
    if (object.x < 0) {
      object.x = canvas.width - object.size;
    } else if (object.x + object.size > canvas.width) {
      object.x = 0;
    }

    if (object.y < 0) {
      object.y = canvas.height - object.size;
    } else if (object.y + object.size > canvas.height) {
      object.y = 0;
    }
  }
  function moveApple(dx, dy) {
    // Move the apple, checking for collisions with obstacles
    let newAppleX = apple.x + dx;
    let newAppleY = apple.y + dy;

    // Wrap around the canvas if it goes beyond the boundaries
    if (newAppleX < 0) {
      newAppleX = canvas.width - apple.size;
    } else if (newAppleX + apple.size > canvas.width) {
      newAppleX = 0;
    }

    if (newAppleY < 0) {
      newAppleY = canvas.height - apple.size;
    } else if (newAppleY + apple.size > canvas.height) {
      newAppleY = 0;
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

    if (frameCount % recalculationInterval === 0) {
      // Recalculate the path at the adjusted interval
      path = calculatePath(worm, apple, obstacles);
    }

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
    }

    render();

    lastFrameTime = currentTime; // Update lastFrameTime

    requestAnimationFrame(gameLoop);

    // Reset frameCount at the end of each frame
  }

  frameCount = 0;
  let path = []; // Path for the worm to follow
  let lastPathCalculationTime = 0; // Variable to track the last time the path was calculated

  function moveWorm(deltaTime) {
    if (!isPaused) {
      // Only move the worm if the game is not paused
      // Store the last position of the head
      const lastHeadPosition = { x: worm.x, y: worm.y };

      if (path.length > 0) {
        // Move the worm along the path at a variable speed
        const speed = worm.speed; // Use the worm's speed
        const dx = (path[0].x - worm.x) * speed;
        const dy = (path[0].y - worm.y) * speed;

        const multiplier = 5;
        worm.x += dx * deltaTime * multiplier;
        worm.y += dy * deltaTime * multiplier;

        // Move the worm's body
        for (let i = wormBody.length - 1; i > 0; i--) {
          wormBody[i] = { ...wormBody[i - 1] };
        }

        wormBody[0] = lastHeadPosition; // Update the first segment of the body

        // Check if the worm has reached the destination node
        if (
          Math.abs(worm.x - path[0].x) < 1 &&
          Math.abs(worm.y - path[0].y) < 1
        ) {
          // Remove the reached node from the path
          path.shift();
        }

        // Check if the worm has reached the apple
        if (isCollisionWithApple()) {
          console.log("Collision with Apple Detected");
          endGame();
        }
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
      console.log("Collision with Apple Detected");
      endGame();
      // Handle collision with apple, e.g., increase score or perform other actions
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
    console.log("Game Over");
    alert("Game Over");

    // Clear the timer interval
    clearInterval(timerInterval);

    // Reset the game state after the alert is closed
    console.log("Resetting game state...");
    immunityTime = IMMUNITY_TIME;
    isImmune = true;

    // Reset the path variable
    path = [];

    // Reset the worm's speed to its default value
    worm.speed = DEFAULT_WORM_SPEED; // Set it to your default speed value

    // Reset variables for a new game
    worm = null; // Reset or reinitialize worm
    wormBody = [];
    apple = null; // Reset or reinitialize apple
    obstacles = [];
    clearInterval(timerInterval);
    immunityTime = IMMUNITY_TIME;
    isImmune = true;
    isGameOver = false;
    path = [];
    lastPathCalculationTime = 0;
    isPaused = false;
    isPageVisible = true;
    displayStatusText = false;
    lastFrameTime = null;
    currentTime = 0;
    frameCount = 0;
    initializeGameObjects();
    initializeObstacles();

    // Reset the timer and start it again
    startTimer();

    // Log the new positions of the worm and apple after resetting the game state
    console.log("Worm position after reset:", worm.x, worm.y);
    console.log("Apple position after reset:", apple.x, apple.y);
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render gridlines
    ctx.strokeStyle = "#CCCCCC"; // Color of the gridlines
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

    // Render obstacles
    ctx.fillStyle = "#0000FF";
    for (let obstacle of obstacles) {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.size, obstacle.size);
    }

    // Render apple with blinking effect
    if (isImmune && immunityTime % 2 === 0) {
      ctx.fillStyle = "#FFFF00"; // Blinking color (e.g., yellow)
    } else {
      ctx.fillStyle = apple.color;
    }
    ctx.fillRect(apple.x, apple.y, apple.size, apple.size);

    // Render worm
    ctx.fillStyle = worm.color;
    for (let segment of wormBody) {
      ctx.fillRect(segment.x, segment.y, worm.size, worm.size);
    }

    // Render timer on the canvas
    ctx.fillStyle = "#000000"; // Timer color
    ctx.font = "20px Arial";

    // Convert timer to hh:mm:ss format
    const hours = Math.floor(timer / 3600);
    const minutes = Math.floor((timer % 3600) / 60);
    const seconds = timer % 60;

    // Display the formatted time
    const formattedTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(
      seconds
    )}`;
    ctx.fillText("Time: " + formattedTime, 10, 20);

    // Render score on the canvas (on the right side of the timer)
    ctx.fillStyle = "#000000"; // Score color
    ctx.font = "20px Arial";
    const scoreText = "Score: " + score;
    const scoreTextWidth = ctx.measureText(scoreText).width;
    ctx.fillText(scoreText, canvas.width - scoreTextWidth - 10, 20);

    // Render status text if the game is paused
    if (displayStatusText) {
      ctx.fillStyle = "000000"; // Status text color (e.g., red)
      ctx.font = "30px Arial";
      ctx.fillText("Game Paused", canvas.width / 2 - 100, canvas.height / 2);
    }
  }

  // Helper function to pad single digits with a leading zero
  function padZero(num) {
    return num < 10 ? "0" + num : num;
  }

  window.onload = setup;
});
