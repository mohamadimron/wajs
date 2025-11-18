const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');

// Inisialisasi aplikasi
const app = express();
const server = createServer(app);
const io = socketIo(server);

// Middleware keamanan
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://static.cloudflareinsights.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://socket.io", "wss:", "ws:", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers (for Bootstrap)
      workerSrc: ["'self'", "blob:"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Nonaktifkan karena bisa mengganggu CDN
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100 // batasi request per IP ke 100 permintaan per windowMs
});
app.use(limiter);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Route untuk favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204); // No content
});

// Session configuration
app.use(session({
  secret: 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(flash());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Inisialisasi database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    
    // Buat tabel users
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Buat tabel logs
    db.run(`CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Buat user admin default jika belum ada
    db.get("SELECT * FROM users WHERE role = 'admin'", (err, row) => {
      if (!row) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run("INSERT INTO users (username, email, password, role, isactive) VALUES (?, ?, ?, 'admin', 1)",
          ['admin', 'admin@example.com', hashedPassword],
          (err) => {
            if (err) {
              console.error('Error creating admin user:', err.message);
            } else {
              console.log('Default admin user created: admin / admin123');
            }
          }
        );
      }
    });
  }
});

// Middleware untuk autentikasi
function ensureAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    req.flash('error', 'Please log in to continue');
    res.redirect('/login');
  }
}

function ensureAdmin(req, res, next) {
  if (req.session.userId && req.session.role === 'admin') {
    next();
  } else {
    req.flash('error', 'Admin access required');
    res.redirect('/dashboard');
  }
}

// Fungsi untuk log aktivitas
function logActivity(userId, action, req) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  db.run(
    "INSERT INTO logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)",
    [userId, action, ip, userAgent],
    (err) => {
      if (err) {
        console.error('Error logging activity:', err.message);
      }
    }
  );
}

// Routes
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.render('index', { title: 'Home', user: null, message: req.flash('message'), error: req.flash('error') });
  }
});

app.get('/register', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.render('register', { title: 'Register', user: null, message: req.flash('message'), error: req.flash('error') });
  }
});

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  
  // Validasi input
  if (!username || !email || !password) {
    req.flash('error', 'All fields are required');
    return res.redirect('/register');
  }
  
  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters long');
    return res.redirect('/register');
  }
  
  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (username, email, password, isactive) VALUES (?, ?, ?, 1)",
    [username, email, hashedPassword],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          req.flash('error', 'Username or email already exists');
        } else {
          req.flash('error', 'Registration failed');
        }
        return res.redirect('/register');
      }

      logActivity(this.lastID, 'user_registered', req);
      req.flash('message', 'Registration successful! Please login');
      res.redirect('/login');
    }
  );
});

app.get('/login', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.render('login', { title: 'Login', user: null, message: req.flash('message'), error: req.flash('error') });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    req.flash('error', 'Username and password are required');
    return res.redirect('/login');
  }
  
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err || !user) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/login');
    }

    if (!user.isactive) {
      req.flash('error', 'Your account is inactive. Please contact administrator');
      return res.redirect('/login');
    }

    if (bcrypt.compareSync(password, user.password)) {
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      logActivity(user.id, 'user_logged_in', req);

      res.redirect('/dashboard');
    } else {
      req.flash('error', 'Invalid username or password');
      res.redirect('/login');
    }
  });
});

app.get('/logout', ensureAuthenticated, (req, res) => {
  logActivity(req.session.userId, 'user_logged_out', req);
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

app.get('/dashboard', ensureAuthenticated, (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (err) {
      req.flash('error', 'Error fetching user data');
      return res.redirect('/login');
    }

    // Ambil beberapa log terbaru
    db.all("SELECT * FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 5", [req.session.userId], (err, logs) => {
      if (err) {
        console.error('Error fetching logs:', err.message);
        logs = [];
      }

      res.render('dashboard', {
        title: 'Dashboard',
        user: user,
        logs: logs,
        message: req.flash('message'),
        error: req.flash('error')
      });
    });
  });
});

app.get('/admin', ensureAdmin, (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (err) {
      req.flash('error', 'Error fetching user data');
      return res.redirect('/login');
    }

    // Ambil semua pengguna
    db.all("SELECT id, username, email, role, isactive, created_at FROM users ORDER BY created_at DESC", (err, users) => {
      if (err) {
        console.error('Error fetching users:', err.message);
        users = [];
      }

      // Pagination for logs
      const page = parseInt(req.query.page) || 1;
      const logsPerPage = 10;
      const offset = (page - 1) * logsPerPage;

      // Get total count of logs
      db.get("SELECT COUNT(*) as total FROM logs", (err, countResult) => {
        if (err) {
          console.error('Error fetching log count:', err.message);
          countResult = { total: 0 };
        }

        const totalLogs = countResult.total;
        const totalPages = Math.ceil(totalLogs / logsPerPage);

        // Get logs with pagination
        db.all("SELECT l.*, u.username FROM logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT ? OFFSET ?", [logsPerPage, offset], (err, logs) => {
          if (err) {
            console.error('Error fetching logs:', err.message);
            logs = [];
          }

          res.render('admin', {
            title: 'Admin Dashboard',
            currentUser: user, // Current logged in admin user
            users: users,
            logs: logs,
            currentPage: page,
            totalPages: totalPages,
            totalLogs: totalLogs,
            message: req.flash('message'),
            error: req.flash('error')
          });
        });
      });
    });
  });
});

app.get('/settings', ensureAdmin, (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (err) {
      req.flash('error', 'Error fetching user data');
      return res.redirect('/login');
    }

    res.render('settings', {
      title: 'Settings',
      user: user,
      message: req.flash('message'),
      error: req.flash('error')
    });
  });
});

// Admin endpoint to edit user profile
app.put('/admin/users/:id', ensureAdmin, (req, res) => {
  const userId = req.params.id;
  const { username, email, role, isactive } = req.body;

  // Validate input
  if (!username || !email || !role || req.body.isactive === undefined || req.body.isactive === null) {
    req.flash('error', 'All fields are required');
    return res.redirect('/admin');
  }

  // Check if user exists
  db.get("SELECT id FROM users WHERE id = ?", [userId], (err, user) => {
    if (err || !user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin');
    }

    // Check if username or email already exists for another user
    db.get("SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?", [username, email, userId], (err, existingUser) => {
      if (existingUser) {
        req.flash('error', 'Username or email already taken by another user');
        return res.redirect('/admin');
      }

      db.run(
        "UPDATE users SET username = ?, email = ?, role = ?, isactive = ? WHERE id = ?",
        [username, email, role, (isactive == '1' || isactive == 'true') ? 1 : 0, userId],
        function(err) {
          if (err) {
            req.flash('error', 'Failed to update user');
            console.error(err);
            return res.redirect('/admin');
          }

          logActivity(req.session.userId, `updated_user_${userId}`, req);
          req.flash('message', 'User updated successfully');
          res.redirect('/admin');
        }
      );
    });
  });
});

// Admin endpoint to get edit user form (this will be handled via a separate route)
app.get('/admin/users/:id/edit', ensureAdmin, (req, res) => {
  const userId = req.params.id;

  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err || !user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin');
    }

    // Get current admin user for the view
    db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, adminUser) => {
      if (err) {
        req.flash('error', 'Error fetching admin data');
        return res.redirect('/login');
      }

      // Get all users for admin view
      db.all("SELECT id, username, email, role, isactive, created_at FROM users ORDER BY created_at DESC", (err, users) => {
        if (err) {
          console.error('Error fetching users:', err.message);
          users = [];
        }

        // Pagination for logs - use the same page parameter from the main route
        const page = parseInt(req.query.page) || 1;
        const logsPerPage = 10;
        const offset = (page - 1) * logsPerPage;

        // Get total count of logs
        db.get("SELECT COUNT(*) as total FROM logs", (err, countResult) => {
          if (err) {
            console.error('Error fetching log count:', err.message);
            countResult = { total: 0 };
          }

          const totalLogs = countResult.total;
          const totalPages = Math.ceil(totalLogs / logsPerPage);

          // Get logs with pagination
          db.all("SELECT l.*, u.username FROM logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT ? OFFSET ?", [logsPerPage, offset], (err, logs) => {
            if (err) {
              console.error('Error fetching logs:', err.message);
              logs = [];
            }

            res.render('admin', {
              title: 'Admin Dashboard',
              currentUser: adminUser,
              users: users,
              logs: logs,
              editingUser: user, // This will be used to prefill the edit form
              currentPage: page,
              totalPages: totalPages,
              totalLogs: totalLogs,
              message: req.flash('message'),
              error: req.flash('error')
            });
          });
        });
      });
    });
  });
});

// Admin endpoint to delete user
app.delete('/admin/users/:id', ensureAdmin, (req, res) => {
  const userId = req.params.id;

  // Prevent admin from deleting themselves
  if (parseInt(userId) === req.session.userId) {
    req.flash('error', 'You cannot delete your own account');
    return res.redirect('/admin');
  }

  db.get("SELECT id, username FROM users WHERE id = ?", [userId], (err, user) => {
    if (err || !user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin');
    }

    db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
      if (err) {
        req.flash('error', 'Failed to delete user');
        console.error(err);
        return res.redirect('/admin');
      }

      logActivity(req.session.userId, `deleted_user_${user.username}_(id:${userId})`, req);
      req.flash('message', `User ${user.username} deleted successfully`);
      res.redirect('/admin');
    });
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  
  // Contoh event real-time
  socket.on('message', (data) => {
    // Broadcast ke semua client
    io.emit('message', data);
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found', user: req.session.userId ? { id: req.session.userId, username: req.session.username, role: req.session.role } : null });
});

const PORT = process.env.PORT || 5173;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});