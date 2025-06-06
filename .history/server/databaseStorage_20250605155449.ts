import { db } from "./db";
import { 
  users, entities, meetings, meetingAttendees, subjects,
  InsertUser, User, InsertEntity, Entity, InsertMeeting, Meeting,
  InsertMeetingAttendee, MeetingAttendee, InsertSubject, Subject
} from "@shared/schema";
import { eq } from "drizzle-orm";

export class DatabaseStorage {
  // Usuários
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user);
    // @ts-ignore
    const insertId = result.insertId ?? result[0]?.insertId;
    const [created] = await db.select().from(users).where(eq(users.id, insertId));
    return created;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [userResult] = await db.select().from(users).where(eq(users.id, id));
    return userResult;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByEntityId(entityId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.entityId, entityId));
  }

  // Entidades
  async createEntity(entity: InsertEntity): Promise<Entity> {
    const result = await db.insert(entities).values(entity);
    // @ts-ignore
    const insertId = result.insertId ?? result[0]?.insertId;
    const [created] = await db.select().from(entities).where(eq(entities.id, insertId));
    return created;
  }

  async getEntity(id: number): Promise<Entity | undefined> {
    const [entityResult] = await db.select().from(entities).where(eq(entities.id, id));
    return entityResult;
  }

  async getAllEntities(): Promise<Entity[]> {
    return db.select().from(entities);
  }

  // Reuniões
  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const result = await db.insert(meetings).values(meeting);
    // @ts-ignore
    const insertId = result.insertId ?? result[0]?.insertId;
    const [created] = await db.select().from(meetings).where(eq(meetings.id, insertId));
    return created;
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meetingResult] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meetingResult;
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return db.select().from(meetings);
  }

  // Participantes de reunião
  async createMeetingAttendee(attendee: InsertMeetingAttendee): Promise<MeetingAttendee> {
    const result = await db.insert(meetingAttendees).values(attendee);
    // @ts-ignore
    const insertId = result.insertId ?? result[0]?.insertId;
    const [created] = await db.select().from(meetingAttendees).where(eq(meetingAttendees.id, insertId));
    return created;
  }

  async getMeetingAttendeesByMeetingId(meetingId: number): Promise<MeetingAttendee[]> {
    return db.select().from(meetingAttendees).where(eq(meetingAttendees.meetingId, meetingId));
  }

  // Assuntos
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const result = await db.insert(subjects).values(subject);
    // @ts-ignore
    const insertId = result.insertId ?? result[0]?.insertId;
    const [created] = await db.select().from(subjects).where(eq(subjects.id, insertId));
    return created;
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subjectResult] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subjectResult;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return db.select().from(subjects);
  }

  // Implemente outros métodos conforme sua interface IStorage...
}