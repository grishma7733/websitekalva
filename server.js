const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const helmet = require('helmet');
const app = express();
const db1 = require('./server');
const port = 3000;

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'SF2'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Custom CSP configuration
app.use(helmet.contentSecurityPolicy({
  directives: {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    "script-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"]
  },
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes

// Home route - render the scheduler form
app.get('/', (req, res) => {
  res.render('scheduler-form');
});

// Route to fetch unit number based on BEDTC
app.get('/unit_no/:bedtc', (req, res) => {
  const bedtc = req.params.bedtc;
  console.log('Received BEDTC:', bedtc);
  
  const query = 'SELECT DISTINCT unit_no FROM Atrain2 WHERE BEDTC = ?';
  
  db.query(query, [bedtc], (err, results) => {
      if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
      }
      
      console.log('Query results:', results);
      
      if (results.length === 0) {
          res.status(404).json({ error: 'No matching BEDTC found' });
          return;
      }
      
      res.json(results);
  });
});

// Route to fetch coach formation based on BEDTC
app.get('/rake_formation/:bedtc', (req, res) => {
  const bedtc = req.params.bedtc;
  const query = 'SELECT DISTINCT rake_formation FROM Atrain2 WHERE BEDTC = ?';
  db.query(query, [bedtc], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

// Route to handle form submission
app.post('/schedule', (req, res) => {
  const { bedtc, unitNo, coaches, scheduleType, scheduleDate } = req.body;
  
  // Ensure coaches is an array
  const coachArray = Array.isArray(coaches) ? coaches : [coaches];

  // Construct your SQL query based on the form data
  const query = 'UPDATE Atrain2 SET ?? = ? WHERE BEDTC = ? AND rake_formation IN (?)';
  const values = [scheduleType.toLowerCase() + '_date', scheduleDate, bedtc, coachArray];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Error updating schedule' });
      return;
    }
    res.json({ message: 'Schedule updated successfully' });
  });
});

// Catch-all route for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});