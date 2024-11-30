const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const File = require('./models/File');  // Import the file model

const app = express();

// Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/fileUpload', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch((err) => {
//   console.error('Error connecting to MongoDB:', err);
// });

const connect = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/fileUpload', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

connect();

// Set up Multer for file storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');  // Files will be stored in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Unique file name
  },
});

const upload = multer({ storage: storage });

// Route to upload a single file
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    // Save file metadata to MongoDB
    const newFile = new File({
      filename: req.file.filename,
      path: req.file.path,
      originalName: req.file.originalname,
      size: req.file.size,
    });

    await newFile.save();

    res.status(200).send('File uploaded successfully');
  } catch (err) {
    res.status(500).send('Error uploading file');
  }
});

// Route to view uploaded files (optional)
app.get('/files', async (req, res) => {
  try {
    const files = await File.find();
    res.status(200).json(files);
  } catch (err) {
    res.status(500).send('Error fetching files');
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}/`);
});
