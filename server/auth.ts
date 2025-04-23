import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { sendNewMemberWelcomeEmail, sendPasswordResetEmail } from "./email-service";
import { User as SelectUser, InsertUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || 'comunigov-secret-key';
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create new user with hashed password
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      
      // Determine if we should auto-login (self-registration) or not (admin adding user)
      const autoLogin = req.body.autoLogin === true || !req.isAuthenticated();
      
      // Send welcome email if this is an entity member being created by an admin
      // and we have the necessary information
      if (!autoLogin && 
          user.entityId && 
          user.email && 
          user.role && 
          (user.role === 'entity_head' || user.role === 'entity_member')) {
        try {
          // Get entity name for the welcome email
          const entity = await storage.getEntity(user.entityId);
          
          if (entity) {
            // Check if the password in req.body is a default one (like "1234")
            // This indicates a temporary password was set by an admin
            const plainPassword = req.body.password;
            
            // Send welcome email with account details
            await sendNewMemberWelcomeEmail(
              user.email,
              user.fullName,
              user.username,
              plainPassword,
              entity.name
            );
            
            console.log(`Welcome email sent to new ${user.role} (${user.email})`);
          }
        } catch (emailError) {
          // Log the error but don't fail the registration
          console.error('Error sending welcome email:', emailError);
        }
      }
      
      if (autoLogin) {
        // This is a self-registration, so log the user in
        req.login(user, (err) => {
          if (err) return next(err);
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      } else {
        // This is an admin adding a user, just return the created user without logging in
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      }
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
      
      req.login(user, async (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Log the login activity
        try {
          const ActivityLogger = (await import('./activity-logger')).ActivityLogger;
          await ActivityLogger.logLogin(user.id, req);
        } catch (logErr) {
          console.error('Failed to log login activity:', logErr);
          // Continue even if logging fails
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    if (req.isAuthenticated()) {
      // Store user ID before logging out for activity logging
      const userId = req.user!.id;
      
      // Log the logout activity
      try {
        const ActivityLogger = (await import('./activity-logger')).ActivityLogger;
        await ActivityLogger.logLogout(userId, req);
      } catch (logErr) {
        console.error('Failed to log logout activity:', logErr);
        // Continue even if logging fails
      }
      
      req.logout((err) => {
        if (err) return next(err);
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200); // Already logged out
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Endpoint for checking if user needs to change their password
  app.get("/api/user/password-status", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ requirePasswordChange: req.user.requirePasswordChange === true });
  });
  
  // Endpoint for changing password on first login
  app.post("/api/user/change-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validate request
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Get the user
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password and clear requirePasswordChange flag
      await storage.updateUser(user.id, { 
        password: hashedPassword, 
        requirePasswordChange: false 
      });
      
      // Log the password change
      try {
        const ActivityLogger = (await import('./activity-logger')).ActivityLogger;
        await ActivityLogger.logUpdate(
          user.id,
          'user',
          user.id,
          'User changed password'
        );
      } catch (logErr) {
        console.error('Failed to log password change activity:', logErr);
        // Continue even if logging fails
      }
      
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
}
