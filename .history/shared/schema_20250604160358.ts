import { mysqlTable, text, int, boolean, timestamp, mysqlEnum, json, unique } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = mysqlEnum('role', ['master_implementer', 'entity_head', 'entity_member']);
export const entityTypeEnum = mysqlEnum('entity_type', ['secretariat', 'administrative_unit', 'external_entity', 'government_agency', 'association', 'council']);
export const taskStatusEnum = mysqlEnum('task_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const communicationChannelEnum = mysqlEnum('communication_channel', ['email', 'whatsapp', 'telegram', 'system_notification']);
export const emojiTypeEnum = mysqlEnum('emoji_type', ['👍', '👎', '❤️', '🎉', '🤔', '😄', '😢', '👏']);
export const publicHearingStatusEnum = mysqlEnum('public_hearing_status', ['scheduled', 'in_progress', 'completed', 'cancelled']);
export const userActionEnum = mysqlEnum('user_action', ['login', 'logout', 'view', 'create', 'update', 'delete', 'send', 'download', 'upload']);

// Users table
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum.notNull().default('entity_member'), // <--- aqui!
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  telegram: text("telegram"),
  position: text("position"),
  entityId: int("entity_id").references(() => entities.id),
  requirePasswordChange: boolean("require_password_change").default(false),
});


// Entities table
export const entities = mysqlTable("entities", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  type: entityTypeEnum.notNull(), // <-- corrigido aqui!
  headName: text("head_name").notNull(),
  headPosition: text("head_position").notNull(),
  headEmail: text("head_email").notNull(),
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  socialMedia: text("social_media"),
  tags: json("tags"),
});

