require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./db');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const helmet = require('helmet');

const app = express();
const port = 3000;

const dbUM = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'user_management'
});

dbUM.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database!');
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'my_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Custom CSP configuration
app.use(helmet.contentSecurityPolicy({
  directives: {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    "script-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"]
  },
}));

function requireLogin(req, res, next) {
  if (req.session.loggedin) {
    next();
  } else {
    res.redirect('/sign-in');
  }
}

app.get('/', (req, res) => {
  res.redirect('/sign-in');
});

app.get('/sign-in', (req, res) => {
  res.render('sign-in', { title: 'Sign In' });
});

app.post('/sign-in', (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    dbUM.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
      if (error) {
        console.error('Database query failed:', error);
        res.send('An error occurred');
        return;
      }

      if (results.length > 0) {
        const hashedPassword = results[0].password;

        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
          if (err) {
            console.error('Error comparing passwords:', err);
            res.send('An error occurred');
            return;
          }

          if (isMatch) {
            req.session.loggedin = true;
            req.session.username = username;
            req.session.user_role = results[0].role;

            switch (results[0].role) {
              case 'admin':
                res.redirect('/admin_dashboard');
                break;
              case 'editor':
                res.redirect('/editor_dashboard');
                break;
              case 'viewer':
                res.redirect('/viewer_dashboard');
                break;
              default:
                res.redirect('/sign-in');
            }
          } else {
            res.send('Incorrect Username and/or Password!');
          }
        });
      } else {
        res.send('User not found');
      }
    });
  } else {
    res.send('Please enter Username and Password!');
  }
});

app.get('/admin_dashboard', requireLogin, (req, res) => {
  if (req.session.user_role === 'admin') {
    const data = {
      title: 'KCS Admin Dashboard',
      headerTitle: 'KCS Admin Dashboard',
      dashboardItems: [
        { icon: '&#x1F527;', title: 'Maintenance', description: 'IA/TI/IC Scheduler', url:'/scheduler-form' },
        { icon: '&#x1F689;', title: 'Rake Formation', description: 'Editor' , url:'/rake_fromation' },
        { icon: '&#x1F464;', title: 'User Roles', description: 'Manage Permissions', url:'/user_roles'},
        { icon: '&#x1F4CA;', title: 'Reports', description: 'Generate & View', url:'/reports'},
        { icon: '&#x1F4D1;', title: 'Logs', description: 'System Activity', url:'/logs'},
        { icon: '&#x2699;', title: 'Settings', description: 'System Configuration' , url:'/settings'},
      ]
    };
    res.render('admin_dashboard', data);
  } else {
    res.redirect('/sign-in');
  }
});

app.get('/editor_dashboard', requireLogin, (req, res) => {
  if (req.session.user_role === 'editor') {
    res.render('editor_dashboard', { username: req.session.username });
  } else {
    res.redirect('/sign-in');
  }
});

app.get('/viewer_dashboard', requireLogin, (req, res) => {
  if (req.session.user_role === 'viewer') {
    res.render('viewer_dashboard', { username: req.session.username });
  } else {
    res.redirect('/sign-in');
  }
});
//redirecting to all the tabs
app.get('/scheduler-form',requireLogin,(req,res)=>{
  res.render('scheduler-form',{title:'schedule'});
});

app.get('/rake_formation', requireLogin, (req, res) => {
  res.render('rake_formation', { title: 'Rake Formation' });
});

app.get('/user_roles', requireLogin, (req, res) => {
  res.render('user_roles', { title: 'User Roles' });
});

app.get('/reports', requireLogin, (req, res) => {
  res.render('reports', { title: 'Reports' });
});

app.get('/logs', requireLogin, (req, res) => {
  res.render('logs', { title: 'Logs' });
});

app.get('/settings', requireLogin, (req, res) => {
  res.render('settings', { title: 'Settings' });
});

//  SCHEDULAR FORM API

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
      res.status(500).json({ error: 'Error updating schedule' }); // Send JSON response
      return;
    }
    res.json({ message: 'Schedule updated successfully' }); // Send JSON response
  });
});


// Catch-all route for undefined routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
