const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const compression = require('compression');
const xss = require('xss-clean');
const ytdl = require('ytdl-core');

// setting path for .env file
dotenv.config({ path: './config.env' });

// calling express function and store into a variable
const app = express();

// i) Implemented cors
app.use(cors());
app.options('*', cors());

// ii) Set security HTTP headers
app.use(helmet());

// iv) Limiting request from same IP (its help us from Bruteforce and DOS/DDOS attacks)
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from your IP, please try again in an hour.',
});
app.use('/api', limiter);

// v) Body parser (reading data from body into req.body) and set limit to 10kb on creating and updating documents
app.use(express.json({ limit: '10kb' }));

// vi) Data sanitization against XSS (Cross-site scripting)
app.use(xss());

// vii) Prevent parameter pollution (pass all the params inside whitelist array which you want to allow in req.query to avoid unnecessary params by a malicious user)
app.use(hpp({ whitelist: [] }));

// viii) Compressing
app.use(compression());

app.get('/api/v1/info/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a YouTube video ID',
    });
  }

  const result = ytdl.validateID(id);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: `Sorry! Can not find YouTube video with this ID: ${id}`,
    });
  }

  try {
    const info = await ytdl.getInfo(id);

    if (info.videoDetails) {
      return res.status(200).json({
        success: true,
        details: info.videoDetails,
      });
    } else {
      return res.status(502).json({
        success: false,
        message: 'Bad Gateway',
        details: null,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Something went wrong',
    });
  }
});
app.get('/api/v1/yt/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a YouTube video ID',
    });
  }

  const result = ytdl.validateID(id);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: `Sorry! Can not find YouTube video with this ID: ${id}`,
    });
  }

  try {
    const info = await ytdl.getInfo(id);
    console.log(info);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    if (audioFormats && audioFormats.length) {
      return res.status(200).json({
        success: true,
        data: audioFormats,
      });
    } else {
      return res.status(502).json({
        success: false,
        message: 'Bad Gateway',
        data: null,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Something went wrong',
    });
  }
});

// ii) Handling unavailable routes
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `can not find ${req.originalUrl} on this server`,
  });
});

// exporting app module
module.exports = app;
