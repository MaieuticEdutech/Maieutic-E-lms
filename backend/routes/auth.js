const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../db');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      role = 'student',
      phone,
      bio,
    } = req.body;

    // 1. Check required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        message: 'First name, last name, email and password are required',
      });
    }

    // 2. Validate role
    const allowedRoles = ['admin', 'instructor', 'student'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role',
      });
    }

    // 3. Check whether email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'Email already registered',
      });
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Insert user into PostgreSQL
    const result = await pool.query(
      `INSERT INTO users
        (first_name, last_name, email, password_hash, role, phone, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
        id,
        first_name,
        last_name,
        email,
        role,
        phone,
        bio,
        is_active,
        email_verified,
        created_at`,
      [
        first_name,
        last_name,
        email.toLowerCase(),
        passwordHash,
        role,
        phone || null,
        bio || null,
      ]
    );

    const user = result.rows[0];

    // 6. Return created user
    res.status(201).json({
      message: 'Registration successful',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);

    res.status(500).json({
      message: 'Server error during registration',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    // 2. Find user by email
    const result = await pool.query(
      `SELECT
        id,
        first_name,
        last_name,
        email,
        password_hash,
        role,
        avatar_url,
        phone,
        bio,
        is_active,
        email_verified
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    // 3. Check if user exists
    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // 4. Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        message: 'Your account is inactive',
      });
    }

    // 5. Compare password with stored bcrypt hash
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // 6. Remove password hash before sending response
    delete user.password_hash;

    // 7. Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    // 8. Return successful login
    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      message: 'Server error during login',
    });
  }
});

module.exports = router;
