const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();

const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== 'NoryouHost-X-SmVzc2x5bjE3MTAyMDI0QnVubnk=') {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }
    next();
  };

// Enable CORS for all routes
app.use(cors());
// Define the path to the Audio folder
const audioFolderPath = path.join(__dirname, 'audio');

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the Audio folder
app.use('/Api/GuesssApi/Audio', express.static(audioFolderPath));

// API route to serve the MP3 file (as a fallback)
app.get('/Api/GuesssApi/Audio/:audioName', (req, res) => {
    const audioName = req.params.audioName;
    const audioPath = path.join(audioFolderPath, `${audioName}.mp3`);
    
    // Check if the file exists and serve it
    fs.access(audioPath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`File not found: ${audioPath}`);
            return res.status(404).send('Audio file not found!');
        }
        res.sendFile(audioPath, (err) => {
            if (err) {
                console.error(`Error sending file: ${err}`);
                res.status(500).send('Error serving audio file');
            }
        });
    });
});

const dataFolderPath = path.join(__dirname, 'data');

// API route to return a random JSON file
app.get('/Api/GuesssApi/RandomWords', (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== 'NoryouHost-X-SmVzc2x5bjE3MTAyMDI0QnVubnk=') {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }
    // Read the list of files in the data folder
    app.post('/leaderboard', async (req, res) => {
        try {
          const { Name, Corects, Incorects, TimeTaken, words } = req.body;
      
          if (!Name || typeof Corects !== 'number' || typeof Incorects !== 'number' || !TimeTaken || !Array.isArray(words)) {
            return res.status(400).json({ error: 'Invalid or missing fields in the request body' });
          }
      
          const newEntry = { Name, Corects, Incorects, TimeTaken, words };
      
          let leaderboard = [];
          try {
            const data = await fs.readFile('Leaderboard.json', 'utf8');
            leaderboard = JSON.parse(data);
          } catch (readError) {
            // If file doesn't exist or is empty, we'll start with an empty array
            console.log('Creating new leaderboard file');
          }
      
          leaderboard.push(newEntry);
      
          await fs.writeFile('Leaderboard.json', JSON.stringify(leaderboard, null, 2));
          res.status(201).json({ message: 'Data added successfully', entry: newEntry });
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: 'Error updating leaderboard data' });
        }
      });
});

  
  app.use(express.json());
  app.use(apiKeyMiddleware);
  
  // GET /leaderboard
  app.get('/Api/GuesssApi/leaderboard', (req, res) => {
    fs.readFile('Leaderboard.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error reading leaderboard data' });
      }
      res.json(JSON.parse(data));
    });
  });
  
  // POST /leaderboard
  app.post('/Api/GuesssApi/leaderboard', (req, res) => {
    const { Name, Corects, Incorects, TimeTaken, words } = req.body;
  
    if (!Name || !Corects || !Incorects || !TimeTaken || !words) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    fs.readFile('Leaderboard.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error reading leaderboard data' });
      }
  
      const leaderboard = JSON.parse(data);
      leaderboard.push({ Name, Corects, Incorects, TimeTaken, words });
  
      fs.writeFile('Leaderboard.json', JSON.stringify(leaderboard, null, 2), (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error writing leaderboard data' });
        }
        res.status(201).json({ message: 'Data added successfully' });
      });
    });
  });
  
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Audio folder path: ${audioFolderPath}`);
});