const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
  // Apply CORS middleware
app.use(cors())
app.use(express.json());

// Enable CORS for all routes

// Define the path to the Audio folder
const audioFolderPath = path.join(__dirname, "audio");

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the Audio folder
app.use("/Api/GuesssApi/Audio", express.static(audioFolderPath));

// API route to serve the MP3 file (as a fallback)
app.get("/Api/GuesssApi/Audio/:audioName", (req, res) => {
  const audioName = req.params.audioName;
  const audioPath = path.join(audioFolderPath, `${audioName}.mp3`);

  // Check if the file exists and serve it
  fs.access(audioPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File not found: ${audioPath}`);
      return res.status(404).send("Audio file not found!");
    }
    res.sendFile(audioPath, (err) => {
      if (err) {
        console.error(`Error sending file: ${err}`);
        res.status(500).send("Error serving audio file");
      }
    });
  });
});

const dataFolderPath = path.join(__dirname, "data");

// API route to return a random JSON file
app.get('/Api/GuesssApi/RandomWords', (req, res) => {
    // Read the list of files in the data folder
    fs.readdir(dataFolderPath, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading data directory');
        }

        // Filter JSON files
        const jsonFiles = files.filter(file => path.extname(file) === '.json');

        if (jsonFiles.length === 0) {
            return res.status(404).send('No JSON files found');
        }

        // Select a random JSON file
        const randomFile = jsonFiles[Math.floor(Math.random() * jsonFiles.length)];

        // Read and send the content of the random JSON file
        const randomFilePath = path.join(dataFolderPath, randomFile);
        fs.readFile(randomFilePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).send('Error reading JSON file');
            }

            try {
                const jsonData = JSON.parse(data);  // Parse the JSON content
                res.json(jsonData);  // Send the parsed JSON content as the response
            } catch (parseError) {
                res.status(500).send('Error parsing JSON file');
            }
        });
    });
});

// GET /leaderboard
app.get("/Api/GuesssApi/leaderboard", (req, res) => {
    const leaderboardPath = path.join(
        __dirname,
        "leaderboard/leaderboard.json"
      );
  fs.readFile(leaderboardPath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error reading leaderboard data" });
    }
    res.json(JSON.parse(data));
  });
});

// POST route to add data to the leaderboard
app.post("/api/guesssapi/leaderboard", (req, res) => {
  try {
    const leaderboardPath = path.join(
      __dirname,
      "leaderboard/leaderboard.json"
    );

    // Read the existing leaderboard (if it exists)
    fs.readFile(leaderboardPath, "utf8", (err, data) => {
      let leaderboard = [];
      if (!err && data) {
        leaderboard = JSON.parse(data);
      }

      // Add the new entry
      const newEntry = req.body;
      leaderboard.push(newEntry);

      // Write the updated leaderboard back to the file
      fs.writeFile(
        leaderboardPath,
        JSON.stringify(leaderboard, null, 2),
        (writeErr) => {
          if (writeErr) {
            return res
              .status(500)
              .json({ message: "Failed to write leaderboard data" });
          }

          res.status(200).json({ message: "Entry added successfully" });
        }
      );
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Audio folder path: ${audioFolderPath}`);
});
