import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    if (user) {
      res.status(201).json({
        user: user.toFrontendObject(),
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const authUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });

    // Ensure user exists, password matches, and role matches
    if (user && (await user.matchPassword(password))) {
      // In a strict app, we might also check role match here. 
      // i.e., if (user.role !== role) { return res.status(401).json({ message: 'Role mismatch' }); }
      res.json({
        user: user.toFrontendObject(),
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import nodemailer from 'nodemailer';

// @desc    Send 2FA OTP (Mock)
// @route   POST /api/auth/send-otp
export const sendOTP = async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Mock 2FA] OTP for ${req.user.email} is: ${otp}`);
    
    // NodeMailer Sandbox Integration
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    let info = await transporter.sendMail({
      from: '"Nexus Security" <security@businessnexus.com>',
      to: req.user.email,
      subject: "Your 2FA Verification Code",
      text: `Your Nexus Two-Factor Authentication code is: ${otp}`,
      html: `<b>Your Nexus Two-Factor Authentication code is: ${otp}</b>`,
    });

    console.log("Mock OTP Email sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    
    req.user.twoFactorSecret = otp;
    await req.user.save();
    
    res.json({ message: 'OTP sent successfully to email (check console)', mockup_otp: otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// @desc    Verify 2FA OTP (Mock)
// @route   POST /api/auth/verify-otp
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    
    if (req.user.twoFactorSecret === otp) {
      req.user.twoFactorSecret = undefined;
      await req.user.save();
      res.json({ message: '2FA Verification successful' });
    } else {
      res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};
