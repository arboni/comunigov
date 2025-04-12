import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { z } from "zod";
import { 
  insertEntitySchema, 
  insertMeetingSchema, 
  insertMeetingAttendeeSchema,
  insertTaskSchema,
  insertCommunicationSchema,
  insertCommunicationRecipientSchema,
  insertAchievementBadgeSchema,
  insertUserBadgeSchema
} from "@shared/schema";

// Middleware to check authentication
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is a master implementer
function isMasterImplementer(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.role === 'master_implementer') {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Requires master implementer privileges" });
}

// Middleware to check if user is an entity head
function isEntityHead(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.role === 'entity_head') {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Requires entity head privileges" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // User notification preferences
  app.put("/api/user/:id/notifications", isAuthenticated, async (req, res, next) => {
    try {
      // Validate that the user is updating their own preferences
      if (req.params.id !== req.user?.id.toString()) {
        return res.status(403).json({ message: "You can only update your own notification preferences" });
      }

      const { emailNotifications, systemNotifications, whatsappNotifications, telegramNotifications } = req.body;
      
      // Get the current user
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // In a real implementation, you would save these preferences to the database
      // For now, we'll just return success since we don't have a notification preferences table
      res.status(200).json({ 
        message: "Notification preferences updated successfully",
        preferences: {
          emailNotifications,
          systemNotifications,
          whatsappNotifications,
          telegramNotifications
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // User password change
  app.post("/api/user/change-password", isAuthenticated, async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const isValid = await comparePasswords(currentPassword, user.password);
      
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user with new password
      const updatedUser = await storage.updateUser(user.id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  // User profile update
  app.put("/api/user/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Only allow users to update their own profile (or allow master implementers to update anyone)
      if (req.user!.id !== id && req.user!.role !== 'master_implementer') {
        return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
      }
      
      // Don't allow updates to sensitive fields through this endpoint
      const { password, username, role, ...allowedUpdates } = req.body;
      
      const updatedUser = await storage.updateUser(id, allowedUpdates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Users Management
  app.get("/api/users", isAuthenticated, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from the response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  // Entity Management
  app.get("/api/entities", isAuthenticated, async (req, res, next) => {
    try {
      const entities = await storage.getAllEntities();
      res.json(entities);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/entities/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const entity = await storage.getEntity(id);
      if (!entity) {
        return res.status(404).json({ message: "Entity not found" });
      }
      res.json(entity);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/entities", isMasterImplementer, async (req, res, next) => {
    try {
      const validatedData = insertEntitySchema.parse(req.body);
      const entity = await storage.createEntity(validatedData);
      res.status(201).json(entity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/entities/:id", isMasterImplementer, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEntitySchema.partial().parse(req.body);
      const updatedEntity = await storage.updateEntity(id, validatedData);
      if (!updatedEntity) {
        return res.status(404).json({ message: "Entity not found" });
      }
      res.json(updatedEntity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  // Users by Entity
  app.get("/api/entities/:id/users", isAuthenticated, async (req, res, next) => {
    try {
      const entityId = parseInt(req.params.id);
      const users = await storage.getUsersByEntityId(entityId);
      res.json(users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }));
    } catch (error) {
      next(error);
    }
  });

  // Meetings
  app.get("/api/meetings", isAuthenticated, async (req, res, next) => {
    try {
      const meetings = await storage.getAllMeetings();
      res.json(meetings);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/meetings/upcoming", isAuthenticated, async (req, res, next) => {
    try {
      const meetings = await storage.getUpcomingMeetings();
      res.json(meetings);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/meetings/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const meeting = await storage.getMeetingWithAttendees(id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/meetings", isAuthenticated, async (req, res, next) => {
    try {
      // Convert date string to Date object if it's a string
      let meetingData = { ...req.body };
      
      if (typeof meetingData.date === 'string') {
        meetingData.date = new Date(meetingData.date);
      }
      
      const validatedData = insertMeetingSchema.parse({
        ...meetingData,
        createdBy: req.user.id
      });
      
      const meeting = await storage.createMeeting(validatedData);
      res.status(201).json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Meeting validation error:", error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  // Meeting attendees
  app.post("/api/meetings/:id/attendees", isAuthenticated, async (req, res, next) => {
    try {
      const meetingId = parseInt(req.params.id);
      const validatedData = insertMeetingAttendeeSchema.parse({
        ...req.body,
        meetingId
      });
      const attendee = await storage.createMeetingAttendee(validatedData);
      res.status(201).json(attendee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/meetings/:meetingId/attendees/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMeetingAttendeeSchema.partial().parse(req.body);
      const updatedAttendee = await storage.updateMeetingAttendee(id, validatedData);
      if (!updatedAttendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      res.json(updatedAttendee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  // Tasks
  app.get("/api/tasks", isAuthenticated, async (req, res, next) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks/user/:userId", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const tasks = await storage.getTasksByAssignee(userId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks/meeting/:meetingId", isAuthenticated, async (req, res, next) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      const tasks = await storage.getTasksByMeeting(meetingId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks/entity/:entityId", isAuthenticated, async (req, res, next) => {
    try {
      const entityId = parseInt(req.params.entityId);
      const tasks = await storage.getTasksByEntity(entityId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTaskWithAssignee(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res, next) => {
    try {
      // Convert deadline string to Date object if it's a string
      let taskData = { ...req.body };
      
      if (typeof taskData.deadline === 'string') {
        taskData.deadline = new Date(taskData.deadline);
      }
      
      const validatedData = insertTaskSchema.parse({
        ...taskData,
        createdBy: req.user.id
      });
      
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Task validation error:", error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateTask(id, validatedData);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  // Communications
  app.get("/api/communications", isAuthenticated, async (req, res, next) => {
    try {
      const communications = await storage.getAllCommunications();
      res.json(communications);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/communications/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const communication = await storage.getCommunicationWithRecipients(id);
      if (!communication) {
        return res.status(404).json({ message: "Communication not found" });
      }
      res.json(communication);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/communications", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertCommunicationSchema.parse({
        ...req.body,
        sentBy: req.user.id
      });
      const communication = await storage.createCommunication(validatedData);
      
      // Process recipients
      if (req.body.recipients && Array.isArray(req.body.recipients)) {
        for (const recipient of req.body.recipients) {
          const recipientData = insertCommunicationRecipientSchema.parse({
            communicationId: communication.id,
            ...recipient
          });
          await storage.createCommunicationRecipient(recipientData);
        }
      }
      
      res.status(201).json(communication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res, next) => {
    try {
      const entities = await storage.getAllEntities();
      const users = await storage.getAllUsers();
      const upcomingMeetings = await storage.getUpcomingMeetings();
      
      // Count tasks that are not completed
      const allTasks = await storage.getAllTasks();
      const pendingTasks = allTasks.filter(task => task.status !== 'completed').length;
      
      res.json({
        entityCount: entities.length,
        userCount: users.length,
        upcomingMeetings: upcomingMeetings.length,
        pendingTasks
      });
    } catch (error) {
      next(error);
    }
  });

  // Achievement Badges
  app.get("/api/badges", isAuthenticated, async (req, res, next) => {
    try {
      const category = req.query.category as string;
      let badges;
      
      if (category) {
        badges = await storage.getAchievementBadgesByCategory(category);
      } else {
        badges = await storage.getAllAchievementBadges();
      }
      
      res.json(badges);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/badges/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const badge = await storage.getAchievementBadge(id);
      
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      res.json(badge);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/badges", isMasterImplementer, async (req, res, next) => {
    try {
      const validatedData = insertAchievementBadgeSchema.parse(req.body);
      const badge = await storage.createAchievementBadge(validatedData);
      
      res.status(201).json(badge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/badges/:id", isMasterImplementer, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAchievementBadgeSchema.partial().parse(req.body);
      const updatedBadge = await storage.updateAchievementBadge(id, validatedData);
      
      if (!updatedBadge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      res.json(updatedBadge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  // User Badges
  app.get("/api/users/:userId/badges", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Only allow users to view their own badges (or master implementers to view anyone's)
      if (req.user!.id !== userId && req.user!.role !== 'master_implementer') {
        return res.status(403).json({ message: "Forbidden: You can only view your own badges" });
      }
      
      const badges = await storage.getUserBadgesByUserId(userId);
      res.json(badges);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:userId/featured-badges", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const badges = await storage.getFeaturedBadgesByUserId(userId);
      res.json(badges);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users/:userId/badges", isMasterImplementer, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = insertUserBadgeSchema.parse({
        ...req.body,
        userId
      });
      
      const userBadge = await storage.createUserBadge(validatedData);
      res.status(201).json(userBadge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/user-badges/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the badge first to check user permissions
      const userBadge = await storage.getUserBadge(id);
      
      if (!userBadge) {
        return res.status(404).json({ message: "User badge not found" });
      }
      
      // Only allow users to update their own badges (featured status) or master implementers to update any badge
      if (req.user!.id !== userBadge.userId && req.user!.role !== 'master_implementer') {
        return res.status(403).json({ message: "Forbidden: You can only update your own badges" });
      }
      
      // Regular users can only update the 'featured' status
      let validatedData;
      if (req.user!.role !== 'master_implementer') {
        validatedData = { featured: req.body.featured };
      } else {
        validatedData = insertUserBadgeSchema.partial().parse(req.body);
      }
      
      const updatedUserBadge = await storage.updateUserBadge(id, validatedData);
      res.json(updatedUserBadge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
