import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { 
  sendNewMemberWelcomeEmail, 
  sendPasswordResetEmail,
  sendMeetingInvitationEmail,
  sendMeetingInvitationsToAllAttendees
} from "./email-service";
import { sendMessage, sendMessageWithFallback, sendMessageToAll, MessageChannel } from "./messaging-service";
import { 
  isAuthenticated, 
  isMasterImplementer, 
  isEntityHead, 
  hasEntityAccess,
  hasSubjectAccess,
  hasMeetingAccess,
  hasTaskAccess,
  hasAnalyticsAccess
} from "./auth-middleware";
import { ActivityLogger } from "./activity-logger";
// Import the improved CSV import functions
import { importEntitiesFromCSV, importEntityMembersFromCSV } from "./entity-csv-improved";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { eq, sql, desc } from "drizzle-orm";
import { 
  insertEntitySchema, 
  insertMeetingSchema, 
  insertMeetingAttendeeSchema,
  insertMeetingReactionSchema,
  insertTaskSchema,
  insertSubjectSchema,
  insertCommunicationSchema,
  insertCommunicationRecipientSchema,
  insertAchievementBadgeSchema,
  insertUserBadgeSchema,
  // Add table references for analytics and logging
  users as usersTable,
  entities as entitiesTable,
  meetings as meetingsTable,
  tasks as tasksTable,
  subjects as subjectsTable,
  communications as communicationsTable,
  communicationRecipients as communicationRecipientsTable,
  meetingAttendees as meetingAttendeesTable,
  meetingDocuments as meetingDocumentsTable,
  taskComments as taskCommentsTable,
  userActivityLogs
} from "@shared/schema";

