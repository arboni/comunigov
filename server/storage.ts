import { 
  User, InsertUser, 
  Entity, InsertEntity,
  Meeting, InsertMeeting,
  MeetingAttendee, InsertMeetingAttendee,
  MeetingDocument, InsertMeetingDocument,
  Task, InsertTask,
  TaskComment, InsertTaskComment,
  Communication, InsertCommunication,
  CommunicationRecipient, InsertCommunicationRecipient,
  AchievementBadge, InsertAchievementBadge,
  UserBadge, InsertUserBadge,
  UserWithEntity,
  MeetingWithAttendees,
  TaskWithAssignee,
  CommunicationWithRecipients,
  UserWithBadges,
  users, entities, meetings, meetingAttendees, meetingDocuments, tasks, taskComments, 
  communications, communicationRecipients, achievementBadges, userBadges
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq, and, isNull, or, gt, desc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithEntity(id: number): Promise<UserWithEntity | undefined>;
  getUsersByEntityId(entityId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Entities
  getEntity(id: number): Promise<Entity | undefined>;
  getEntityByName(name: string): Promise<Entity | undefined>;
  createEntity(entity: InsertEntity): Promise<Entity>;
  updateEntity(id: number, entityData: Partial<Entity>): Promise<Entity | undefined>;
  getAllEntities(): Promise<Entity[]>;
  
  // Meetings
  getMeeting(id: number): Promise<Meeting | undefined>;
  getMeetingWithAttendees(id: number): Promise<MeetingWithAttendees | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meetingData: Partial<Meeting>): Promise<Meeting | undefined>;
  getAllMeetings(): Promise<Meeting[]>;
  getUpcomingMeetings(): Promise<Meeting[]>;
  
  // Meeting Attendees
  getMeetingAttendee(id: number): Promise<MeetingAttendee | undefined>;
  getMeetingAttendeeByMeetingAndUser(meetingId: number, userId: number): Promise<MeetingAttendee | undefined>;
  createMeetingAttendee(attendee: InsertMeetingAttendee): Promise<MeetingAttendee>;
  updateMeetingAttendee(id: number, attendeeData: Partial<MeetingAttendee>): Promise<MeetingAttendee | undefined>;
  getMeetingAttendeesByMeetingId(meetingId: number): Promise<MeetingAttendee[]>;
  
  // Meeting Documents
  getMeetingDocument(id: number): Promise<MeetingDocument | undefined>;
  createMeetingDocument(document: InsertMeetingDocument): Promise<MeetingDocument>;
  getMeetingDocumentsByMeetingId(meetingId: number): Promise<MeetingDocument[]>;
  
  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTaskWithAssignee(id: number): Promise<TaskWithAssignee | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getTasksByAssignee(userId: number): Promise<Task[]>;
  getTasksByMeeting(meetingId: number): Promise<Task[]>;
  getTasksByEntity(entityId: number): Promise<Task[]>;
  
  // Task Comments
  getTaskComment(id: number): Promise<TaskComment | undefined>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  getTaskCommentsByTaskId(taskId: number): Promise<TaskComment[]>;
  
  // Communications
  getCommunication(id: number): Promise<Communication | undefined>;
  getCommunicationWithRecipients(id: number): Promise<CommunicationWithRecipients | undefined>;
  createCommunication(communication: InsertCommunication): Promise<Communication>;
  getAllCommunications(): Promise<Communication[]>;
  
  // Communication Recipients
  getCommunicationRecipient(id: number): Promise<CommunicationRecipient | undefined>;
  createCommunicationRecipient(recipient: InsertCommunicationRecipient): Promise<CommunicationRecipient>;
  updateCommunicationRecipient(id: number, recipientData: Partial<CommunicationRecipient>): Promise<CommunicationRecipient | undefined>;
  getCommunicationRecipientsByCommunicationId(communicationId: number): Promise<CommunicationRecipient[]>;
  
  // Achievement Badges
  getAchievementBadge(id: number): Promise<AchievementBadge | undefined>;
  createAchievementBadge(badge: InsertAchievementBadge): Promise<AchievementBadge>;
  updateAchievementBadge(id: number, badgeData: Partial<AchievementBadge>): Promise<AchievementBadge | undefined>;
  getAllAchievementBadges(): Promise<AchievementBadge[]>;
  getAchievementBadgesByCategory(category: string): Promise<AchievementBadge[]>;
  
  // User Badges
  getUserBadge(id: number): Promise<UserBadge | undefined>;
  createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  updateUserBadge(id: number, userBadgeData: Partial<UserBadge>): Promise<UserBadge | undefined>;
  getUserBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]>;
  getUserWithBadges(userId: number): Promise<UserWithBadges | undefined>;
  getFeaturedBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]>;
  
  // Session Store
  sessionStore: any; // Fix type issue with SessionStore
}

