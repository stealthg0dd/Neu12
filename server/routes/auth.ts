import express from "express";
import { generateToken, hashPassword, comparePassword } from "../middleware/auth.js";
import { storage } from "../storage.js";
import { insertUserSchema } from "../../shared/schema.js";
import { z } from "zod";

const router = express.Router();

// Demo login endpoint with existing admin user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    }).parse(req.body);

    // Check for demo credentials
    if (email === "demo@neufin.com" && password === "demo123") {
      const token = generateToken("admin-001");
      return res.json({ 
        token, 
        user: { 
          id: "admin-001",
          email: "demo@neufin.com", 
          firstName: "Demo", 
          lastName: "User" 
        } 
      });
    }

    // Check existing users
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: 'Invalid input data' });
  }
});

// Signup endpoint
router.post("/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const token = generateToken(user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ message: 'Invalid input data' });
  }
});

export default router;