// Import auth middleware from auth-middleware.ts instead of using local definitions

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Return the Twilio WhatsApp number for frontend display (no sensitive info)
  app.get("/api/twilio-whatsapp-number", (req, res) => {
    const number = process.env.TWILIO_WHATSAPP_NUMBER || null;
    res.json({ number });
  });
  
  // Test WhatsApp number formatting and validity
  app.post("/api/test-whatsapp-number", isAuthenticated, (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    
    // Import formatPhoneNumber and isValidWhatsAppNumber from whatsapp-service
    const { formatPhoneNumber, isValidWhatsAppNumber } = require('./whatsapp-service');
    
    const formattedNumber = formatPhoneNumber(phoneNumber);
    const isValid = isValidWhatsAppNumber(formattedNumber);
    
    res.json({
      original: phoneNumber,
      formatted: formattedNumber,
      isValid,
      twilioFormat: isValid ? `whatsapp:${formattedNumber}` : null
    });
  });
  
  // User Activity Logs Endpoints
  app.get("/api/activity-logs", isMasterImplementer, async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const filters: {
        userId?: number;
        action?: typeof userActionEnum.enumValues[number];
        entityType?: string;
        fromDate?: Date;
        toDate?: Date;
      } = {};
      
      // Parse query parameters
      if (req.query.userId) {
        filters.userId = parseInt(req.query.userId as string);
      }
      
      if (req.query.action && userActionEnum.enumValues.includes(req.query.action as any)) {
        filters.action = req.query.action as typeof userActionEnum.enumValues[number];
      }
      
      if (req.query.entityType) {
        filters.entityType = req.query.entityType as string;
      }
      
      if (req.query.fromDate) {
        filters.fromDate = new Date(req.query.fromDate as string);
      }
      
      if (req.query.toDate) {
        filters.toDate = new Date(req.query.toDate as string);
      }
      
      // Use the enhanced ActivityLogger method to get logs with user details
      const result = await ActivityLogger.getAllActivityLogs(limit, offset, filters);
      
      // Log the request for audit purposes
      ActivityLogger.log(
        req.user!.id,
        'view',
        'Viewed activity logs',
        'activity_logs',
        undefined,
        req,
        filters
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Get activity logs for the authenticated user
  app.get("/api/my-activity-logs", isAuthenticated, async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const filters: {
        action?: typeof userActionEnum.enumValues[number];
        entityType?: string;
        fromDate?: Date;
        toDate?: Date;
      } = {};
      
      // Parse query parameters
      if (req.query.action && userActionEnum.enumValues.includes(req.query.action as any)) {
        filters.action = req.query.action as typeof userActionEnum.enumValues[number];
      }
      
      if (req.query.entityType) {
        filters.entityType = req.query.entityType as string;
      }
      
      if (req.query.fromDate) {
        filters.fromDate = new Date(req.query.fromDate as string);
      }
      
      if (req.query.toDate) {
        filters.toDate = new Date(req.query.toDate as string);
      }
      
      // Use the enhanced ActivityLogger method to get logs for the current user
      const result = await ActivityLogger.getUserActivityLogs(req.user!.id, limit, offset, filters);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Get activity logs for a specific entity
  app.get("/api/entities/:id/activity-logs", isEntityHead, async (req, res, next) => {
    try {
      const entityId = parseInt(req.params.id);
      
      // Entity heads can only view logs for their own entity
      if (req.user!.role === 'entity_head' && req.user!.entityId !== entityId) {
        return res.status(403).json({ message: 'Forbidden: You can only view logs for your own entity' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Get users in the entity
      const entityUsers = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.entityId, entityId));
      
      const userIds = entityUsers.map(user => user.id);
      
      // No users found in the entity
      if (userIds.length === 0) {
        return res.json({
          logs: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false
          }
        });
      }
      
      // Get logs for all users in the entity
      const logs = await db
        .select()
        .from(userActivityLogs)
        .where(sql`user_id IN (${userIds.join(',')})`)
        .orderBy(desc(userActivityLogs.timestamp))
        .limit(limit)
        .offset(offset);
      
      // Get total count
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(userActivityLogs)
        .where(sql`user_id IN (${userIds.join(',')})`);
      
      const total = Number(countResult[0].count);
      
      // Get user details for each log
      const logsWithUserDetails = await Promise.all(
        logs.map(async (log) => {
          const user = await storage.getUser(log.userId);
          return {
            ...log,
            userDetails: user ? {
              username: user.username,
              fullName: user.fullName,
              email: user.email,
              role: user.role
            } : null
          };
        })
      );
      
      // Log the request for audit purposes
      ActivityLogger.log(
        req.user!.id,
        'view',
        `Viewed activity logs for entity ${entityId}`,
        'entity_logs',
        entityId,
        req
      );
      
      res.json({
        logs: logsWithUserDetails,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + logs.length < total
        }
      });
    } catch (error) {
      next(error);
    }
  });

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
  
  // Meeting Reactions routes
  app.get("/api/meetings/:id/reactions", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }
      
      const reactions = await storage.getMeetingReactionsByMeetingId(id);
      res.json(reactions);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/meetings/:id/reactions", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meeting ID" });
      }
      
      const userId = req.user!.id;
      const { emoji } = req.body;
      
      if (!emoji) {
        return res.status(400).json({ message: "emoji is required" });
      }
      
      // Check if the user already reacted with this emoji
      const existingReaction = await storage.getMeetingReactionByMeetingAndUser(
        id,
        userId,
        emoji
      );
      
      if (existingReaction) {
        // If reaction already exists, delete it (toggle behavior)
        await storage.deleteMeetingReaction(existingReaction.id);
        return res.status(200).json({ message: "Reaction removed", removed: true });
      }
      
      // Create new reaction
      const newReaction = await storage.createMeetingReaction({
        meetingId: id,
        userId,
        emoji
      });
      
      // Log user activity
      ActivityLogger.log(
        userId,
        'create',
        `Added reaction to meeting with ID ${id}`,
        'meeting_reaction',
        id,
        req
      );
      
      res.status(201).json(newReaction);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a reaction by ID
  app.delete("/api/meetings/:meetingId/reactions/:id", isAuthenticated, async (req, res, next) => {
    try {
      const meetingId = parseInt(req.params.meetingId);
      const reactionId = parseInt(req.params.id);
      
      if (isNaN(meetingId) || isNaN(reactionId)) {
        return res.status(400).json({ message: "Invalid IDs provided" });
      }
      
      // Check if the reaction exists
      const reaction = await storage.getMeetingReaction(reactionId);
      
      if (!reaction) {
        return res.status(404).json({ message: "Reaction not found" });
      }
      
      // Verify that the reaction belongs to the specified meeting
      if (reaction.meetingId !== meetingId) {
        return res.status(400).json({ message: "Reaction does not belong to the specified meeting" });
      }
      
      // Check if the user owns the reaction or is a master implementer
      if (reaction.userId !== req.user!.id && req.user!.role !== 'master_implementer') {
        return res.status(403).json({ message: "You can only delete your own reactions" });
      }
      
      const deleted = await storage.deleteMeetingReaction(reactionId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete reaction" });
      }
      
      // Log user activity
      ActivityLogger.log(
        req.user!.id,
        'delete',
        `Removed reaction from meeting with ID ${meetingId}`,
        'meeting_reaction',
        meetingId,
        req
      );
      
      res.status(200).json({ message: "Reaction deleted successfully" });
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
      
      // Create the meeting
      const meeting = await storage.createMeeting(validatedData);
      
      // If attendees were provided in the request, add them to the meeting
      if (req.body.attendees && Array.isArray(req.body.attendees) && req.body.attendees.length > 0) {
        console.log(`Processing ${req.body.attendees.length} attendees for meeting ${meeting.id}`);
        
        // Create a list of attendee promises
        const attendeePromises = req.body.attendees.map(async (attendeeData) => {
          try {
            // Extract the user ID from the attendee data
            const userId = typeof attendeeData === 'number' 
              ? attendeeData 
              : (attendeeData.userId || attendeeData.id);
              
            if (!userId) {
              console.error('Invalid attendee data, missing userId:', attendeeData);
              return null;
            }
            
            // Create the attendee record
            try {
              const attendee = await storage.createMeetingAttendee({
                meetingId: meeting.id,
                userId: userId,
                confirmed: typeof attendeeData === 'object' ? (attendeeData.confirmed || false) : false
              });
              
              return attendee;
            } catch (dbError) {
              // Handle unique constraint violations
              if (dbError.code === '23505') { // PostgreSQL unique constraint violation
                console.log(`Skipping duplicate attendee with userId ${userId} for meeting ${meeting.id}`);
                
                // Get the existing attendee record
                const existingAttendees = await storage.getMeetingAttendeesByMeetingId(meeting.id);
                const duplicateAttendee = existingAttendees.find(
                  existing => existing.userId === userId
                );
                
                // Return the existing attendee so we still send them an email
                return duplicateAttendee || null;
              }
              
              // Re-throw other errors
              throw dbError;
            }
          } catch (error) {
            // Log any errors but continue processing other attendees
            console.error(`Error adding attendee to meeting ${meeting.id}:`, error);
            return null;
          }
        });
        
        const attendees = await Promise.all(attendeePromises);
        
        // Get the organizer name
        const organizer = await storage.getUser(req.user.id);
        const organizerName = organizer ? (organizer.fullName || organizer.username) : 'Meeting Organizer';
        
        // Send invitation emails to all attendees
        try {
          // First, fetch the full user details for each attendee
          const attendeesWithUsers = await Promise.all(
            attendees
              .filter(attendee => attendee !== null) // Filter out null attendees
              .map(async (attendee) => {
                if (attendee && attendee.userId) {
                  const user = await storage.getUser(attendee.userId);
                  return { ...attendee, user };
                }
                return attendee;
              })
          );
          
          // Send the invitations
          const emailResult = await sendMeetingInvitationsToAllAttendees(
            meeting,
            attendeesWithUsers,
            organizerName
          );
          
          console.log(`Meeting invitations sent: ${emailResult.success} successful, ${emailResult.failed} failed`);
          
          // Log the activity
          ActivityLogger.log(
            req.user.id,
            'create',
            `Created meeting '${meeting.name}' and sent ${emailResult.success} invitations`,
            'meeting',
            meeting.id,
            req
          );
        } catch (emailError) {
          console.error('Error sending meeting invitations:', emailError);
          // Continue with the response even if emails fail
        }
      } else {
        // Log meeting creation without attendees
        ActivityLogger.log(
          req.user.id,
          'create',
          `Created meeting '${meeting.name}' without attendees`,
          'meeting',
          meeting.id,
          req
        );
      }
      
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
      
      // Create the attendee record
      let attendee;
      try {
        attendee = await storage.createMeetingAttendee(validatedData);
      } catch (error) {
        // Handle unique constraint violations
        if (error.code === '23505') { // PostgreSQL unique constraint violation
          // Find the existing attendee to return in the response
          const existingAttendees = await storage.getMeetingAttendeesByMeetingId(meetingId);
          const duplicateAttendee = existingAttendees.find(
            existing => existing.userId === validatedData.userId
          );
          
          return res.status(400).json({
            message: "This user is already an attendee of this meeting",
            attendee: duplicateAttendee
          });
        }
        // Re-throw other errors
        throw error;
      }
      
      // Get the meeting
      const meeting = await storage.getMeeting(meetingId);
      
      if (meeting && attendee.userId) {
        // Get the user details
        const user = await storage.getUser(attendee.userId);
        
        // Get the meeting organizer's name
        const organizer = await storage.getUser(meeting.createdBy);
        const organizerName = organizer ? (organizer.fullName || organizer.username) : 'Meeting Organizer';
        
        // Send invitation email if the user has an email
        if (user && user.email) {
          try {
            await sendMeetingInvitationEmail(
              user.email,
              user.fullName || user.username,
              meeting,
              organizerName
            );
            
            console.log(`Sent meeting invitation to ${user.email} for meeting ${meeting.name}`);
            
            // Log the activity
            ActivityLogger.log(
              req.user!.id,
              'create',
              `Added attendee ${user.fullName || user.username} to meeting '${meeting.name}' and sent invitation`,
              'meeting_attendee',
              attendee.id,
              req
            );
          } catch (emailError) {
            console.error('Error sending meeting invitation:', emailError);
            // Continue with the response even if email fails
          }
        } else {
          console.log(`No email available for user ID ${attendee.userId}, invitation not sent`);
        }
      }
      
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
        
        // Check for recipients without WhatsApp numbers when WhatsApp is the primary channel
        const recipientsWithoutWhatsApp = [];
        if (channel === 'whatsapp') {
          for (const recipient of recipientList) {
            if (!recipient.contactInfo.whatsapp) {
              recipientsWithoutWhatsApp.push(recipient.name);
            }
          }
          
          if (recipientsWithoutWhatsApp.length > 0) {
            console.log(`Warning: ${recipientsWithoutWhatsApp.length} recipients don't have WhatsApp numbers configured:`);
            recipientsWithoutWhatsApp.forEach(name => console.log(`- ${name}`));
          }
        }
        
        // Only send messages immediately if no file attachments are expected
        // If files will be attached, the message will be sent after file upload
        if (!req.body.expectAttachments) {
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
          
          // Include information about recipients without WhatsApp in the response
          communication.recipientsWithoutWhatsApp = recipientsWithoutWhatsApp;
        } else {
          console.log(`Skipping immediate message sending as file attachments are expected for communication ${communication.id}`);
        }
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
            sql`UPDATE communications SET has_attachments = true WHERE id = ${communicationId}`
          );
          
          console.log(`Successfully updated communication ${communicationId} to set hasAttachments=true`);
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
                      email: entity.headEmail, // Use the head's email which we know exists
                      whatsapp: undefined, // Entity might not have WhatsApp
                      telegram: undefined, // Entity might not have Telegram
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
      
      // Send invitation emails with the attached documents
      const sendEmails = req.body.sendEmails === 'true';
      if (sendEmails) {
        try {
          // Get the meeting attendees
          const attendeeRecords = await storage.getMeetingAttendeesByMeetingId(meetingId);
          
          if (attendeeRecords && attendeeRecords.length > 0) {
            // Get the organizer name
            const organizer = await storage.getUser(meeting.createdBy);
            const organizerName = organizer ? (organizer.fullName || organizer.username) : 'Meeting Organizer';
            
            // Add user info to attendees
            const attendeesWithUsers = await Promise.all(
              attendeeRecords.map(async (attendee) => {
                if (attendee.userId) {
                  const user = await storage.getUser(attendee.userId);
                  return { ...attendee, user };
                }
                return attendee;
              })
            );
            
            console.log(`Sending meeting invitations with ${uploadedDocuments.length} documents to ${attendeesWithUsers.length} attendees`);
            
            // Send the invitations with documents included
            const emailResult = await sendMeetingInvitationsToAllAttendees(
              meeting,
              attendeesWithUsers,
              organizerName
            );
            
            console.log(`Meeting invitations with documents sent: ${emailResult.success} successful, ${emailResult.failed} failed`);
          } else {
            console.log(`No attendees found for meeting ${meetingId}, skipping email notifications`);
          }
        } catch (error) {
          console.error("Error sending meeting invitations after document upload:", error);
          // Continue with the response even if email sending fails
        }
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
      
      // Check if this is an embed request (for in-browser viewing) or a download
      const isEmbed = req.query.embed === 'true';
      
      // Set appropriate headers based on request type
      if (!isEmbed) {
        // For downloads, set content disposition to attachment
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
      } else {
        // For embedding/preview, set content disposition to inline
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
      }
      
      // Set the content type header
      if (file.type) {
        res.setHeader('Content-Type', file.type);
      }
      
      // For PDFs being embedded, set additional headers to help with browser viewing
      if (isEmbed && file.type === 'application/pdf') {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
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
  
  app.post("/api/users/badges/mark-seen", isAuthenticated, async (req, res, next) => {
    try {
      const { badgeIds } = req.body;
      
      if (!Array.isArray(badgeIds) || badgeIds.length === 0) {
        return res.status(400).json({ message: "Invalid badgeIds: must be a non-empty array of badge IDs" });
      }
      
      await storage.markUserBadgesAsSeen(badgeIds);
      
      // Log that badges were marked as seen
      await ActivityLogger.log(
        req.user!.id,
        'update',
        `Marked ${badgeIds.length} badges as seen`,
        'badge',
        null,
        req,
        { badgeIds }
      );
      
      res.status(200).json({ success: true, message: `${badgeIds.length} badges marked as seen` });
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

  // Analytics Routes
  app.get("/api/analytics", isAuthenticated, async (req, res, next) => {
    try {
      const timeRange = req.query.timeRange || '6months';
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      // Calculate date range based on the selected time range
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === '30days') {
        startDate.setDate(now.getDate() - 30);
      } else if (timeRange === '3months') {
        startDate.setMonth(now.getMonth() - 3);
      } else if (timeRange === '6months') {
        startDate.setMonth(now.getMonth() - 6);
      } else if (timeRange === '12months') {
        startDate.setMonth(now.getMonth() - 12);
      }
      
      // Fetch all communications for the time period
      let communicationsQuery = await db.select()
        .from(communicationsTable)
        .where(sql`sent_at >= ${startDate.toISOString()}`);
        
      // If not a master implementer, filter by entity access
      if (userRole !== 'master_implementer') {
        const entityId = req.user!.entityId;
        if (entityId) {
          // Only include communications where the user's entity is a recipient
          const entityRecipients = await db.select()
            .from(communicationRecipientsTable)
            .where(eq(communicationRecipientsTable.entityId, entityId));
          
          const entityComIds = entityRecipients.map(r => r.communicationId);
          communicationsQuery = communicationsQuery.filter(c => entityComIds.includes(c.id));
        } else {
          // Only include communications where the user is a sender or recipient
          const userRecipients = await db.select()
            .from(communicationRecipientsTable)
            .where(eq(communicationRecipientsTable.userId, userId));
          
          const userComIds = userRecipients.map(r => r.communicationId);
          communicationsQuery = communicationsQuery.filter(c => 
            c.sentBy === userId || userComIds.includes(c.id)
          );
        }
      }
      
      // Fetch tasks for the time period
      let tasksQuery = await db.select()
        .from(tasksTable)
        .where(sql`created_at >= ${startDate.toISOString()}`);
        
      // If not a master implementer, filter by access
      if (userRole !== 'master_implementer') {
        const entityId = req.user!.entityId;
        if (entityId) {
          // Only include tasks related to the user's entity
          tasksQuery = tasksQuery.filter(t => t.entityId === entityId);
        } else {
          // Only include tasks owned by the user or created by the user
          tasksQuery = tasksQuery.filter(t => 
            t.ownerId === userId || t.createdBy === userId
          );
        }
      }
      
      // Fetch meetings for the time period
      let meetingsQuery = await db.select()
        .from(meetingsTable)
        .where(sql`created_at >= ${startDate.toISOString()}`);
        
      // If not a master implementer, filter by access
      if (userRole !== 'master_implementer') {
        // Get meetings where user is an attendee
        const userAttendance = await db.select()
          .from(meetingAttendeesTable)
          .where(eq(meetingAttendeesTable.userId, userId));
        
        const userMeetingIds = userAttendance.map(a => a.meetingId);
        meetingsQuery = meetingsQuery.filter(m => 
          m.createdBy === userId || userMeetingIds.includes(m.id)
        );
      }
      
      // Generate monthly data for trends
      const months = [];
      const completionRates = [];
      
      // Get last 6 months regardless of the selected time range for the charts
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(now.getMonth() - i);
        const monthName = monthDate.toLocaleString('default', { month: 'long' });
        months.push(monthName);
        
        // Calculate task completion rate for this month
        const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthTasks = tasksQuery.filter(t => {
          const taskDate = new Date(t.createdAt);
          return taskDate >= startOfMonth && taskDate <= endOfMonth;
        });
        
        const completedTasks = monthTasks.filter(t => t.status === 'completed');
        const completionRate = monthTasks.length > 0 ? completedTasks.length / monthTasks.length : 0;
        
        completionRates.push({
          month: monthName,
          completionRate
        });
      }
      
      // Calculate activity trends
      const activityTrends = months.map((month, index) => {
        const monthDate = new Date();
        monthDate.setMonth(now.getMonth() - (5 - index));
        const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        // Count activities for this month
        const communications = communicationsQuery.filter(c => {
          const date = new Date(c.sentAt);
          return date >= startOfMonth && date <= endOfMonth;
        }).length;
        
        const tasks = tasksQuery.filter(t => {
          const date = new Date(t.createdAt);
          return date >= startOfMonth && date <= endOfMonth;
        }).length;
        
        const meetings = meetingsQuery.filter(m => {
          const date = new Date(m.createdAt);
          return date >= startOfMonth && date <= endOfMonth;
        }).length;
        
        return {
          month,
          communications,
          tasks,
          meetings
        };
      });
      
      // Calculate task status distribution
      const pendingTasks = tasksQuery.filter(t => t.status === 'pending').length;
      const inProgressTasks = tasksQuery.filter(t => t.status === 'in_progress').length;
      const completedTasks = tasksQuery.filter(t => t.status === 'completed').length;
      const cancelledTasks = tasksQuery.filter(t => t.status === 'cancelled').length;
      
      const taskStatusDistribution = [
        { status: 'Pending', count: pendingTasks },
        { status: 'In Progress', count: inProgressTasks },
        { status: 'Completed', count: completedTasks },
        { status: 'Cancelled', count: cancelledTasks }
      ];
      
      // Calculate channel distribution
      const emailMessages = communicationsQuery.filter(c => c.channel === 'email').length;
      const whatsappMessages = communicationsQuery.filter(c => c.channel === 'whatsapp').length;
      const telegramMessages = communicationsQuery.filter(c => c.channel === 'telegram').length;
      const systemMessages = communicationsQuery.filter(c => c.channel === 'system_notification').length;
      
      const channelDistribution = [
        { channel: 'Email', count: emailMessages },
        { channel: 'WhatsApp', count: whatsappMessages },
        { channel: 'Telegram', count: telegramMessages },
        { channel: 'System', count: systemMessages }
      ];
      
      // Calculate performance metrics
      // 1. Average task completion days
      const completedTasksWithDates = tasksQuery.filter(t => t.status === 'completed' && t.completedAt);
      let totalCompletionDays = 0;
      
      for (const task of completedTasksWithDates) {
        const createdDate = new Date(task.createdAt);
        const completedDate = new Date(task.completedAt!);
        const diffTime = Math.abs(completedDate.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalCompletionDays += diffDays;
      }
      
      const avgTaskCompletionDays = completedTasksWithDates.length > 0 
        ? totalCompletionDays / completedTasksWithDates.length 
        : 0;
      
      // 2. Average meeting attendance
      const meetingAttendees = await db.select()
        .from(meetingAttendeesTable);
      
      const meetingsWithAttendees = meetingsQuery.map(meeting => {
        const attendees = meetingAttendees.filter(a => a.meetingId === meeting.id);
        const confirmedAttendees = attendees.filter(a => a.confirmed === true);
        const attendedAttendees = attendees.filter(a => a.attended === true);
        
        return {
          ...meeting,
          totalAttendees: attendees.length,
          confirmedAttendees: confirmedAttendees.length,
          attendedAttendees: attendedAttendees.length
        };
      });
      
      let totalAttendanceRate = 0;
      const meetingsWithAttendance = meetingsWithAttendees.filter(m => m.totalAttendees > 0);
      
      for (const meeting of meetingsWithAttendance) {
        totalAttendanceRate += meeting.attendedAttendees / meeting.totalAttendees;
      }
      
      const avgMeetingAttendance = meetingsWithAttendance.length > 0 
        ? totalAttendanceRate / meetingsWithAttendance.length 
        : 0;
      
      // 3. Communications per month
      const totalCommunications = communicationsQuery.length;
      const communicationsPerMonth = totalCommunications / (timeRange === '30days' ? 1 : 
                                    timeRange === '3months' ? 3 : 
                                    timeRange === '6months' ? 6 : 12);
      
      // 4. Tasks per month
      const totalTasks = tasksQuery.length;
      const tasksPerMonth = totalTasks / (timeRange === '30days' ? 1 : 
                           timeRange === '3months' ? 3 : 
                           timeRange === '6months' ? 6 : 12);
      
      // 5. Meetings per month
      const totalMeetings = meetingsQuery.length;
      const meetingsPerMonth = totalMeetings / (timeRange === '30days' ? 1 : 
                              timeRange === '3months' ? 3 : 
                              timeRange === '6months' ? 6 : 12);
      
      // Calculate task insights
      const overdueTasks = tasksQuery.filter(t => {
        return t.status !== 'completed' && t.status !== 'cancelled' && 
               new Date(t.deadline) < new Date();
      }).length;
      
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(now.getMonth() - 1);
      lastMonthStart.setDate(1);
      
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(0);
      
      const completedLastMonth = tasksQuery.filter(t => {
        if (t.status !== 'completed' || !t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= lastMonthStart && completedDate <= lastMonthEnd;
      }).length;
      
      const taskInsights = {
        totalActive: pendingTasks + inProgressTasks,
        completedLastMonth,
        overdue: overdueTasks,
        avgCompletionDays: avgTaskCompletionDays
      };
      
      // Calculate communication insights
      // Get all communication recipients
      const communicationRecipients = await db.select()
        .from(communicationRecipientsTable);
      
      const totalRecipients = communicationRecipients.length;
      const readRecipients = communicationRecipients.filter(r => r.read === true).length;
      const readRate = totalRecipients > 0 ? readRecipients / totalRecipients : 0;
      
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthMessages = communicationsQuery.filter(c => {
        const sentDate = new Date(c.sentAt);
        return sentDate >= thisMonthStart && sentDate <= now;
      }).length;
      
      const communicationInsights = {
        total: totalCommunications,
        totalRecipients,
        thisMonth: thisMonthMessages,
        readRate
      };
      
      // Compile and send the analytics data
      const analyticsData = {
        performanceMetrics: {
          avgTaskCompletionDays,
          avgMeetingAttendance,
          communicationsPerMonth,
          tasksPerMonth,
          meetingsPerMonth
        },
        activityTrends,
        completionRates,
        taskStatusDistribution,
        channelDistribution,
        taskInsights,
        communicationInsights
      };
      
      res.json(analyticsData);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/analytics/entities", isAuthenticated, async (req, res, next) => {
    try {
      // Only master implementers can access entity analytics
      if (req.user!.role !== 'master_implementer') {
        return res.status(403).json({ message: "Access denied. Only master implementers can access entity analytics." });
      }
      
      const timeRange = req.query.timeRange || '6months';
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === '30days') {
        startDate.setDate(now.getDate() - 30);
      } else if (timeRange === '3months') {
        startDate.setMonth(now.getMonth() - 3);
      } else if (timeRange === '6months') {
        startDate.setMonth(now.getMonth() - 6);
      } else if (timeRange === '12months') {
        startDate.setMonth(now.getMonth() - 12);
      }
      
      // Get all entities
      const allEntities = await db.select().from(entitiesTable);
      
      // Get all communications
      const allCommunications = await db.select()
        .from(communicationsTable)
        .where(sql`sent_at >= ${startDate.toISOString()}`);
      
      // Get all communication recipients
      const allCommunicationRecipients = await db.select()
        .from(communicationRecipientsTable);
      
      // Get all tasks
      const allTasks = await db.select()
        .from(tasksTable)
        .where(sql`created_at >= ${startDate.toISOString()}`);
      
      // Calculate entity activity
      const entityActivity = allEntities.map(entity => {
        // Communication count (where this entity is a recipient)
        const entityComRecipients = allCommunicationRecipients.filter(r => r.entityId === entity.id);
        const communicationCount = entityComRecipients.length;
        
        // Task count (tasks assigned to this entity)
        const entityTasks = allTasks.filter(t => t.entityId === entity.id);
        const taskCount = entityTasks.length;
        
        return {
          id: entity.id,
          name: entity.name,
          type: entity.type,
          communicationCount,
          taskCount,
          totalActivity: communicationCount + taskCount
        };
      });
      
      // Sort by most active
      const mostActive = [...entityActivity].sort((a, b) => b.totalActivity - a.totalActivity).slice(0, 5);
      
      // Sort by communication count
      const byCommunication = [...entityActivity].sort((a, b) => b.communicationCount - a.communicationCount).slice(0, 5);
      
      // Sort by task count
      const byTasks = [...entityActivity].sort((a, b) => b.taskCount - a.taskCount).slice(0, 5);
      
      res.json({
        entityActivity,
        mostActive,
        byCommunication,
        byTasks
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/analytics/export", isAuthenticated, async (req, res, next) => {
    try {
      const timeRange = req.query.timeRange || '6months';
      
      // Only master implementers can export data
      if (req.user!.role !== 'master_implementer') {
        return res.status(403).json({ message: "Access denied. Only master implementers can export analytics data." });
      }
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === '30days') {
        startDate.setDate(now.getDate() - 30);
      } else if (timeRange === '3months') {
        startDate.setMonth(now.getMonth() - 3);
      } else if (timeRange === '6months') {
        startDate.setMonth(now.getMonth() - 6);
      } else if (timeRange === '12months') {
        startDate.setMonth(now.getMonth() - 12);
      }
      
      // Get all communications for the time period
      const communications = await db.select()
        .from(communicationsTable)
        .where(sql`sent_at >= ${startDate.toISOString()}`);
      
      // Get all tasks for the time period
      const tasks = await db.select()
        .from(tasksTable)
        .where(sql`created_at >= ${startDate.toISOString()}`);
      
      // Get all meetings for the time period
      const meetings = await db.select()
        .from(meetingsTable)
        .where(sql`created_at >= ${startDate.toISOString()}`);
      
      // Generate CSV data
      let csvData = 'Type,Date,Subject/Title,Status,Channel/Location,Created By\n';
      
      // Add communications to CSV
      for (const comm of communications) {
        const date = new Date(comm.sentAt).toISOString().split('T')[0];
        const createdBy = await storage.getUser(comm.sentBy);
        const creatorName = createdBy ? createdBy.fullName : 'Unknown';
        
        csvData += `Communication,${date},"${comm.subject}",Sent,${comm.channel},"${creatorName}"\n`;
      }
      
      // Add tasks to CSV
      for (const task of tasks) {
        const date = new Date(task.createdAt).toISOString().split('T')[0];
        const createdBy = await storage.getUser(task.createdBy);
        const creatorName = createdBy ? createdBy.fullName : 'Unknown';
        
        csvData += `Task,${date},"${task.title}",${task.status},N/A,"${creatorName}"\n`;
      }
      
      // Add meetings to CSV
      for (const meeting of meetings) {
        const date = new Date(meeting.date).toISOString().split('T')[0];
        const createdBy = await storage.getUser(meeting.createdBy);
        const creatorName = createdBy ? createdBy.fullName : 'Unknown';
        
        csvData += `Meeting,${date},"${meeting.name}",Scheduled,${meeting.location || 'Not specified'},"${creatorName}"\n`;
      }
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
      
      // Send the CSV data
      res.send(csvData);
    } catch (error) {
      next(error);
    }
  });

  // Admin endpoint to truncate communications and files
  app.post("/api/admin/cleanup-database", isMasterImplementer, async (req, res, next) => {
    try {
      // Get the user who initiated this action for logging
      const userId = req.user!.id;
      const adminUser = await storage.getUser(userId);
      
      // Add timestamp to log message
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Database cleanup initiated by ${adminUser?.username} (ID: ${userId})`);
      
      // Get counts for all tables before truncation
      const communicationsCount = await db.select({ count: sql`count(*)` }).from(communicationsTable);
      const communicationRecipientsCount = await db.select({ count: sql`count(*)` }).from(communicationRecipientsTable);
      const communicationFilesCount = await db.select({ count: sql`count(*)` }).from(communicationFilesTable);
      const tasksCount = await db.select({ count: sql`count(*)` }).from(tasksTable);
      const taskCommentsCount = await db.select({ count: sql`count(*)` }).from(taskCommentsTable);
      const meetingsCount = await db.select({ count: sql`count(*)` }).from(meetingsTable);
      const meetingAttendeesCount = await db.select({ count: sql`count(*)` }).from(meetingAttendeesTable);
      const meetingDocumentsCount = await db.select({ count: sql`count(*)` }).from(meetingDocumentsTable);
      
      // Execute the truncation
      const result = await storage.truncateCommunicationsAndFiles();
      
      // Use ActivityLogger to log this important maintenance action
      await ActivityLogger.log(
        req.user!.id,
        'delete',
        `Database cleanup performed: ${result.message}`,
        'database_maintenance',
        undefined,
        req,
        {
          success: result.success,
          tablesAffected: result.tablesAffected,
          timestamp,
          countsBeforeTruncation: {
            communications: Number(communicationsCount[0].count),
            communicationRecipients: Number(communicationRecipientsCount[0].count),
            communicationFiles: Number(communicationFilesCount[0].count),
            tasks: Number(tasksCount[0].count),
            taskComments: Number(taskCommentsCount[0].count),
            meetings: Number(meetingsCount[0].count),
            meetingAttendees: Number(meetingAttendeesCount[0].count),
            meetingDocuments: Number(meetingDocumentsCount[0].count)
          }
        }
      );
      
      // Log the result
      console.log(`[${timestamp}] Database cleanup completed: ${result.message}`);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint to get database table statistics
  app.get("/api/admin/database-stats", isMasterImplementer, async (req, res, next) => {
    try {
      // Get counts from all tables
      const [
        usersCount,
        entitiesCount,
        subjectsCount,
        tasksCount,
        meetingsCount,
        communicationsCount,
        communicationRecipientsCount,
        communicationFilesCount
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(usersTable).then(result => result[0].count),
        db.select({ count: sql<number>`count(*)` }).from(entitiesTable).then(result => result[0].count),
        db.select({ count: sql<number>`count(*)` }).from(subjectsTable).then(result => result[0].count),
        db.select({ count: sql<number>`count(*)` }).from(tasksTable).then(result => result[0].count),
        db.select({ count: sql<number>`count(*)` }).from(meetingsTable).then(result => result[0].count),
        db.select({ count: sql<number>`count(*)` }).from(communicationsTable).then(result => result[0].count),
        db.select({ count: sql<number>`count(*)` }).from(communicationRecipientsTable).then(result => result[0].count),
        db.execute(sql`SELECT COUNT(*) AS count FROM communication_files`).then(result => result.rows ? result.rows[0].count : 0)
      ]);
      
      // Return statistics
      res.json({
        users: usersCount,
        entities: entitiesCount,
        subjects: subjectsCount,
        tasks: tasksCount,
        meetings: meetingsCount,
        communications: communicationsCount,
        communicationRecipients: communicationRecipientsCount,
        communicationFiles: communicationFilesCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/activity", hasAnalyticsAccess, async (req, res, next) => {
    try {
      // Get activity data for the last 30 days by default
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get overall activity count by day
      const activityByDay = await db.select({
        date: sql`date_trunc('day', timestamp)`,
        count: sql`count(*)`
      })
      .from(userActivityLogs)
      .where(sql`timestamp >= ${startDate.toISOString()}`)
      .groupBy(sql`date_trunc('day', timestamp)`)
      .orderBy(sql`date_trunc('day', timestamp)`);
      
      // Get activity by type
      const activityByType = await db.select({
        action: userActivityLogs.action,
        count: sql`count(*)`
      })
      .from(userActivityLogs)
      .where(sql`timestamp >= ${startDate.toISOString()}`)
      .groupBy(userActivityLogs.action)
      .orderBy(sql`count(*)`, 'desc');
      
      // Get activity by user (top 10 most active users)
      const activityByUser = await db.select({
        userId: userActivityLogs.userId,
        count: sql`count(*)`
      })
      .from(userActivityLogs)
      .where(sql`timestamp >= ${startDate.toISOString()}`)
      .groupBy(userActivityLogs.userId)
      .orderBy(sql`count(*)`, 'desc')
      .limit(10);
      
      // Get user details for the top users
      const usersWithDetails = await Promise.all(
        activityByUser.map(async (item) => {
          const user = await storage.getUser(item.userId);
          return {
            userId: item.userId,
            count: item.count,
            username: user?.username,
            fullName: user?.fullName,
            role: user?.role
          };
        })
      );
      
      // Get activity by entity type
      const activityByEntityType = await db.select({
        entityType: userActivityLogs.entityType,
        count: sql`count(*)`
      })
      .from(userActivityLogs)
      .where(sql`timestamp >= ${startDate.toISOString()}`)
      .groupBy(userActivityLogs.entityType)
      .orderBy(sql`count(*)`, 'desc');
      
      // Entity-specific analytics for entity heads
      let entitySpecificData = null;
      if (req.user?.role === 'entity_head' && req.user?.entityId) {
        // Get users in the entity
        const entityUsers = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.entityId, req.user.entityId));
        
        const userIds = entityUsers.map(user => user.id);
        
        if (userIds.length > 0) {
          // Get activity count by user within the entity
          const entityActivityByUser = await db.select({
            userId: userActivityLogs.userId,
            count: sql`count(*)`
          })
          .from(userActivityLogs)
          .where(sql`user_id IN (${userIds.join(',')})`)
          .andWhere(sql`timestamp >= ${startDate.toISOString()}`)
          .groupBy(userActivityLogs.userId)
          .orderBy(sql`count(*)`, 'desc');
          
          // Get user details for the entity users
          const entityUsersWithDetails = await Promise.all(
            entityActivityByUser.map(async (item) => {
              const user = await storage.getUser(item.userId);
              return {
                userId: item.userId,
                count: item.count,
                username: user?.username,
                fullName: user?.fullName,
                role: user?.role
              };
            })
          );
          
          entitySpecificData = {
            entityId: req.user.entityId,
            userActivity: entityUsersWithDetails
          };
        }
      }
      
      res.json({
        activityByDay,
        activityByType,
        activityByUser: usersWithDetails,
        activityByEntityType,
        entitySpecificData,
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/analytics/communication-channels", hasAnalyticsAccess, async (req, res, next) => {
    try {
      // Get channel distribution analytics
      const channelDistribution = await db.select({
        channel: communicationsTable.channel,
        count: sql`count(*)`
      })
      .from(communicationsTable)
      .groupBy(communicationsTable.channel)
      .orderBy(sql`count(*)`, 'desc');
      
      // Get success rate by channel
      const successByChannel = await db.select({
        channel: communicationsTable.channel,
        success: sql`SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)`,
        total: sql`count(*)`,
        rate: sql`CAST(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS FLOAT) / count(*)`
      })
      .from(communicationsTable)
      .groupBy(communicationsTable.channel)
      .orderBy(communicationsTable.channel);
      
      // Get communication trends over time
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const communicationTrends = await db.select({
        date: sql`date_trunc('day', sent_at)`,
        count: sql`count(*)`
      })
      .from(communicationsTable)
      .where(sql`sent_at >= ${startDate.toISOString()}`)
      .groupBy(sql`date_trunc('day', sent_at)`)
      .orderBy(sql`date_trunc('day', sent_at)`);
      
      res.json({
        channelDistribution,
        successByChannel,
        communicationTrends,
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Configure CSV file upload storage
  const csvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'csv');
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Create a unique filename with original extension
      const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });
  
  // Create CSV upload middleware
  const csvUpload = multer({
    storage: csvStorage,
    fileFilter: (req, file, cb) => {
      // Check file type
      if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
        return cb(new Error('Only CSV files are allowed'));
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
  });
  
  // Entity CSV import endpoint - for importing just entity data
  app.post("/api/entities/import", isMasterImplementer, csvUpload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Log the file upload activity
      await ActivityLogger.logUpload(
        req.user!.id,
        'Entity CSV import file',
        'entity_import',
        undefined,
        req
      );
      
      // Process the entity CSV file
      const results = await importEntitiesFromCSV(req.file.path, req.user!.id);
      
      // Calculate summary counts
      const entitiesCreated = results.newEntities ? results.newEntities.length : 0;
      
      console.log(`Entity import complete: ${entitiesCreated} entities created`);
      
      // Return the results
      res.status(200).json({
        message: "Entity import completed",
        totalProcessed: results.totalProcessed,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        entitiesCreated: entitiesCreated,
        entityDetails: results.newEntities.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          headName: e.headName,
          headEmail: e.headEmail
        }))
      });
    } catch (error) {
      console.error("Error importing entities:", error);
      
      // Clean up the file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        message: "Error importing entities",
        error: (error as Error).message
      });
    }
  });
  
  // Entity Members CSV import endpoint - for importing members for an existing entity
  app.post("/api/entities/:entityId/members/import", [isMasterImplementer, hasEntityAccess], csvUpload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const entityId = parseInt(req.params.entityId);
      if (isNaN(entityId)) {
        return res.status(400).json({ message: "Invalid entity ID" });
      }
      
      // Check if entity exists
      const entity = await db.select().from(entitiesTable).where(eq(entitiesTable.id, entityId)).limit(1);
      if (entity.length === 0) {
        return res.status(404).json({ message: "Entity not found" });
      }
      
      // Log the file upload activity
      await ActivityLogger.logUpload(
        req.user!.id,
        'Members CSV import file',
        'member_import',
        entityId,
        req
      );
      
      // Process the members CSV file 
      const results = await importEntityMembersFromCSV(req.file.path, entityId, req.user!.id);
      
      // Calculate summary counts
      const usersCreated = results.newUsers ? results.newUsers.length : 0;
      
      console.log(`Member import complete: ${usersCreated} members created for entity ${entityId}`);
      
      // Return the results
      res.status(200).json({
        message: "Entity members import completed",
        entityId: entityId,
        entityName: entity[0].name,
        totalProcessed: results.totalProcessed,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        usersCreated: usersCreated,
        userDetails: results.newUsers.map(u => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          position: u.position,
          tempPassword: u.tempPassword // Include temporary passwords in response
        }))
      });
    } catch (error) {
      console.error("Error importing entity members:", error);
      
      // Clean up the file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        message: "Error importing entity members",
        error: (error as Error).message
      });
    }
  });
  
  // Standalone Entity Members CSV import endpoint - uses entityId from request body
  app.post("/api/entities/members/import", isMasterImplementer, csvUpload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Get entityId from form data
      const entityId = parseInt(req.body.entityId);
      if (isNaN(entityId)) {
        return res.status(400).json({ message: "Invalid entity ID" });
      }
      
      // Check if entity exists
      const entity = await db.select().from(entitiesTable).where(eq(entitiesTable.id, entityId)).limit(1);
      if (entity.length === 0) {
        return res.status(404).json({ message: "Entity not found" });
      }
      
      // Log the file upload activity
      await ActivityLogger.logUpload(
        req.user!.id,
        'Members CSV import file',
        'member_import',
        entityId,
        req
      );
      
      // Process the members CSV file 
      const results = await importEntityMembersFromCSV(req.file.path, entityId, req.user!.id);
      
      // Calculate summary counts
      const usersCreated = results.newUsers ? results.newUsers.length : 0;
      
      console.log(`Member import complete: ${usersCreated} members created for entity ${entityId}`);
      
      // Return the results
      res.status(200).json({
        message: "Entity members import completed",
        entityId: entityId,
        entityName: entity[0].name,
        totalProcessed: results.totalProcessed,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        usersCreated: usersCreated,
        userDetails: results.newUsers.map(u => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          position: u.position,
          tempPassword: u.tempPassword // Include temporary passwords in response
        }))
      });
    } catch (error) {
      console.error("Error importing entity members:", error);
      
      // Clean up the file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        message: "Error importing entity members",
        error: (error as Error).message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
