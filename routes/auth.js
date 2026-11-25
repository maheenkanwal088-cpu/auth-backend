const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/auth");

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  createdAt: u.createdAt,
  lastLogin: u.lastLogin,
  loginCount: u.loginCount,
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    if (await User.findOne({ email })) return res.status(409).json({ message: "This email is already registered" });

    const user = await User.create({ name, email, password, lastLogin: new Date(), loginCount: 1 });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Could not create account" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Incorrect email or password" });

    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Could not log in" });
  }
});

// GET /api/auth/me  (protected)
router.get("/me", protect, (req, res) => res.json({ user: publicUser(req.user) }));

// PUT /api/auth/profile  (protected)
router.put("/profile", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Name cannot be empty" });
    req.user.name = name.trim();
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch {
    res.status(500).json({ message: "Could not update profile" });
  }
});

module.exports = router;
