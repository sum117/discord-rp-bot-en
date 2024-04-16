import { eq } from "drizzle-orm";
import db from "../database";
import { Character } from "../models/Character";
import { User } from "../models/User";
import { users } from "../schema";

export default class UserService {
  public static async getOrCreateUser(userId: string, withCharacters = false) {
    let foundUser;

    if (withCharacters) {
      const userAndCharacterData = await db.query.usersToCharacters.findMany({
        where: (usersToCharacters, { eq }) => eq(usersToCharacters.userId, userId),
        with: { character: true, user: true },
      });
      if (userAndCharacterData.length) {
        foundUser = userAndCharacterData.reduce((userObject, { user, character }) => {
          if (!userObject.id) {
            userObject = new User(user);
          }

          if (character) {
            if (!userObject.characters) {
              userObject.characters = [new Character(character)];
            } else {
              userObject.characters.push(new Character(character));
            }
          }

          return userObject;
        }, <User>{});
      } else {
        foundUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, userId),
        });
      }
    } else {
      foundUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });
    }

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
