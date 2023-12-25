require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const app = express();
const path = require("path");

const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/assets")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Increase MongoDB connection timeout
mongoose.connect(process.env.MONGODB_URI, {
  connectTimeoutMS: 30000, // 30 seconds timeout
});

const generateSecret = () => {
  // Generate a secure session secret using crypto
  const secret = crypto.randomBytes(64).toString("hex");
  return process.env.SESSION_SECRET || secret;
};

// Use a static session secret
app.use(
  session({
    secret: process.env.SESSION_SECRET || generateSecret(),
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Define User model
const { User, Score } = require("./db"); // Create a user model in a separate file

// Define Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Internal Server Error" });
});

app.get("/check-login-status", (req, res) => {
  if (req.isAuthenticated()) {
    // User is authenticated
    res.status(200).json({
      success: true,
      user: req.user,
      message: "User is logged in",
    });
  } else {
    // User is not authenticated
    res.status(200).json({
      success: false,
      message: "User is not logged in",
    });
  }
});

passport.use(
  new LocalStrategy(
    { usernameField: "username" },
    async (username, password, done) => {
      try {
        const user = await User.findOne({ username });

        if (!user) {
          // User not found
          return done(null, false, { message: "User not found" });
        }

        if (!user.validPassword(password)) {
          console.log("Incorrect password");
          // Invalid password
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (error) {
        console.error("Error during authentication: ", error);
        return done(error);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      console.error("Error during deserializeUser: ", err);
      done(err, null);
    });
});

app.post("/sign-in", (req, res, next) => {
  console.log("Sign-in request received");

  passport.authenticate("local", (err, user, info) => {
    console.log("Sign-in authentication completed");

    if (err) {
      console.error("Error during authentication:", err);
      return res
        .status(500)
        .json({ success: false, error: "Internal Server Error" });
    }

    if (!user) {
      // User not found or invalid password
      console.log("Invalid credentials:", info.message);
      return res.status(401).json({ success: false, error: info.message });
    }

    req.login(user, (err) => {
      if (err) {
        console.error("Error during login:", err);
        return res
          .status(500)
          .json({ success: false, error: "Internal Server Error" });
      }

      console.log("Sign In successful");

      // Log additional information if needed
      console.log("Authenticated User:", user);

      return res
        .status(200)
        .json({ success: true, message: "Sign In successful" });
    });
  })(req, res, next);
});

// Sign-up Route
app.post("/sign-up", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      console.error("Username already taken");
      return res
        .status(400)
        .json({ success: false, error: "Username is already taken" });
    }

    // Create a new user in the database
    const newUser = new User({ username, password });
    await newUser.save();

    // Log in the user after sign-up
    req.login(newUser, (err) => {
      if (err) {
        console.error("Error during login after sign-up: ", err);
        return res
          .status(500)
          .json({ success: false, error: "Internal Server Error" });
      }
      res.status(200).json({ success: true, message: "Sign Up successful" });
    });
  } catch (error) {
    console.error("Error during sign-up: ", error);
    res.status(400).json({ success: false, error: "Registration failed" });
  }
});

// Logout Route
app.post("/sign-out", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ success: false, error: "Logout failed" });
    }
    res.status(200).json({ success: true, message: "Sign Out successful" });
  });
});

// Protected Route Example
app.get("/profile", isAuthenticated, (req, res) => {
  // Only accessible to authenticated users
  res.status(200).json({ success: true, message: "Profile accessed" });
});

// Define the route for the homepage
app.get("/", (req, res) => {
  // Send the index.html file
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/leaderboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "leaderboard.html"));
});

app.get("/contact-us", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});