export class MemStorage implements IStorage {
  // Data stores
  private users: Map<number, User>;
  private entities: Map<number, Entity>;
  private meetings: Map<number, Meeting>;
  private meetingAttendees: Map<number, MeetingAttendee>;
  private meetingDocuments: Map<number, MeetingDocument>;
  private tasks: Map<number, Task>;
  private taskComments: Map<number, TaskComment>;
  private communications: Map<number, Communication>;
  private communicationRecipients: Map<number, CommunicationRecipient>;
  
  // Auto-increment IDs
  currentUserId: number;
  currentEntityId: number;
  currentMeetingId: number;
  currentMeetingAttendeeId: number;
  currentMeetingDocumentId: number;
  currentTaskId: number;
  currentTaskCommentId: number;
  currentCommunicationId: number;
  currentCommunicationRecipientId: number;
  
  // Session store
  sessionStore: any; // Use any type for sessionStore

  constructor() {
    // Initialize data stores
    this.users = new Map();
    this.entities = new Map();
    this.meetings = new Map();
    this.meetingAttendees = new Map();
    this.meetingDocuments = new Map();
    this.tasks = new Map();
    this.taskComments = new Map();
    this.communications = new Map();
    this.communicationRecipients = new Map();
    this.achievementBadges = new Map();
    this.userBadges = new Map();
    
    // Initialize auto-increment IDs
    this.currentUserId = 1;
    this.currentEntityId = 1;
    this.currentMeetingId = 1;
    this.currentMeetingAttendeeId = 1;
    this.currentMeetingDocumentId = 1;
    this.currentTaskId = 1;
    this.currentTaskCommentId = 1;
    this.currentCommunicationId = 1;
    this.currentCommunicationRecipientId = 1;
    this.currentAchievementBadgeId = 1;
    this.currentUserBadgeId = 1;
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserWithEntity(id: number): Promise<UserWithEntity | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const entity = user.entityId ? this.entities.get(user.entityId) : undefined;
    return {
      ...user,
      entity,
    };
  }

  async getUsersByEntityId(entityId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.entityId === entityId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Entity methods
  async getEntity(id: number): Promise<Entity | undefined> {
    return this.entities.get(id);
  }

  async getEntityByName(name: string): Promise<Entity | undefined> {
    return Array.from(this.entities.values()).find(
      (entity) => entity.name === name,
    );
  }

  async createEntity(insertEntity: InsertEntity): Promise<Entity> {
    const id = this.currentEntityId++;
    const entity: Entity = { ...insertEntity, id };
    this.entities.set(id, entity);
    return entity;
  }

  async updateEntity(id: number, entityData: Partial<Entity>): Promise<Entity | undefined> {
    const entity = this.entities.get(id);
    if (!entity) return undefined;

    const updatedEntity = { ...entity, ...entityData };
    this.entities.set(id, updatedEntity);
    return updatedEntity;
  }

  async getAllEntities(): Promise<Entity[]> {
    return Array.from(this.entities.values());
  }

  // Meeting methods
  async getMeeting(id: number): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async getMeetingWithAttendees(id: number): Promise<MeetingWithAttendees | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;

    const attendees = await this.getMeetingAttendeesByMeetingId(id);
    return {
      ...meeting,
      attendees,
    };
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = this.currentMeetingId++;
    const meeting: Meeting = { ...insertMeeting, id };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(id: number, meetingData: Partial<Meeting>): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;

    const updatedMeeting = { ...meeting, ...meetingData };
    this.meetings.set(id, updatedMeeting);
    return updatedMeeting;
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return Array.from(this.meetings.values());
  }

