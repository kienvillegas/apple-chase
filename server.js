const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static("public"));

// Home Page Route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/game.html", (req, res) => {
  res.sendFile(__dirname + "public/game.html");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
