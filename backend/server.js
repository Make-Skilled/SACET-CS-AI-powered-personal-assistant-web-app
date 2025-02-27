const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// AssemblyAI API configuration
const assemblyAPI = axios.create({
  baseURL: 'https://api.assemblyai.com/v2',
  headers: {
    authorization: process.env.ASSEMBLYAI_API_KEY,
    'content-type': 'application/json',
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB Atlas connection established successfully');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for handling audio files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/webm' || file.mimetype === 'audio/wav' || file.mimetype === 'audio/mp3') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Upload audio to AssemblyAI
const uploadAudioToAssembly = async (audioPath) => {
  try {
    const data = fs.readFileSync(audioPath);
    const upload = await assemblyAPI.post('/upload', data);
    return upload.data.upload_url;
  } catch (error) {
    console.error('Error uploading to AssemblyAI:', error);
    throw error;
  }
};

// Get transcription from AssemblyAI
const getTranscription = async (audioUrl) => {
  try {
    // Submit the audio file for transcription
    const response = await assemblyAPI.post('/transcript', {
      audio_url: audioUrl,
      language_code: 'en',
    });

    // Wait for transcription to complete
    const transcriptId = response.data.id;
    let transcript = null;

    while (!transcript || transcript.status !== 'completed') {
      const pollingResponse = await assemblyAPI.get(`/transcript/${transcriptId}`);
      transcript = pollingResponse.data;

      if (transcript.status === 'error') {
        throw new Error('Transcription failed: ' + transcript.error);
      }

      if (transcript.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before polling again
      }
    }

    return transcript.text;
  } catch (error) {
    console.error('Error getting transcription:', error);
    throw error;
  }
};

// Transcription Schema
const transcriptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  duration: { type: Number },
  fileSize: { type: Number },
  originalFilename: { type: String },
  audioPath: { type: String }
});

const Transcription = mongoose.model('Transcription', transcriptionSchema);

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: 'Error uploading file.' });
  }
  res.status(500).json({ error: err.message || 'Something went wrong!' });
};

// Routes
app.post('/api/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Get audio file details
    const fileSize = req.file.size;
    const originalFilename = req.file.originalname;
    const audioPath = req.file.path;

    // Upload to AssemblyAI and get transcription
    const uploadUrl = await uploadAudioToAssembly(audioPath);
    const transcriptionText = await getTranscription(uploadUrl);

    const transcription = new Transcription({
      text: transcriptionText,
      duration: 0,
      fileSize: fileSize,
      originalFilename: originalFilename,
      audioPath: audioPath
    });

    await transcription.save();

    res.json({ 
      success: true, 
      transcription: {
        id: transcription._id,
        text: transcriptionText,
        duration: transcription.duration,
        fileSize: transcription.fileSize,
        filename: originalFilename,
        createdAt: transcription.createdAt
      }
    });
  } catch (error) {
    // Clean up the uploaded file if there's an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    next(error);
  }
});

app.get('/api/transcriptions', async (req, res, next) => {
  try {
    const transcriptions = await Transcription.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-__v -audioPath');
    res.json(transcriptions);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/transcriptions', async (req, res, next) => {
  try {
    await Transcription.deleteMany({});
    // Also delete all audio files in uploads directory
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        console.error('Error reading uploads directory:', err);
        return;
      }
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        fs.unlink(filePath, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    });
    res.json({ success: true, message: 'All transcriptions cleared' });
  } catch (error) {
    next(error);
  }
});

// Cleanup old audio files periodically (every hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return;
    }
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error getting file stats:', err);
          return;
        }
        if (stats.mtime < oneHourAgo) {
          fs.unlink(filePath, err => {
            if (err) console.error('Error deleting old file:', err);
          });
        }
      });
    });
  });
}, 60 * 60 * 1000);

// Apply error handling middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
