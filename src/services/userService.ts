import { eq } from "drizzle-orm";
import db from "../database";
import { User } from "../models/User";
import { users } from "../schema";

export default class UserService {
  public static async getOrCreateUser(userId: string, withCharacters = false) {
    const foundUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: withCharacters ? { characters: true } : {},
    });

    if (!foundUser) {
      const createdUsers = await db.insert(users).values({ id: userId, joinedBotAt: new Date() }).returning();
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
      user = user.toJson();
    }
    const updatedUser = (await db.update(users).set(user).where(eq(users.id, user.id)).returning()).at(0);
    if (!updatedUser) {
      throw new Error("Failed to update user");
    }
    return new User(updatedUser);
  }
}
