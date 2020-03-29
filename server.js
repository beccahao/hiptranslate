// Code largely adapted from jelo rivera MERN tutorial: https://medium.com/javascript-in-plain-english/full-stack-mongodb-react-node-js-express-js-in-one-simple-app-6cc8ed6de274
// Also is adapted to deploy/be hosted using knowledge from Rohan Paul React-Node-MongoDB GCP tutorial: https://medium.com/@paulrohan/deploying-a-react-node-mongodb-app-to-google-cloud-platforms-google-app-engine-1ba680447d59

const mongoose = require('mongoose');
const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('morgan');
const Data = require('./data');

const API_PORT = process.env.PORT || 8080;
const app = express();
app.use(cors());
const router = express.Router();

const path = require('path');
app.use(express.static(path.join(__dirname, "mthci/build")));
app.use('/', express.static(__dirname + 'public'));

// MongoDB database
const dbRoute = require('./config');
// Connects backend code with database
mongoose.connect(dbRoute, { useNewUrlParser: true }).catch(error => handleError(error));;

let db = mongoose.connection;
db.once('open', () => console.log('connected to the database'));
// Checks if connection with the database is successful
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));

// Get method fetches all available data in our database
router.get('/getData', (req, res) => {
  console.log("getData");
  Data.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

// Create method adds new data in our database
router.post('/putData', (req, res) => {
  console.log("putData");
  let data = new Data();

  const { id, uniqueId, sourceLang, targetLang, sourceText, targetText, domain, translation } = req.body;

  if (!id && id !== 0 || !uniqueId || !sourceLang || !targetLang || !sourceText || !targetText || !domain || !translation) {
    return res.json({
      success: false,
      error: 'INVALID INPUTS',
    });
  }
  data.id = id;
  data.uniqueId = uniqueId;
  data.sourceLang = sourceLang;
  data.targetLang = targetLang;
  data.sourceText = sourceText;
  data.targetText = targetText;
  data.domain = domain;
  data.translation = translation;
  data.save((err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// Append /api for our http requests
app.use('/api', router);

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file (server is launching the frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/mthci/build/index.html'));
});

// Launch backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