// Meetings table
export const meetings = mysqlTable("meetings", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  agenda: text("agenda").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location"),
  subject: text("subject"),
  isRegisteredSubject: boolean("is_registered_subject").default(false),
  subjectId: int("subject_id").references(() => subjects.id),
  createdBy: int("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Meeting attendees
export const meetingAttendees = mysqlTable("meeting_attendees", {
  id: int("id").primaryKey().autoincrement(),
  meetingId: int("meeting_id").references(() => meetings.id).notNull(),
  userId: int("user_id").references(() => users.id).notNull(),
  confirmed: boolean("confirmed").default(false),
  attended: boolean("attended").default(false),
}, (table) => {
  return {
    // Add a unique constraint to prevent duplicate attendees
    unq: unique().on(table.meetingId, table.userId),
  };
});

// Meeting documents
export const meetingDocuments = mysqlTable("meeting_documents", {
  id: int("id").primaryKey().autoincrement(),
  meetingId: int("meeting_id").references(() => meetings.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'minutes', 'attachment', 'image', 'recording'
  filePath: text("file_path").notNull(),
  uploadedBy: int("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Meeting reactions (quick emoji reactions)
export const meetingReactions = mysqlTable("meeting_reactions", {
  id: int("id").primaryKey().autoincrement(),
  meetingId: int("meeting_id").references(() => meetings.id).notNull(),
  userId: int("user_id").references(() => users.id).notNull(),
  emoji: emojiTypeEnum.notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subjects table
export const subjects = mysqlTable("subjects", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: int("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subject-Entity junction table for many-to-many relationship
export const subjectEntities = mysqlTable("subject_entities", {
  id: int("id").primaryKey().autoincrement(),
  subjectId: int("subject_id").references(() => subjects.id).notNull(),
  entityId: int("entity_id").references(() => entities.id).notNull(),
}, (table) => {
  return {
    unq: unique().on(table.subjectId, table.entityId),
  };
});

// Tasks table
export const tasks = mysqlTable("tasks", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  deadline: timestamp("deadline").notNull(),
  status: taskStatusEnum.default('pending').notNull(),
  subjectId: int("subject_id").references(() => subjects.id).notNull(),
  // For registered users as owners
  isRegisteredUser: boolean("is_registered_user").default(true).notNull(),
  assignedToUserId: int("assigned_to_user_id").references(() => users.id),
  // For non-registered users as owners
  ownerName: text("owner_name"),
  ownerEmail: text("owner_email"),
  ownerPhone: text("owner_phone"),
  
  createdBy: int("created_by").references(() => users.id).notNull(),
  entityId: int("entity_id").references(() => entities.id),
  meetingId: int("meeting_id").references(() => meetings.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Task comments
export const taskComments = mysqlTable("task_comments", {
  id: int("id").primaryKey().autoincrement(),
  taskId: int("task_id").references(() => tasks.id).notNull(),
  userId: int("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Communications table
export const communications = mysqlTable("communications", {
  id: int("id").primaryKey().autoincrement(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  channel: communicationChannelEnum("channel").notNull(),
  sentBy: int("sent_by").references(() => users.id).notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  hasAttachments: boolean("has_attachments").default(false).notNull(),
});

// Communication recipients
export const communicationRecipients = mysqlTable("communication_recipients", {
  id: int("id").primaryKey().autoincrement(),
  communicationId: int("communication_id").references(() => communications.id).notNull(),
  userId: int("user_id").references(() => users.id),
  entityId: int("entity_id").references(() => entities.id),
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
});

// Communication file attachments
export const communicationFiles = mysqlTable("communication_files", {
  id: int("id").primaryKey().autoincrement(),
  communicationId: int("communication_id").references(() => communications.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  filePath: text("file_path").notNull(),
  uploadedBy: int("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Achievement badges
export const achievementBadges = mysqlTable("achievement_badges", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // icon identifier (will be mapped to an icon component)
  category: text("category").notNull(), // 'communication', 'meetings', 'tasks', 'participation', etc.
  level: int("level").notNull(), // 1, 2, 3, etc. for badge progression
  criteria: json("criteria").notNull(), // JSON object with criteria to earn the badge
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User earned badges
export const userBadges = mysqlTable("user_badges", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id).notNull(),
  badgeId: int("badge_id").references(() => achievementBadges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  progress: json("progress"), // JSON object tracking progress towards earning the badge
  featured: boolean("featured").default(false), // if the user wants to feature this badge on their profile
  seen: boolean("seen").default(false), // tracks whether the user has seen this badge notification
});

// Public Hearings table
export const publicHearings = mysqlTable("public_hearings", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location").notNull(),
  status: publicHearingStatusEnum("status").default('scheduled').notNull(),
  entityId: int("entity_id").references(() => entities.id).notNull(), // Primary entity responsible for the hearing
  createdBy: int("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Public Hearing documents/files
export const publicHearingFiles = mysqlTable("public_hearing_files", {
  id: int("id").primaryKey().autoincrement(),
  publicHearingId: int("public_hearing_id").references(() => publicHearings.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'agenda', 'minutes', 'attachment', 'presentation', etc.
  filePath: text("file_path").notNull(),
  uploadedBy: int("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// User activity logs
export const userActivityLogs = mysqlTable("user_activity_logs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id).notNull(),
  action: userActionEnum("action").notNull(),
  description: text("description").notNull(),
  entityType: text("entity_type").notNull(), // Type of entity affected (user, meeting, task, etc.)
  entityId: int("entity_id"), // ID of the affected entity
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: json("metadata"), // Additional context information
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Zod insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertEntitySchema = createInsertSchema(entities).omit({ id: true });
export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true });
export const insertMeetingAttendeeSchema = createInsertSchema(meetingAttendees).omit({ id: true });
export const insertMeetingDocumentSchema = createInsertSchema(meetingDocuments).omit({ id: true, uploadedAt: true });
export const insertMeetingReactionSchema = createInsertSchema(meetingReactions).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
export const insertSubjectEntitySchema = createInsertSchema(subjectEntities).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, createdAt: true });
export const insertCommunicationSchema = createInsertSchema(communications).omit({ id: true, sentAt: true });
export const insertCommunicationRecipientSchema = createInsertSchema(communicationRecipients).omit({ id: true, readAt: true });
export const insertCommunicationFileSchema = createInsertSchema(communicationFiles).omit({ id: true, uploadedAt: true });
export const insertPublicHearingSchema = createInsertSchema(publicHearings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPublicHearingFileSchema = createInsertSchema(publicHearingFiles).omit({ id: true, uploadedAt: true });
export const insertAchievementBadgeSchema = createInsertSchema(achievementBadges).omit({ id: true, createdAt: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, earnedAt: true });
export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({ id: true, timestamp: true });

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

export type InsertMeetingReaction = z.infer<typeof insertMeetingReactionSchema>;
export type MeetingReaction = typeof meetingReactions.$inferSelect;

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof taskComments.$inferSelect;

export type InsertSubjectEntity = z.infer<typeof insertSubjectEntitySchema>;
export type SubjectEntity = typeof subjectEntities.$inferSelect;

export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communications.$inferSelect;

export type InsertCommunicationRecipient = z.infer<typeof insertCommunicationRecipientSchema>;
export type CommunicationRecipient = typeof communicationRecipients.$inferSelect;

export type InsertCommunicationFile = z.infer<typeof insertCommunicationFileSchema>;
export type CommunicationFile = typeof communicationFiles.$inferSelect;

export type InsertPublicHearing = z.infer<typeof insertPublicHearingSchema>;
export type PublicHearing = typeof publicHearings.$inferSelect;

export type InsertPublicHearingFile = z.infer<typeof insertPublicHearingFileSchema>;
export type PublicHearingFile = typeof publicHearingFiles.$inferSelect;

export type InsertAchievementBadge = z.infer<typeof insertAchievementBadgeSchema>;
export type AchievementBadge = typeof achievementBadges.$inferSelect;

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;

// Auth types
export type LoginCredentials = {
  username: string;
  password: string;
};

// Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  entity: one(entities, {
    fields: [users.entityId],
    references: [entities.id],
  }),
  createdMeetings: many(meetings),
  meetingAttendees: many(meetingAttendees),
  meetingReactions: many(meetingReactions),
  uploadedDocuments: many(meetingDocuments),
  assignedTasks: many(tasks, { relationName: "assignedUser" }),
  createdTasks: many(tasks, { relationName: "createdBy" }),
  createdSubjects: many(subjects),
  taskComments: many(taskComments),
  sentCommunications: many(communications),
  receivedCommunications: many(communicationRecipients),
  createdPublicHearings: many(publicHearings),
  uploadedPublicHearingFiles: many(publicHearingFiles),
  badges: many(userBadges),
  activityLogs: many(userActivityLogs),
}));

export const entitiesRelations = relations(entities, ({ many }) => ({
  users: many(users),
  tasks: many(tasks),
  communicationRecipients: many(communicationRecipients),
  subjectLinks: many(subjectEntities),
  publicHearings: many(publicHearings),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  creator: one(users, {
    fields: [meetings.createdBy],
    references: [users.id],
  }),
  registeredSubject: one(subjects, {
    fields: [meetings.subjectId],
    references: [subjects.id],
  }),
  attendees: many(meetingAttendees),
  documents: many(meetingDocuments),
  reactions: many(meetingReactions),
  tasks: many(tasks),
}));

export const meetingAttendeesRelations = relations(meetingAttendees, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingAttendees.meetingId],
    references: [meetings.id],
  }),
  user: one(users, {
    fields: [meetingAttendees.userId],
    references: [users.id],
  }),
}));

export const meetingDocumentsRelations = relations(meetingDocuments, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingDocuments.meetingId],
    references: [meetings.id],
  }),
  uploader: one(users, {
    fields: [meetingDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const meetingReactionsRelations = relations(meetingReactions, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingReactions.meetingId],
    references: [meetings.id],
  }),
  user: one(users, {
    fields: [meetingReactions.userId],
    references: [users.id],
  }),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  creator: one(users, {
    fields: [subjects.createdBy],
    references: [users.id],
  }),
  tasks: many(tasks),
  meetings: many(meetings),
  entities: many(subjectEntities),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignedUser: one(users, {
    fields: [tasks.assignedToUserId],
    references: [users.id],
    relationName: "assignedUser",
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  subject: one(subjects, {
    fields: [tasks.subjectId],
    references: [subjects.id],
  }),
  entity: one(entities, {
    fields: [tasks.entityId],
    references: [entities.id],
  }),
  meeting: one(meetings, {
    fields: [tasks.meetingId],
    references: [meetings.id],
  }),
  comments: many(taskComments),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

export const communicationsRelations = relations(communications, ({ one, many }) => ({
  sender: one(users, {
    fields: [communications.sentBy],
    references: [users.id],
  }),
  recipients: many(communicationRecipients),
  files: many(communicationFiles),
}));

export const communicationFilesRelations = relations(communicationFiles, ({ one }) => ({
  communication: one(communications, {
    fields: [communicationFiles.communicationId],
    references: [communications.id],
  }),
}));

export const communicationRecipientsRelations = relations(communicationRecipients, ({ one }) => ({
  communication: one(communications, {
    fields: [communicationRecipients.communicationId],
    references: [communications.id],
  }),
  user: one(users, {
    fields: [communicationRecipients.userId],
    references: [users.id],
  }),
  entity: one(entities, {
    fields: [communicationRecipients.entityId],
    references: [entities.id],
  }),
}));

export const achievementBadgesRelations = relations(achievementBadges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(achievementBadges, {
    fields: [userBadges.badgeId],
    references: [achievementBadges.id],
  }),
}));

export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  user: one(users, {
    fields: [userActivityLogs.userId],
    references: [users.id],
  }),
}));

// Public Hearings relations
export const publicHearingsRelations = relations(publicHearings, ({ one, many }) => ({
  creator: one(users, {
    fields: [publicHearings.createdBy],
    references: [users.id],
  }),
  entity: one(entities, {
    fields: [publicHearings.entityId],
    references: [entities.id],
  }),
  files: many(publicHearingFiles),
}));

export const publicHearingFilesRelations = relations(publicHearingFiles, ({ one }) => ({
  publicHearing: one(publicHearings, {
    fields: [publicHearingFiles.publicHearingId],
    references: [publicHearings.id],
  }),
  uploader: one(users, {
    fields: [publicHearingFiles.uploadedBy],
    references: [users.id],
  }),
}));

// Junction table relations
export const subjectEntitiesRelations = relations(subjectEntities, ({ one }) => ({
  subject: one(subjects, {
    fields: [subjectEntities.subjectId],
    references: [subjects.id]
  }),
  entity: one(entities, {
    fields: [subjectEntities.entityId],
    references: [entities.id]
  })
}));

// Utility types
export type UserWithEntity = User & { entity?: Entity };
export type MeetingWithAttendees = Meeting & { attendees: MeetingAttendee[] };
export type MeetingWithDocuments = Meeting & { documents: MeetingDocument[] };
export type MeetingWithReactions = Meeting & { reactions: MeetingReaction[] };
export type MeetingWithSubject = Meeting & { registeredSubject?: Subject };
export type MeetingWithAttendeesAndSubject = MeetingWithAttendees & { registeredSubject?: Subject };
export type MeetingWithAttendeesAndDocuments = MeetingWithAttendees & { documents: MeetingDocument[] };
export type MeetingWithAttendeesAndReactions = MeetingWithAttendees & { reactions: MeetingReaction[] };
export type MeetingWithAll = MeetingWithAttendees & { registeredSubject?: Subject, documents: MeetingDocument[], reactions: MeetingReaction[] };
export type TaskWithAssignee = Task & { assignee: User };
export type CommunicationWithRecipients = Communication & { recipients: CommunicationRecipient[] };
export type CommunicationWithFiles = Communication & { files: CommunicationFile[] };
export type CommunicationWithRecipientsAndFiles = CommunicationWithRecipients & { files: CommunicationFile[] };
export type PublicHearingWithEntity = PublicHearing & { entity: Entity };
export type PublicHearingWithFiles = PublicHearing & { files: PublicHearingFile[] };
export type PublicHearingWithEntityAndFiles = PublicHearingWithEntity & { files: PublicHearingFile[] };
export type UserWithBadges = User & { badges: (UserBadge & { badge: AchievementBadge })[] };
export type UserBadgeWithDetails = UserBadge & { badge: AchievementBadge, user: User };
