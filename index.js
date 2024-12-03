const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const File = require('./models/File');  // Import the file model
const fs = require('fs');

const app = express();

//connection to mongo
const connect = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/fileUpload');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

connect();

// Check if uploads folder exists, create one
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Set up Multer for file storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');  // Files will be stored in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    const today = new Date();
    const billingCycle = 1;
    let formattedBilling = billingCycle < 10 ? billingCycle.toString().padStart(2, '0') : billingCycle;
    const startDate = today.toLocaleDateString('en-US', {day: '2-digit', month: '2-digit', year: 'numeric'}).replaceAll('/', '');
    today.setMonth(today.getMonth() + billingCycle);
    const endDate = today.toLocaleDateString('en-US', {day: '2-digit', month: '2-digit', year: 'numeric'}).replaceAll('/', '');
    
    const uniqueName = `${formattedBilling}${startDate}${endDate}`;
    cb(null, uniqueName);  // Unique file name
  },
});

//filter text/csv file type
const fileFilter = (req, file, cb) => {
  file.mimetype === 'text/plain' || file.mimetype === 'text/csv' ? cb(null, true) : cb(null, false);
}

const upload = multer({ fileFilter, storage });

// Route to upload a single file
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Error uploading file/Unsupported file type');
    }
      // Save file metadata to MongoDB
      const newFile = new File({
        filename: req.file.filename,
        path: req.file.path,
        originalName: req.file.originalname,
        size: req.file.size,
      });

      await newFile.save();

      res.status(200).send(`File uploaded successfully ${req.file.filename}`);
  } catch (err) {
    res.status(500).send('Error uploading file');
  }
});

// get method to view the files
app.get('/files', async (req, res) => {
  try {
    const files = await File.find();
    res.status(200).json(files);
  } catch (err) {
    res.status(500).send('Error fetching files');
  }
});

// server start
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}/`);
});