  async getUpcomingMeetings(): Promise<Meeting[]> {
    const now = new Date();
    return Array.from(this.meetings.values())
      .filter((meeting) => new Date(meeting.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Meeting Attendee methods
  async getMeetingAttendee(id: number): Promise<MeetingAttendee | undefined> {
    return this.meetingAttendees.get(id);
  }

  async getMeetingAttendeeByMeetingAndUser(meetingId: number, userId: number): Promise<MeetingAttendee | undefined> {
    return Array.from(this.meetingAttendees.values()).find(
      (attendee) => attendee.meetingId === meetingId && attendee.userId === userId,
    );
  }

  async createMeetingAttendee(insertAttendee: InsertMeetingAttendee): Promise<MeetingAttendee> {
    const id = this.currentMeetingAttendeeId++;
    const attendee: MeetingAttendee = { ...insertAttendee, id };
    this.meetingAttendees.set(id, attendee);
    return attendee;
  }

  async updateMeetingAttendee(id: number, attendeeData: Partial<MeetingAttendee>): Promise<MeetingAttendee | undefined> {
    const attendee = this.meetingAttendees.get(id);
    if (!attendee) return undefined;

    const updatedAttendee = { ...attendee, ...attendeeData };
    this.meetingAttendees.set(id, updatedAttendee);
    return updatedAttendee;
  }

  async getMeetingAttendeesByMeetingId(meetingId: number): Promise<MeetingAttendee[]> {
    return Array.from(this.meetingAttendees.values()).filter(
      (attendee) => attendee.meetingId === meetingId,
    );
  }

  // Meeting Document methods
  async getMeetingDocument(id: number): Promise<MeetingDocument | undefined> {
    return this.meetingDocuments.get(id);
  }

  async createMeetingDocument(insertDocument: InsertMeetingDocument): Promise<MeetingDocument> {
    const id = this.currentMeetingDocumentId++;
    const document: MeetingDocument = { ...insertDocument, id };
    this.meetingDocuments.set(id, document);
    return document;
  }

  async getMeetingDocumentsByMeetingId(meetingId: number): Promise<MeetingDocument[]> {
    return Array.from(this.meetingDocuments.values()).filter(
      (document) => document.meetingId === meetingId,
    );
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTaskWithAssignee(id: number): Promise<TaskWithAssignee | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const assignee = await this.getUser(task.assignedTo);
    if (!assignee) return undefined;

    return {
      ...task,
      assignee,
    };
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.assignedTo === userId,
    );
  }

  async getTasksByMeeting(meetingId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.meetingId === meetingId,
    );
  }

  async getTasksByEntity(entityId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.entityId === entityId,
    );
  }

  // Task Comment methods
  async getTaskComment(id: number): Promise<TaskComment | undefined> {
    return this.taskComments.get(id);
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    const id = this.currentTaskCommentId++;
    const comment: TaskComment = { ...insertComment, id };
    this.taskComments.set(id, comment);
    return comment;
  }

  async getTaskCommentsByTaskId(taskId: number): Promise<TaskComment[]> {
    return Array.from(this.taskComments.values()).filter(
      (comment) => comment.taskId === taskId,
    );
  }

  // Communication methods
  async getCommunication(id: number): Promise<Communication | undefined> {
    return this.communications.get(id);
  }

  async getCommunicationWithRecipients(id: number): Promise<CommunicationWithRecipients | undefined> {
    const communication = this.communications.get(id);
    if (!communication) return undefined;

    const recipients = await this.getCommunicationRecipientsByCommunicationId(id);
    return {
      ...communication,
      recipients,
    };
  }

