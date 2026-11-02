import express from 'express';
import { getFirestore } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(doc) {
  const d = doc.data();
  return { id: doc.id, email: d.email, name: d.name, role: d.role, access_type: d.access_type };
}

// ─── Register ────────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'student' } = req.body;
    console.log(`[Auth] Register attempt: ${email}`);

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const db = getFirestore();
    const usersRef = db.collection('users');
    const existing = await usersRef.where('email', '==', email).get();

    if (!existing.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      email,
      password: hashedPassword,
      name,
      role: ['admin', 'professor', 'student'].includes(role) ? role : 'student',
      access_type: 'User',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      preferences: { theme: 'light', notifications: true },
    };

    const userRef = await usersRef.add(userData);
    const token = makeToken({ userId: userRef.id, email, role: userData.role });

    console.log(`[Auth] Registered: ${email} (${userRef.id})`);
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: userRef.id, email, name, role: userData.role },
      token,
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[Auth] Login attempt: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getFirestore();
    const snapshot = await db.collection('users').where('email', '==', email).get();

    if (snapshot.empty) {
      console.warn(`[Auth] Login failed – user not found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      console.warn(`[Auth] Login failed – wrong password: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await userDoc.ref.update({ lastLogin: new Date().toISOString() });
    const token = makeToken({ userId: userDoc.id, email: user.email, role: user.role });

    console.log(`[Auth] Login success: ${email}`);
    res.json({
      message: 'Login successful',
      user: { id: userDoc.id, email: user.email, name: user.name, role: user.role, access_type: user.access_type || 'User' },
      token,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// ─── Logout ──────────────────────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  // Token is stateless (JWT); client removes it. This endpoint exists so the
  // frontend can call it without a 404.
  console.log('[Auth] Logout');
  res.json({ message: 'Logged out' });
});

// ─── Get current user ────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req, res) => {
  try {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.user.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(safeUser(userDoc));
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─── Update current user profile ─────────────────────────────────────────────

router.patch('/me', authenticate, async (req, res) => {
  try {
    const allowed = ['name', 'birthday', 'address', 'mobile_number', 'username', 'access_type', 'preferences'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const db = getFirestore();
    const ref = db.collection('users').doc(req.user.userId);
    await ref.update({ ...updates, updatedAt: new Date().toISOString() });

    const updated = await ref.get();
    console.log(`[Auth] Profile updated: ${req.user.userId}`);
    res.json(safeUser(updated));
  } catch (error) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

// ─── Forgot password (OTP is sent client-side via EmailJS) ───────────────────

router.post('/forgot-password', async (req, res) => {
  // OTP sending is handled by EmailJS on the frontend.
  // This endpoint checks that the email exists and logs the request.
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const db = getFirestore();
    const snapshot = await db.collection('users').where('email', '==', email).get();
    console.log(`[Auth] Forgot-password request: ${email} (found=${!snapshot.empty})`);

    // Always respond with success to avoid leaking whether an email is registered
    res.json({ message: 'If that email exists you will receive a code shortly.' });
  } catch (error) {
    console.error('[Auth] Forgot-password error:', error);
    res.status(500).json({ error: 'Request failed', details: error.message });
  }
});

// ─── Verify OTP (stub — validation is done client-side via EmailJS) ──────────

router.post('/verify-otp', (req, res) => {
  // OTP verification is handled locally on the frontend (emailService.js).
  // This stub exists so any legacy callers don't get a 404.
  res.json({ message: 'ok' });
});

// ─── Resend OTP (stub — sending is done client-side via EmailJS) ─────────────

router.post('/resend-otp', (req, res) => {
  res.json({ message: 'ok' });
});

// ─── Reset password ──────────────────────────────────────────────────────────

router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and newPassword are required' });
    }

    console.log(`[Auth] Password reset for: ${email}`);

    const db = getFirestore();
    const snapshot = await db.collection('users').where('email', '==', email).get();

    if (snapshot.empty) {
      // Generic response to avoid email enumeration
      return res.json({ message: 'Password updated.' });
    }

    const userDoc = snapshot.docs[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userDoc.ref.update({ password: hashedPassword, updatedAt: new Date().toISOString() });

    console.log(`[Auth] Password reset complete: ${email}`);
    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
});

export default router;
