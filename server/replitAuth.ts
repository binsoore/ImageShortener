import session from "express-session";
import type { Express, RequestHandler } from "express";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function setupAuth(app: Express) {
  // Session middleware
  app.use(session({
    secret: 'simple-auth-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Login endpoint
  app.post("/api/login", (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
      (req.session as any).isAuthenticated = true;
      res.json({ success: true, message: "로그인 성공" });
    } else {
      res.status(401).json({ success: false, message: "비밀번호가 틀렸습니다" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ success: false, message: "로그아웃 실패" });
      } else {
        res.json({ success: true, message: "로그아웃 성공" });
      }
    });
  });

  // Check auth status
  app.get("/api/auth/status", (req, res) => {
    const isAuthenticated = (req.session as any)?.isAuthenticated || false;
    res.json({ isAuthenticated });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const isAuth = (req.session as any)?.isAuthenticated || false;
  
  if (!isAuth) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};



