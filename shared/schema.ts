import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['master_implementer', 'entity_head', 'entity_member']);
export const entityTypeEnum = pgEnum('entity_type', ['secretariat', 'administrative_unit', 'external_entity', 'government_agency', 'association', 'council']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const communicationChannelEnum = pgEnum('communication_channel', ['email', 'whatsapp', 'telegram', 'system_notification']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default('entity_member'),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  telegram: text("telegram"),
  position: text("position"),
  entityId: integer("entity_id").references(() => entities.id),
});

// Entities table
export const entities = pgTable("entities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: entityTypeEnum("type").notNull(),
  headName: text("head_name").notNull(),
  headPosition: text("head_position").notNull(),
  headEmail: text("head_email").notNull(),
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  socialMedia: text("social_media"),
  tags: text("tags").array(),
});

// Meetings table
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  agenda: text("agenda").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location"),
  subject: text("subject"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Meeting attendees
export const meetingAttendees = pgTable("meeting_attendees", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetings.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  confirmed: boolean("confirmed").default(false),
  attended: boolean("attended").default(false),
});

// Meeting documents
export const meetingDocuments = pgTable("meeting_documents", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetings.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'minutes', 'attachment', 'image', 'recording'
  filePath: text("file_path").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  deadline: timestamp("deadline").notNull(),
  status: taskStatusEnum("status").default('pending').notNull(),
  assignedTo: integer("assigned_to").references(() => users.id).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  entityId: integer("entity_id").references(() => entities.id),
  meetingId: integer("meeting_id").references(() => meetings.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Task comments
export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Communications table
export const communications = pgTable("communications", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  channel: communicationChannelEnum("channel").notNull(),
  sentBy: integer("sent_by").references(() => users.id).notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// Communication recipients
export const communicationRecipients = pgTable("communication_recipients", {
  id: serial("id").primaryKey(),
  communicationId: integer("communication_id").references(() => communications.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  entityId: integer("entity_id").references(() => entities.id),
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
});

// Zod insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertEntitySchema = createInsertSchema(entities).omit({ id: true });
export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true });
export const insertMeetingAttendeeSchema = createInsertSchema(meetingAttendees).omit({ id: true });
export const insertMeetingDocumentSchema = createInsertSchema(meetingDocuments).omit({ id: true, uploadedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, createdAt: true });
export const insertCommunicationSchema = createInsertSchema(communications).omit({ id: true, sentAt: true });
export const insertCommunicationRecipientSchema = createInsertSchema(communicationRecipients).omit({ id: true, readAt: true });

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Entity = typeof entities.$inferSelect;

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

export type InsertMeetingAttendee = z.infer<typeof insertMeetingAttendeeSchema>;
export type MeetingAttendee = typeof meetingAttendees.$inferSelect;

export type InsertMeetingDocument = z.infer<typeof insertMeetingDocumentSchema>;
export type MeetingDocument = typeof meetingDocuments.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof taskComments.$inferSelect;

export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communications.$inferSelect;

export type InsertCommunicationRecipient = z.infer<typeof insertCommunicationRecipientSchema>;
export type CommunicationRecipient = typeof communicationRecipients.$inferSelect;

// Auth types
export type LoginCredentials = {
  username: string;
  password: string;
};

// Utility types
export type UserWithEntity = User & { entity?: Entity };
export type MeetingWithAttendees = Meeting & { attendees: MeetingAttendee[] };
export type TaskWithAssignee = Task & { assignee: User };
export type CommunicationWithRecipients = Communication & { recipients: CommunicationRecipient[] };
