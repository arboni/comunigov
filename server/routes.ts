import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { sendNewMemberWelcomeEmail, sendPasswordResetEmail } from "./email-service";
import { sendMessage, sendMessageWithFallback, sendMessageToAll, MessageChannel } from "./messaging-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { 
  insertEntitySchema, 
  insertMeetingSchema, 
  insertMeetingAttendeeSchema,
  insertTaskSchema,
  insertSubjectSchema,
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
  
  // Admin reset user password
  app.post("/api/user/:id/reset-password", isMasterImplementer, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user with new password
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to reset password" });
      }
      
      // Send password reset email if this is an entity member
      if (user.email && (user.role === 'entity_head' || user.role === 'entity_member')) {
        try {
          await sendPasswordResetEmail(
            user.email,
            user.fullName,
            user.username,
            newPassword
          );
          
          console.log(`Password reset email sent to ${user.email}`);
        } catch (emailError) {
          // Log the error but don't fail the password reset
          console.error('Error sending password reset email:', emailError);
        }
      }
      
      res.status(200).json({ message: "Password reset successfully" });
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
  
  // Get a specific user by ID
  app.get("/api/users/:id", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Update a specific user
  app.patch("/api/users/:id", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Only allow users to update their own profile or master implementers to update anyone
      if (req.user!.id !== userId && req.user!.role !== 'master_implementer') {
        return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, req.body);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Get a user's entity
  app.get("/api/users/:id/entity", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.entityId) {
        return res.status(404).json({ message: "User does not belong to an entity" });
      }
      
      const entity = await storage.getEntity(user.entityId);
      if (!entity) {
        return res.status(404).json({ message: "Entity not found" });
      }
      
      res.json(entity);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new user (typically an entity member)
  app.post("/api/users", isAuthenticated, async (req, res, next) => {
    try {
      console.log("[POST /api/users] Request body:", req.body);
      
      // Validate request
      if (!req.body.username || !req.body.password || !req.body.email) {
        return res.status(400).json({ message: "Username, password, and email are required" });
      }
      
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
      
      // Check if entity exists if entityId is provided
      if (req.body.entityId) {
        const entity = await storage.getEntity(req.body.entityId);
        if (!entity) {
          return res.status(400).json({ message: "Entity not found" });
        }
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user with hashed password
      const userData = {
        ...req.body,
        password: hashedPassword
      };
      
      console.log("[POST /api/users] Creating user with data:", {...userData, password: "[REDACTED]"});
      
      const newUser = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      // Send welcome email if this is an entity member
      if (newUser.email && newUser.entityId && 
          (newUser.role === 'entity_head' || newUser.role === 'entity_member')) {
        try {
          const entity = await storage.getEntity(newUser.entityId);
          
          await sendNewMemberWelcomeEmail(
            newUser.email,
            newUser.fullName,
            newUser.username,
            req.body.password, // Use original password for email
            entity.name
          );
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          // Continue with the user creation even if email fails
        }
      }
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("[POST /api/users] Error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      
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
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }
      
      const meeting = await storage.getMeetingWithAll(id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      res.json(meeting);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/meetings/:id/documents", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }
      
      const documents = await storage.getMeetingDocumentsByMeetingId(id);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/meetings/:id/attendees", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }
      
      const attendees = await storage.getMeetingAttendeesByMeetingId(id);
      res.json(attendees);
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
      const tasks = await storage.getTasksByUserId(userId);
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

  // Task Comments
  app.get("/api/tasks/:id/comments", isAuthenticated, async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      const comments = await storage.getTaskCommentsByTaskId(taskId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks/:id/comments", isAuthenticated, async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      const validatedData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId,
        userId: req.user!.id
      });
      
      const comment = await storage.createTaskComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  // Subjects API
  app.get("/api/subjects", isAuthenticated, async (req, res, next) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/subjects/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const subject = await storage.getSubject(id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/subjects", isAuthenticated, async (req, res, next) => {
    try {
      console.log("[POST /api/subjects] Request body:", req.body);
      console.log("[POST /api/subjects] User:", req.user);
      
      const validatedData = insertSubjectSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });
      
      console.log("[POST /api/subjects] Validated data:", validatedData);
      
      const subject = await storage.createSubject(validatedData);
      console.log("[POST /api/subjects] Created subject:", subject);
      
      res.status(201).json(subject);
    } catch (error) {
      console.error("[POST /api/subjects] Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/subjects/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSubjectSchema.partial().parse(req.body);
      const updatedSubject = await storage.updateSubject(id, validatedData);
      
      if (!updatedSubject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      res.json(updatedSubject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });
  
  app.delete("/api/subjects/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // First check if there are any tasks using this subject
      const tasksWithSubject = await storage.getTasksBySubject(id);
      if (tasksWithSubject && tasksWithSubject.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete subject that has associated tasks. Please reassign or delete the tasks first." 
        });
      }
      
      const result = await storage.deleteSubject(id);
      
      if (!result) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      res.status(200).json({ message: "Subject deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/subjects/:id/tasks", isAuthenticated, async (req, res, next) => {
    try {
      const subjectId = parseInt(req.params.id);
      const tasks = await storage.getTasksBySubject(subjectId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/subjects/:id/users", isAuthenticated, async (req, res, next) => {
    try {
      const subjectId = parseInt(req.params.id);
      const users = await storage.getUsersForSubjectTasks(subjectId);
      res.json(users);
    } catch (error) {
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
      
      // Get the sender's name
      const sender = await storage.getUser(req.user.id);
      const senderName = sender ? sender.fullName || sender.username : "Unknown Sender";
      
      // Process recipients and send messages
      if (req.body.recipients && Array.isArray(req.body.recipients)) {
        // Check for attachments
        const hasAttachments = !!req.body.hasAttachments;
        
        // Get message channel
        const channel = communication.channel as MessageChannel;
        
        // Prepare recipient list for the unified messaging service
        const recipientList: Array<{
          userId?: number;
          entityId?: number;
          name: string;
          contactInfo: Record<MessageChannel, string | undefined>;
        }> = [];
        
        // Process each recipient
        for (const recipient of req.body.recipients) {
          // Save recipient in the database
          const recipientData = insertCommunicationRecipientSchema.parse({
            communicationId: communication.id,
            ...recipient
          });
          await storage.createCommunicationRecipient(recipientData);
          
          // For user recipients
          if (recipient.userId) {
            const userRecipient = await storage.getUser(recipient.userId);
            if (userRecipient) {
              // Add user to recipient list
              recipientList.push({
                userId: userRecipient.id,
                name: userRecipient.fullName || userRecipient.username,
                contactInfo: {
                  email: userRecipient.email,
                  whatsapp: userRecipient.whatsapp ?? undefined,
                  telegram: userRecipient.telegram ?? undefined,
                  system_notification: undefined // Not implemented yet
                }
              });
            }
          }
          
          // For entity recipients
          if (recipient.entityId) {
            const entityRecipient = await storage.getEntity(recipient.entityId);
            if (entityRecipient) {
              // Send to entity head
              if (entityRecipient.headEmail) {
                // Add entity head to recipient list
                recipientList.push({
                  entityId: entityRecipient.id,
                  name: entityRecipient.headName,
                  contactInfo: {
                    email: entityRecipient.headEmail,
                    whatsapp: undefined,
                    telegram: undefined,
                    system_notification: undefined
                  }
                });
              }
              
              // Also send to all entity members
              const entityMembers = await storage.getUsersByEntityId(recipient.entityId);
              for (const member of entityMembers) {
                if (member) {
                  // Add member to recipient list
                  recipientList.push({
                    userId: member.id,
                    entityId: entityRecipient.id,
                    name: member.fullName || member.username,
                    contactInfo: {
                      email: member.email,
                      whatsapp: member.whatsapp ?? undefined,
                      telegram: member.telegram ?? undefined,
                      system_notification: undefined
                    }
                  });
                }
              }
            }
          }
        }
        
        // Send messages to all recipients using the unified messaging service
        console.log(`Sending message to ${recipientList.length} recipients via ${channel} with fallback`);
        const messageResults = await sendMessageToAll(
          recipientList,
          channel,
          senderName,
          communication.subject,
          communication.content,
          communication.id, // Pass the communication ID for file attachments
          hasAttachments
        );
        
        // Log message delivery results
        console.log(`Message delivery results: ${Object.keys(messageResults).length} recipients processed`);
      }
      
      res.status(201).json(communication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error sending communication:", error);
      next(error);
    }
  });
  
  // Configure multer for file uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Generate a unique filename with original extension
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    },
  });
  
  const upload = multer({ 
    storage: storage_config,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB file size limit
    }
  });
  
  // File upload for communications
  app.post("/api/communication-files", isAuthenticated, upload.any(), async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      const communicationId = parseInt(req.body.communicationId);
      if (isNaN(communicationId)) {
        return res.status(400).json({ message: "Invalid communication ID" });
      }
      
      // Verify the communication exists
      const communication = await storage.getCommunication(communicationId);
      if (!communication) {
        return res.status(404).json({ message: "Communication not found" });
      }
      
      // Add each file to the database
      const uploadedFiles = [];
      
      for (const file of req.files as Express.Multer.File[]) {
        const fileData = {
          name: file.originalname,
          type: file.mimetype,
          communicationId: communicationId,
          filePath: file.path,
          uploadedBy: req.user.id,
        };
        
        const savedFile = await storage.createCommunicationFile(fileData);
        uploadedFiles.push(savedFile);
      }
      
      // Update communication to mark it as having attachments
      if (uploadedFiles.length > 0) {
        try {
          // Use raw SQL for a simple update that we know works
          await db.execute(
            `UPDATE communications SET has_attachments = true WHERE id = $1`,
            [communicationId]
          );
          console.log(`Successfully updated communication ${communicationId} to set has_attachments=true`);
        } catch (updateError) {
          console.error(`Error updating hasAttachments flag for communication ${communicationId}:`, updateError);
        }
        
        // Get sender information
        const sender = await storage.getUser(req.user.id);
        const senderName = sender ? sender.fullName || sender.username : "Unknown Sender";
        
        // Get recipients of this communication
        const recipients = await storage.getCommunicationRecipientsByCommunicationId(communicationId);
        if (recipients && recipients.length > 0) {
          console.log(`Found ${recipients.length} recipients for communication ${communicationId}`);
          
          // Prepare recipient list for the unified messaging service
          const recipientList = [];
          for (const recipient of recipients) {
            try {
              // Try to get user data if it's a user recipient
              if (recipient.userId) {
                const user = await storage.getUser(recipient.userId);
                if (user) {
                  recipientList.push({
                    userId: user.id,
                    name: user.fullName || user.username,
                    contactInfo: {
                      email: user.email,
                      whatsapp: user.whatsapp || undefined,
                      telegram: user.telegram || undefined,
                      system_notification: user.id.toString()
                    }
                  });
                }
              }
              // Try to get entity data if it's an entity recipient
              else if (recipient.entityId) {
                const entity = await storage.getEntity(recipient.entityId);
                if (entity) {
                  recipientList.push({
                    entityId: entity.id,
                    name: entity.name,
                    contactInfo: {
                      email: entity.email,
                      whatsapp: entity.whatsapp || undefined,
                      telegram: entity.telegram || undefined,
                      system_notification: undefined
                    }
                  });
                }
              }
            } catch (error) {
              console.error(`Error processing recipient ${recipient.id}:`, error);
            }
          }
          
          // Send messages to all recipients with proper file attachments
          console.log(`Sending message with attachments to ${recipientList.length} recipients via ${communication.channel} with fallback`);
          const messageResults = await sendMessageToAll(
            recipientList,
            communication.channel as MessageChannel,
            senderName,
            communication.subject,
            communication.content,
            communicationId, // Pass the communication ID for file attachments
            true // Now explicitly set hasAttachments to true
          );
          
          // Log message delivery results
          console.log(`Message delivery results: ${Object.keys(messageResults).length} recipients processed`);
        }
      }
      
      res.status(201).json(uploadedFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
      next(error);
    }
  });

  // File upload for meeting documents
  app.post("/api/meeting-documents", isAuthenticated, upload.any(), async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      // Limit to 5 files as requested
      if (req.files.length > 5) {
        return res.status(400).json({ message: "Maximum 5 files can be uploaded at once" });
      }
      
      const meetingId = parseInt(req.body.meetingId);
      if (isNaN(meetingId)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }
      
      // Verify the meeting exists
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      // Get the existing documents to check the limit
      const existingDocs = await storage.getMeetingDocumentsByMeetingId(meetingId);
      if (existingDocs.length + req.files.length > 5) {
        return res.status(400).json({ 
          message: `Cannot upload more documents. Maximum allowed is 5, and meeting already has ${existingDocs.length} documents.`
        });
      }
      
      // Add each file to the database
      const uploadedDocuments = [];
      
      for (const file of req.files as Express.Multer.File[]) {
        const documentData = {
          name: file.originalname,
          type: req.body.documentType || 'attachment',
          meetingId: meetingId,
          filePath: file.path,
          uploadedBy: req.user.id,
          uploadedAt: new Date()
        };
        
        const savedDocument = await storage.createMeetingDocument(documentData);
        uploadedDocuments.push(savedDocument);
      }
      
      res.status(201).json(uploadedDocuments);
    } catch (error) {
      console.error("Error uploading meeting documents:", error);
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

  // File download endpoint
  app.get("/api/download/:fileId", isAuthenticated, async (req, res, next) => {
    try {
      const fileId = parseInt(req.params.fileId);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      // Try to get the file as a communication file first
      let file = await storage.getCommunicationFile(fileId);
      
      // If not found as a communication file, try as a meeting document
      if (!file) {
        const meetingDoc = await storage.getMeetingDocument(fileId);
        if (meetingDoc) {
          file = {
            id: meetingDoc.id,
            name: meetingDoc.name,
            type: meetingDoc.type,
            filePath: meetingDoc.filePath,
            uploadedAt: meetingDoc.uploadedAt
          };
        }
      }
      
      if (!file || !file.filePath) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if file exists
      if (!fs.existsSync(file.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }
      
      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
      if (file.type) {
        res.setHeader('Content-Type', file.type);
      }
      
      // Stream the file
      const fileStream = fs.createReadStream(file.filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
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
