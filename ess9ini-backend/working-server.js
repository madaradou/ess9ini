const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mock user data (for testing)
const mockUsers = [
  {
    id: '1',
    email: 'admin@ess9ini.com',
    password: '123456', // In real app, this would be hashed
    firstName: 'أحمد',
    lastName: 'بن علي',
    role: 'admin',
    language: 'ar'
  },
  {
    id: '2',
    email: 'farmer@ess9ini.com',
    password: '123456',
    firstName: 'محمد',
    lastName: 'الفلاح',
    role: 'farmer',
    language: 'ar'
  }
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ess9ini Backend API is running',
    timestamp: new Date().toISOString(),
    database: 'mock'
  });
});

// Registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration request:', req.body);
    
    const { email, password, firstName, lastName, phone, role, language } = req.body;

    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const newUser = {
      id: String(mockUsers.length + 1),
      email,
      password, // In real app, hash this
      firstName,
      lastName,
      phone,
      role: role || 'farmer',
      language: language || 'ar'
    };

    mockUsers.push(newUser);

    console.log('User registered successfully:', newUser.email);

    // Generate mock token
    const token = 'mock-jwt-token-' + Date.now();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          language: newUser.language
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request:', req.body.email);
    
    const { email, password } = req.body;

    // Find user
    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password (in real app, use bcrypt)
    if (user.password !== password) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate mock token
    const token = 'mock-jwt-token-' + Date.now();

    console.log('Login successful for user:', email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          language: user.language
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Get current user (mock)
app.get('/api/auth/me', (req, res) => {
  // Mock authentication - in real app, verify JWT
  const mockUser = mockUsers[0]; // Return admin user for testing
  
  res.json({
    success: true,
    data: {
      user: {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        language: mockUser.language
      }
    }
  });
});

// Start server
const PORT = 5002;
app.listen(PORT, () => {
  console.log('🚀 Working Auth Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🎯 Client URL: http://localhost:3000`);
  console.log('📋 Available endpoints:');
  console.log('   GET  /api/health');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/me');
  console.log('');
  console.log('🧪 Test users:');
  console.log('   admin@ess9ini.com / 123456');
  console.log('   farmer@ess9ini.com / 123456');
});
