import { db } from "./db";
import { users, entities } from "@shared/schema";
import { eq } from "drizzle-orm";
import { InsertUser, User, InsertEntity, Entity } from "@shared/schema";

export class DatabaseStorage {
  // Usuários
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user);
    // @ts-ignore: Drizzle retorna insertId para MySQL
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

  // Entidades
  async createEntity(entity: InsertEntity): Promise<Entity> {
    const result = await db.insert(entities).values(entity);
    // @ts-ignore: Drizzle retorna insertId para MySQL
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
}