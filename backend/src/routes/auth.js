import express from 'express';
import { getFirestore } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(doc) {
  const d = doc.data();
  return { 
    id: doc.id, 
    email: d.email, 
    name: d.name, 
    role: d.role, 
    access_type: d.access_type,
    photoURL: d.photoURL,
    createdAt: d.createdAt
  };
}

// ─── Register ────────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, birthday, address, mobile_number } = req.body;
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
      birthday: birthday || null,
      address: address || null,
      mobile_number: mobile_number || null,
      username: email,
      role: 'User',
      access_type: 'User',
      passwordHistory: [hashedPassword], // Store initial password in history to prevent immediate reuse
      failedLoginAttempts: 0,
      loginLockedUntil: null,
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

    // Check if account is locked
    if (user.loginLockedUntil && new Date(user.loginLockedUntil) > new Date()) {
      const remainingMs = new Date(user.loginLockedUntil) - new Date();
      const remainingSec = Math.ceil(remainingMs / 1000);
      console.warn(`[Auth] Account locked: ${email}, remaining: ${remainingSec}s`);
      return res.status(429).json({ 
        error: 'Too many unsuccessful login attempts. Your login has been temporarily blocked.',
        lockedUntil: user.loginLockedUntil,
        remainingSeconds: remainingSec
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      // Increment failed attempts
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates = { failedLoginAttempts: attempts };

      if (attempts >= 3) {
        // Lock account for 5 minutes
        const lockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        updates.loginLockedUntil = lockUntil;
        await userDoc.ref.update(updates);
        console.warn(`[Auth] Account locked after ${attempts} attempts: ${email}`);
        return res.status(429).json({ 
          error: 'Too many unsuccessful login attempts. Your login has been temporarily blocked. Please try again in 5 minutes.',
          lockedUntil: lockUntil
        });
      } else {
        await userDoc.ref.update(updates);
        const remaining = 3 - attempts;
        console.warn(`[Auth] Login failed – wrong password: ${email}, attempts: ${attempts}`);
        return res.status(401).json({ 
          error: `Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before your login is temporarily blocked.`
        });
      }
    }

    // Successful login - reset attempts
    await userDoc.ref.update({ 
      lastLogin: new Date().toISOString(),
      failedLoginAttempts: 0,
      loginLockedUntil: null
    });
    
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
    const allowed = ['name', 'birthday', 'address', 'mobile_number', 'username', 'access_type', 'preferences', 'photoURL'];
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

// Password reset codes and grants are generated and verified only on the server.
const resetHash = value => crypto.createHmac('sha256', process.env.JWT_SECRET).update(value).digest('hex');
const resetRef = email => getFirestore().collection('password_resets').doc(resetHash(email));
const normalizeEmail = email => typeof email === 'string' ? email.trim().toLowerCase() : '';

router.post('/forgot-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email || email.length > 254 || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
  const { EMAILJS_SERVICE_ID, EMAILJS_RESET_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, JWT_SECRET } = process.env;
  if (!EMAILJS_SERVICE_ID || !EMAILJS_RESET_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY || !JWT_SECRET) {
    return res.status(503).json({ error: 'Password reset email is not configured.' });
  }
  try {
    const db = getFirestore();
    const ref = resetRef(email);
    const code = String(crypto.randomInt(100000, 1000000));
    const now = Date.now();
    const allowed = await db.runTransaction(async transaction => {
      const doc = await transaction.get(ref);
      if (doc.exists && now - doc.data().requestedAt < 60000) return false;
      transaction.set(ref, { codeHash: resetHash(`${email}:${code}`), requestedAt: now, expiresAt: now + 300000, attempts: 0 });
      return true;
    });
    if (!allowed) return res.status(429).json({ error: 'Please wait a minute before requesting another code.' });
    const users = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!users.empty) {
      await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
        service_id: EMAILJS_SERVICE_ID, template_id: EMAILJS_RESET_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY, accessToken: EMAILJS_PRIVATE_KEY,
        template_params: { to_email: email, to_name: users.docs[0].data().name || email, otp_code: code, otp_purpose: 'Password reset' }
      }, { timeout: 10000 });
    }
    res.json({ message: 'If that email exists you will receive a code shortly.' });
  } catch (error) {
    console.error('[Auth] Password reset request failed:', error.message);
    res.status(503).json({ error: 'Could not send a verification code. Please try again.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || '');
  if (!email || !/^\d{6}$/.test(code) || !process.env.JWT_SECRET) return res.status(400).json({ error: 'Invalid or expired code.' });
  try {
    const db = getFirestore();
    const ref = resetRef(email);
    const token = crypto.randomBytes(32).toString('hex');
    const valid = await db.runTransaction(async transaction => {
      const doc = await transaction.get(ref);
      if (!doc.exists) return false;
      const data = doc.data();
      if (data.expiresAt <= Date.now() || data.attempts >= 5 || !data.codeHash) return false;
      if (data.codeHash !== resetHash(`${email}:${code}`)) {
        transaction.update(ref, { attempts: data.attempts + 1 });
        return false;
      }
      transaction.update(ref, { codeHash: null, tokenHash: resetHash(token), tokenExpiresAt: Date.now() + 600000 });
      return true;
    });
    if (!valid) return res.status(400).json({ error: 'Invalid or expired code. Request a new code if needed.' });
    res.json({ resetToken: token });
  } catch (error) {
    console.error('[Auth] Reset verification failed:', error.message);
    res.status(500).json({ error: 'Could not verify the code.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { newPassword, resetToken } = req.body;
  if (!email || typeof newPassword !== 'string' || newPassword.length < 8 || typeof resetToken !== 'string' || !process.env.JWT_SECRET) {
    return res.status(400).json({ error: 'Invalid reset request.' });
  }
  try {
    const db = getFirestore();
    const users = await db.collection('users').where('email', '==', email).limit(1).get();
    if (users.empty) return res.status(400).json({ error: 'Invalid or expired reset request.' });
    const userRef = users.docs[0].ref;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db.runTransaction(async transaction => {
      const resetDoc = await transaction.get(resetRef(email));
      const userDoc = await transaction.get(userRef);
      const reset = resetDoc.data();
      if (!reset || !reset.tokenHash || reset.tokenExpiresAt <= Date.now() || reset.tokenHash !== resetHash(resetToken)) return 'invalid';
      const user = userDoc.data();
      const history = [user.password, ...(user.passwordHistory || [])].slice(0, 5);
      const reused = await Promise.all(history.map(hash => bcrypt.compare(newPassword, hash)));
      if (reused.some(Boolean)) return 'reused';
      transaction.update(userRef, { password: hashedPassword, passwordHistory: history, updatedAt: new Date().toISOString() });
      transaction.delete(resetRef(email));
      return 'ok';
    });
    if (result === 'reused') return res.status(400).json({ error: 'You cannot reuse a previous password. Please choose a new password.' });
    if (result !== 'ok') return res.status(400).json({ error: 'Invalid or expired reset request.' });
    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[Auth] Password reset failed:', error.message);
    res.status(500).json({ error: 'Could not reset password.' });
  }
});

// ─── Change password (authenticated users) ───────────────────────────────────

router.patch('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.user.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check if new password was used before (in last 5 passwords)
    // Use constant-time comparison by checking all entries regardless of match
    const passwordHistory = user.passwordHistory || [];
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Collect all hashes to check (current password + history)
    const allPreviousHashes = [user.password, ...passwordHistory].slice(0, 5);
    
    // Check all hashes in constant time (don't early return)
    const comparisonResults = await Promise.all(
      allPreviousHashes.map(hash => bcrypt.compare(newPassword, hash))
    );
    
    // Check if any comparison matched
    const isReused = comparisonResults.some(result => result === true);
    if (isReused) {
      return res.status(400).json({ error: 'You cannot reuse a previous password. Please choose a new password.' });
    }

    // Update password and history
    const updatedHistory = [user.password, ...passwordHistory].slice(0, 5);
    await userDoc.ref.update({
      password: hashedNewPassword,
      passwordHistory: updatedHistory,
      updatedAt: new Date().toISOString()
    });

    console.log(`[Auth] Password changed: ${req.user.userId}`);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('[Auth] Change password error:', error);
    res.status(500).json({ error: 'Failed to change password', details: error.message });
  }
});

export default router;
