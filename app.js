require('dotenv').config();

const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join(__dirname, 'uploads', 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log("Rollback delete:", err || "File removed successfully");
    });
  }
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "Unknown server error." });
});

let mongoUri;
if (process.env.MONGODB_URI) {
  mongoUri = process.env.MONGODB_URI;
} else if (process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
  const cluster = process.env.MONGODB_CLUSTER || 'cluster0.ntrwd.mongodb.net';
  mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${cluster}/${process.env.DB_NAME}?retryWrites=true&w=majority`;
} else {
  console.error('MongoDB configuration missing! Please check your .env file.');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB!');
    app.listen(5005);
    console.log('Server running on port 5005');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error('Please check your .env file and MongoDB configuration.');
  });