  async createCommunication(insertCommunication: InsertCommunication): Promise<Communication> {
    const id = this.currentCommunicationId++;
    const communication: Communication = { ...insertCommunication, id };
    this.communications.set(id, communication);
    return communication;
  }

  async getAllCommunications(): Promise<Communication[]> {
    return Array.from(this.communications.values());
  }

  // Communication Recipient methods
  async getCommunicationRecipient(id: number): Promise<CommunicationRecipient | undefined> {
    return this.communicationRecipients.get(id);
  }

  async createCommunicationRecipient(insertRecipient: InsertCommunicationRecipient): Promise<CommunicationRecipient> {
    const id = this.currentCommunicationRecipientId++;
    const recipient: CommunicationRecipient = { ...insertRecipient, id };
    this.communicationRecipients.set(id, recipient);
    return recipient;
  }

  async updateCommunicationRecipient(id: number, recipientData: Partial<CommunicationRecipient>): Promise<CommunicationRecipient | undefined> {
    const recipient = this.communicationRecipients.get(id);
    if (!recipient) return undefined;

    const updatedRecipient = { ...recipient, ...recipientData };
    this.communicationRecipients.set(id, updatedRecipient);
    return updatedRecipient;
  }

  async getCommunicationRecipientsByCommunicationId(communicationId: number): Promise<CommunicationRecipient[]> {
    return Array.from(this.communicationRecipients.values()).filter(
      (recipient) => recipient.communicationId === communicationId,
    );
  }

  // Achievement badge properties
  private achievementBadges: Map<number, AchievementBadge>;
  private userBadges: Map<number, UserBadge>;
  private currentAchievementBadgeId: number;
  private currentUserBadgeId: number;

  // Achievement badge methods
  async getAchievementBadge(id: number): Promise<AchievementBadge | undefined> {
    return this.achievementBadges.get(id);
  }

  async createAchievementBadge(badge: InsertAchievementBadge): Promise<AchievementBadge> {
    const id = this.currentAchievementBadgeId++;
    const newBadge: AchievementBadge = { 
      ...badge, 
      id,
      createdAt: new Date()
    };
    this.achievementBadges.set(id, newBadge);
    return newBadge;
  }

  async updateAchievementBadge(id: number, badgeData: Partial<AchievementBadge>): Promise<AchievementBadge | undefined> {
    const badge = this.achievementBadges.get(id);
    if (!badge) return undefined;
    
    const updatedBadge = { ...badge, ...badgeData };
    this.achievementBadges.set(id, updatedBadge);
    return updatedBadge;
  }

  async getAllAchievementBadges(): Promise<AchievementBadge[]> {
    return Array.from(this.achievementBadges.values());
  }

  async getAchievementBadgesByCategory(category: string): Promise<AchievementBadge[]> {
    return Array.from(this.achievementBadges.values()).filter(
      (badge) => badge.category === category
    );
  }

  // User badges methods
  async getUserBadge(id: number): Promise<UserBadge | undefined> {
    return this.userBadges.get(id);
  }