// Route for submitting the contact form
app.post("/submit-form", (req, res) => {
  const { name, email, message } = req.body;

  // Perform any necessary server-side validation here

  // Log form data to the console
  console.log("Received form submission:");
  console.log("Name:", name);
  console.log("Email:", email);
  console.log("Message:", message);

  // Send email using Nodemailer
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.CONTACT_EMAIL, // Replace with your contact email address
    subject: "New Contact Form Submission",
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    } else {
      console.log("Email sent: " + info.response);

      // Customize the response to the user
      const userResponse = `
              Hello ${name},

              Thank you for reaching out to Apple Chase: Worm Odyssey! We have received your message and will get back to you as soon as possible.

              Best regards,
              The Apple Chase Team
          `;

      // Send a personalized response to the user
      const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Thank You for Contacting Apple Chase: Worm Odyssey",
        text: userResponse,
      };

      transporter.sendMail(userMailOptions, (userMailError) => {
        if (userMailError) {
          console.error("Error sending user response email:", userMailError);
        }
      });

      res
        .status(200)
        .json({ success: true, message: "Form submitted successfully!" });
    }
  });
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/leaderboard/:difficulty?", async (req, res) => {
  try {
    const { difficulty } = req.params;

    // Build the query based on the provided difficulty
    const query = difficulty ? { difficulty } : {};

    // Use MongoDB aggregation to group by userId and find the max score for each user
    const leaderboardData = await Score.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$userId",
          highestScore: { $max: "$score" },
          time: { $first: "$timeLength" }, // Assuming timeLength is the correct field name
        },
      },
      {
        $lookup: {
          from: "users", // Assuming your user collection is named "users"
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          difficulty,
          score: "$highestScore",
          timeLength: "$time",
          userId: "$user",
        },
      },
      { $sort: { score: -1, timeLength: 1 } }, // Sort by score descending, time ascending
      { $limit: 10 }, // Limit to the top 10 scores
    ]);

    res.status(200).json({ success: true, leaderboard: leaderboardData });
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Define the route for the "/game" page
app.get("/game", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game.html"));
});

// Define the route for the "/game" page
app.get("/game/:role/:difficulty?", (req, res) => {
  const { role, difficulty } = req.params;

  if (
    role.toLowerCase() === "guest" ||
    role.toLocaleLowerCase() === "registered"
  ) {
    res.sendFile(path.join(__dirname, "public", "game.html"));
  } else {
    res.status(403).json({
      success: false,
      message:
        "Forbidden. Only guests or authenticated users are allowed to play.",
    });
  }
});

// Route for submitting a score
app.post("/submit-score", isAuthenticated, async (req, res) => {
  try {
    // Assuming the score details are sent in the request body
    const { difficulty, score, timeLength } = req.body;

    // Create a new Score document in the database
    const newScore = new Score({
      userId: req.user._id, // Assuming each score is associated with a user
      difficulty: difficulty,
      score: score,
      timeLength: timeLength,
      // Add any other relevant information to the Score model
    });

    await newScore.save();

    // You can also perform additional actions if needed

    res
      .status(200)
      .json({ success: true, message: "Score submitted successfully" });
  } catch (error) {
    console.error("Error during score submission: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Save settings route
app.post("/save-settings", isAuthenticated, async (req, res) => {
  console.log("Received save-settings request:", req.body);

  try {
    // Use the userId from the authenticated user
    const userId = req.user._id;

    const { username, volume /* other settings... */ } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Process and save volume data
    user.volume = volume;

    // If username is provided, update the username
    if (username !== null) {
      user.username = username;
    }

    await user.save();

    console.log("Settings saved successfully");
    return res.json({ success: true });
  } catch (error) {
    console.error("Error saving settings to the database:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

// Get route to retrieve user's volume settings
app.get("/get-volume", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const volume = user.volume || 0; // Assuming default volume is 0 if not set

    res.status(200).json({ success: true, volume });
  } catch (error) {
    console.error("Error fetching user volume:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Check Username Route
app.post("/check-username", isAuthenticated, async (req, res) => {
  const { newUsername } = req.body;

  try {
    // Check if the new username is unique
    const existingUser = await User.findOne({ username: newUsername });

    if (existingUser) {
      console.error("Username is already taken");
      return res
        .status(400)
        .json({ success: false, error: "Username is already taken" });
    }

    // If the username is unique, send success response
    res.status(200).json({ success: true, message: "Username is unique" });
  } catch (error) {
    console.error("Error checking username uniqueness: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Delete Account Route
app.delete("/delete-account", isAuthenticated, async (req, res) => {
  const userId = req.user._id;

  try {
    // Find and delete the user by ID
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      console.error("User not found");
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Optionally, you might want to perform additional cleanup or logging here

    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Update Volume Route
app.post("/update-volume", isAuthenticated, async (req, res) => {
  console.log("Received update-volume request:", req.body);

  try {
    // Use the userId from the authenticated user
    const userId = req.user._id;

    const { volume } = req.body;

    // Validate the incoming volume data as needed
    if (typeof volume !== "number" || volume < 1 || volume > 100) {
      console.log("Invalid volume format");
      return res
        .status(400)
        .json({ success: false, error: "Invalid volume format" });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Process and save volume data
    user.volume = volume;

    await user.save();

    console.log("Volume setting updated successfully");
    return res.json({ success: true });
  } catch (error) {
    console.error("Error updating volume setting to the database:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  console.error("Unauthorized access attempted");
  res.status(401).json({ success: false, error: "Unauthorized" });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
