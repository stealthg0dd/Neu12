import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// JSON body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend from client/dist
const clientBuildPath = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientBuildPath));

// Import market routes (will be compiled to .js)
let marketRouter;
try {
  const marketModule = await import("./dist/server/routes/market.js");
  marketRouter = marketModule.default;
} catch (error) {
  console.warn("Market routes not available:", error.message);
}

// API routes
if (marketRouter) {
  app.use("/api/market", marketRouter);
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok",
    alphaVantageConfigured: !!process.env.ALPHA_VANTAGE_KEY
  });
});

// Demo login endpoint for quick access
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  // Demo credentials
  if (email === "demo@neufin.com" && password === "demo123") {
    return res.json({ 
      token: "demo-jwt-token-abc123", 
      user: { 
        id: "admin-001",
        email: "demo@neufin.com", 
        firstName: "Demo", 
        lastName: "User" 
      } 
    });
  }

  // Admin credentials (existing)
  if (email === "admin@neufin.com" && password === "admin123") {
    return res.json({ 
      token: "admin-jwt-token-xyz789", 
      user: { 
        id: "admin-001",
        email: "admin@neufin.com", 
        firstName: "Admin", 
        lastName: "User" 
      } 
    });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

// User info endpoint 
app.get("/api/auth/me", (req, res) => {
  // For demo purposes, return the admin user
  res.json({
    id: "admin-001",
    email: "admin@neufin.com",
    firstName: "Admin", 
    lastName: "User"
  });
});

// Fallback to index.html for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Alpha Vantage API: ${process.env.ALPHA_VANTAGE_KEY ? 'Configured' : 'Not configured'}`);
});