  async createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.currentUserBadgeId++;
    const newUserBadge: UserBadge = {
      ...userBadge,
      id,
      earnedAt: new Date()
    };
    this.userBadges.set(id, newUserBadge);
    return newUserBadge;
  }

  async updateUserBadge(id: number, userBadgeData: Partial<UserBadge>): Promise<UserBadge | undefined> {
    const userBadge = this.userBadges.get(id);
    if (!userBadge) return undefined;

    const updatedUserBadge = { ...userBadge, ...userBadgeData };
    this.userBadges.set(id, updatedUserBadge);
    return updatedUserBadge;
  }

  async getUserBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]> {
    const userBadges = Array.from(this.userBadges.values()).filter(
      (userBadge) => userBadge.userId === userId
    );

    return userBadges.map(userBadge => {
      const badge = this.achievementBadges.get(userBadge.badgeId);
      if (!badge) throw new Error(`Badge with id ${userBadge.badgeId} not found`);
      return { ...userBadge, badge };
    });
  }

  async getUserWithBadges(userId: number): Promise<UserWithBadges | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const badges = await this.getUserBadgesByUserId(userId);
    
    return {
      ...user,
      badges
    };
  }

  async getFeaturedBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]> {
    const userBadges = await this.getUserBadgesByUserId(userId);
    return userBadges.filter(userBadge => userBadge.featured);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Use any type for sessionStore

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // Achievement Badges methods
  async getAchievementBadge(id: number): Promise<AchievementBadge | undefined> {
    const [badge] = await db
      .select()
      .from(achievementBadges)
      .where(eq(achievementBadges.id, id));
    return badge || undefined;
  }

  async createAchievementBadge(badge: InsertAchievementBadge): Promise<AchievementBadge> {
    const [newBadge] = await db
      .insert(achievementBadges)
      .values(badge)
      .returning();
    return newBadge;
  }

  async updateAchievementBadge(id: number, badgeData: Partial<AchievementBadge>): Promise<AchievementBadge | undefined> {
    const [updatedBadge] = await db
      .update(achievementBadges)
      .set(badgeData)
      .where(eq(achievementBadges.id, id))
      .returning();
    return updatedBadge || undefined;
  }

  async getAllAchievementBadges(): Promise<AchievementBadge[]> {
    return await db.select().from(achievementBadges);
  }

  async getAchievementBadgesByCategory(category: string): Promise<AchievementBadge[]> {
    return await db
      .select()
      .from(achievementBadges)
      .where(eq(achievementBadges.category, category));
  }

  // User Badges methods
  async getUserBadge(id: number): Promise<UserBadge | undefined> {
    const [userBadge] = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.id, id));
    return userBadge || undefined;
  }

  async createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [newUserBadge] = await db
      .insert(userBadges)
      .values(userBadge)
      .returning();
    return newUserBadge;
  }

  async updateUserBadge(id: number, userBadgeData: Partial<UserBadge>): Promise<UserBadge | undefined> {
    const [updatedUserBadge] = await db
      .update(userBadges)
      .set(userBadgeData)
      .where(eq(userBadges.id, id))
      .returning();
    return updatedUserBadge || undefined;
  }

  async getUserBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]> {
    const result = await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        featured: userBadges.featured,
        badge: achievementBadges
      })
      .from(userBadges)
      .leftJoin(achievementBadges, eq(userBadges.badgeId, achievementBadges.id))
      .where(eq(userBadges.userId, userId));

    return result as unknown as (UserBadge & { badge: AchievementBadge })[];
  }

  async getUserWithBadges(userId: number): Promise<UserWithBadges | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;

    const badges = await this.getUserBadgesByUserId(userId);
    
    return {
      ...user,
      badges
    };
  }

  async getFeaturedBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]> {
    const result = await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        featured: userBadges.featured,
        badge: achievementBadges
      })
      .from(userBadges)
      .leftJoin(achievementBadges, eq(userBadges.badgeId, achievementBadges.id))
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.featured, true)
      ));

    return result as unknown as (UserBadge & { badge: AchievementBadge })[];
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserWithEntity(id: number): Promise<UserWithEntity | undefined> {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        phone: users.phone,
        whatsapp: users.whatsapp,
        telegram: users.telegram,
        position: users.position,
        entityId: users.entityId,
        entity: entities
      })
      .from(users)
      .leftJoin(entities, eq(users.entityId, entities.id))
      .where(eq(users.id, id));

    if (!user) return undefined;
    return user as unknown as UserWithEntity;
  }

  async getUsersByEntityId(entityId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.entityId, entityId));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log("DatabaseStorage.createUser called with:", insertUser);
    
    // Ensure all required fields are present
    const userToInsert = {
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName,
      role: insertUser.role,
      phone: insertUser.phone ?? null,
      whatsapp: insertUser.whatsapp ?? null, 
      telegram: insertUser.telegram ?? null,
      position: insertUser.position ?? null,
      entityId: insertUser.entityId ?? null
    };
    
    try {
      console.log("Inserting user:", userToInsert);
      const [user] = await db.insert(users).values(userToInsert).returning();
      console.log("User inserted successfully:", user);
      return user;
    } catch (error) {
      console.error("Error inserting user:", error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Entity methods
  async getEntity(id: number): Promise<Entity | undefined> {
    const [entity] = await db.select().from(entities).where(eq(entities.id, id));
    return entity || undefined;
  }

  async getEntityByName(name: string): Promise<Entity | undefined> {
    const [entity] = await db.select().from(entities).where(eq(entities.name, name));
    return entity || undefined;
  }

  async createEntity(insertEntity: InsertEntity): Promise<Entity> {
    const [entity] = await db.insert(entities).values(insertEntity).returning();
    return entity;
  }

  async updateEntity(id: number, entityData: Partial<Entity>): Promise<Entity | undefined> {
    const [updatedEntity] = await db
      .update(entities)
      .set(entityData)
      .where(eq(entities.id, id))
      .returning();
    return updatedEntity || undefined;
  }

  async getAllEntities(): Promise<Entity[]> {
    return await db.select().from(entities);
  }

  // Meeting methods
  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting || undefined;
  }

  async getMeetingWithAttendees(id: number): Promise<MeetingWithAttendees | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) return undefined;

    const attendees = await db.select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, id));
    
    return {
      ...meeting,
      attendees
    };
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    // Add current timestamp for createdAt if not provided
    const meetingWithCreatedAt = {
      ...insertMeeting,
      createdAt: new Date()
    };
    
    const [meeting] = await db.insert(meetings).values(meetingWithCreatedAt).returning();
    return meeting;
  }

  async updateMeeting(id: number, meetingData: Partial<Meeting>): Promise<Meeting | undefined> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set(meetingData)
      .where(eq(meetings.id, id))
      .returning();
    return updatedMeeting || undefined;
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings);
  }

  async getUpcomingMeetings(): Promise<Meeting[]> {
    const now = new Date();
    return await db
      .select()
      .from(meetings)
      .where(gt(meetings.date, now))
      .orderBy(meetings.date);
  }

  // Meeting Attendee methods
  async getMeetingAttendee(id: number): Promise<MeetingAttendee | undefined> {
    const [attendee] = await db
      .select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.id, id));
    return attendee || undefined;
  }

  async getMeetingAttendeeByMeetingAndUser(meetingId: number, userId: number): Promise<MeetingAttendee | undefined> {
    const [attendee] = await db
      .select()
      .from(meetingAttendees)
      .where(
        and(
          eq(meetingAttendees.meetingId, meetingId),
          eq(meetingAttendees.userId, userId)
        )
      );
    return attendee || undefined;
  }

  async createMeetingAttendee(insertAttendee: InsertMeetingAttendee): Promise<MeetingAttendee> {
    const [attendee] = await db
      .insert(meetingAttendees)
      .values(insertAttendee)
      .returning();
    return attendee;
  }

  async updateMeetingAttendee(id: number, attendeeData: Partial<MeetingAttendee>): Promise<MeetingAttendee | undefined> {
    const [updatedAttendee] = await db
      .update(meetingAttendees)
      .set(attendeeData)
      .where(eq(meetingAttendees.id, id))
      .returning();
    return updatedAttendee || undefined;
  }

  async getMeetingAttendeesByMeetingId(meetingId: number): Promise<MeetingAttendee[]> {
    return await db
      .select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, meetingId));
  }

  // Meeting Document methods
  async getMeetingDocument(id: number): Promise<MeetingDocument | undefined> {
    const [document] = await db
      .select()
      .from(meetingDocuments)
      .where(eq(meetingDocuments.id, id));
    return document || undefined;
  }

  async createMeetingDocument(insertDocument: InsertMeetingDocument): Promise<MeetingDocument> {
    // Add current timestamp for uploadedAt
    const documentWithUploadedAt = {
      ...insertDocument,
      uploadedAt: new Date()
    };
    
    const [document] = await db
      .insert(meetingDocuments)
      .values(documentWithUploadedAt)
      .returning();
    return document;
  }

  async getMeetingDocumentsByMeetingId(meetingId: number): Promise<MeetingDocument[]> {
    return await db
      .select()
      .from(meetingDocuments)
      .where(eq(meetingDocuments.meetingId, meetingId));
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTaskWithAssignee(id: number): Promise<TaskWithAssignee | undefined> {
    const [task] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        deadline: tasks.deadline,
        status: tasks.status,
        assignedTo: tasks.assignedTo,
        createdBy: tasks.createdBy,
        entityId: tasks.entityId,
        meetingId: tasks.meetingId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assignee: users
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.id, id));

    if (!task) return undefined;
    return task as unknown as TaskWithAssignee;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    // Add current timestamp for createdAt and updatedAt
    const taskWithTimestamps = {
      ...insertTask,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [task] = await db.insert(tasks).values(taskWithTimestamps).returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId));
  }

  async getTasksByMeeting(meetingId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.meetingId, meetingId));
  }

  async getTasksByEntity(entityId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.entityId, entityId));
  }

  // Task Comment methods
  async getTaskComment(id: number): Promise<TaskComment | undefined> {
    const [comment] = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, id));
    return comment || undefined;
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    // Add current timestamp for createdAt
    const commentWithCreatedAt = {
      ...insertComment,
      createdAt: new Date()
    };
    
    const [comment] = await db
      .insert(taskComments)
      .values(commentWithCreatedAt)
      .returning();
    return comment;
  }

  async getTaskCommentsByTaskId(taskId: number): Promise<TaskComment[]> {
    return await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId));
  }

  // Communication methods
  async getCommunication(id: number): Promise<Communication | undefined> {
    const [communication] = await db
      .select()
      .from(communications)
      .where(eq(communications.id, id));
    return communication || undefined;
  }

  async getCommunicationWithRecipients(id: number): Promise<CommunicationWithRecipients | undefined> {
    const [communication] = await db
      .select()
      .from(communications)
      .where(eq(communications.id, id));

    if (!communication) return undefined;

    const recipients = await db
      .select()
      .from(communicationRecipients)
      .where(eq(communicationRecipients.communicationId, id));

    return {
      ...communication,
      recipients
    };
  }

  async createCommunication(insertCommunication: InsertCommunication): Promise<Communication> {
    // Add current timestamp for sentAt
    const communicationWithSentAt = {
      ...insertCommunication,
      sentAt: new Date()
    };
    
    const [communication] = await db
      .insert(communications)
      .values(communicationWithSentAt)
      .returning();
    return communication;
  }

  async getAllCommunications(): Promise<Communication[]> {
    return await db.select().from(communications);
  }

  // Communication Recipient methods
  async getCommunicationRecipient(id: number): Promise<CommunicationRecipient | undefined> {
    const [recipient] = await db
      .select()
      .from(communicationRecipients)
      .where(eq(communicationRecipients.id, id));
    return recipient || undefined;
  }

  async createCommunicationRecipient(insertRecipient: InsertCommunicationRecipient): Promise<CommunicationRecipient> {
    // Add null for readAt if not provided (since it's nullable)
    const recipientWithReadAt = {
      ...insertRecipient,
      readAt: null
    };
    
    const [recipient] = await db
      .insert(communicationRecipients)
      .values(recipientWithReadAt)
      .returning();
    return recipient;
  }

  async updateCommunicationRecipient(id: number, recipientData: Partial<CommunicationRecipient>): Promise<CommunicationRecipient | undefined> {
    const [updatedRecipient] = await db
      .update(communicationRecipients)
      .set(recipientData)
      .where(eq(communicationRecipients.id, id))
      .returning();
    return updatedRecipient || undefined;
  }

  async getCommunicationRecipientsByCommunicationId(communicationId: number): Promise<CommunicationRecipient[]> {
    return await db
      .select()
      .from(communicationRecipients)
      .where(eq(communicationRecipients.communicationId, communicationId));
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
