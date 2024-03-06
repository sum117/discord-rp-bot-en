import { eq } from "drizzle-orm";
import db from "../database";
import { User } from "../models/User";
import { users } from "../schema";

export default class UserService {
  public static async getOrCreateUser(userId: string) {
    const foundUser = (
      await db.select().from(users).where(eq(users.id, userId))
    ).at(0);

    if (!foundUser) {
      const createdUsers = await db
        .insert(users)
        .values({ id: userId })
        .returning();
      const createdUser = createdUsers.at(0);
      if (!createdUser) {
        throw new Error("Failed to create user");
      }
      return new User(createdUser);
    }
    return new User(foundUser);
  }

  public static async updateUser(user: User | typeof users.$inferInsert) {
    if (user instanceof User) {
      user = {
        id: user.id,
        joinedBotAt: user.joinedBotAt,
        level: user.level,
        preferredLanguage: user.preferredLanguage,
        exp: user.exp,
      };
    }
    const updatedUser = (
      await db.update(users).set(user).where(eq(users.id, user.id)).returning()
    ).at(0);
    if (!updatedUser) {
      throw new Error("Failed to update user");
    }
    return new User(updatedUser);
  }
}
