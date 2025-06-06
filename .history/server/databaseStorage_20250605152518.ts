import { db } from "./db";
import { users, entities } from "@shared/schema";
import { eq } from "drizzle-orm";
import { InsertUser, User, InsertEntity, Entity } from "@shared/schema";

export class DatabaseStorage {
  // Usuários
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [userResult] = await db.select().from(users).where(eq(users.id, id));
    return userResult;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Entidades
  async createEntity(entity: InsertEntity): Promise<Entity> {
    const [created] = await db.insert(entities).values(entity).returning();
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