import CharacterService from "@/services/characterService";
import UserService from "@/services/userService";
import { Hono } from "hono";
import { cors } from "hono/cors";

const api = new Hono();

api.use("/characters/*", cors());
const matchDiscordId = new RegExp("^[0-9]{18,20}$");

api.get("/characters/:userId", async (context) => {
  const userId = context.req.param("userId");
  if (!matchDiscordId.test(userId)) {
    return context.json({ ok: false, error: "Invalid user id" }, 400);
  }
  const userCharacters = await CharacterService.getCharacters({ userId });

  return context.json({
    ok: true,
    userCharacters,
  });
});

api.patch("/characters/set-active/:userId/:characterId", async (context) => {
  const userId = context.req.param("userId");
  if (!matchDiscordId.test(userId)) {
    return context.json({ ok: false, error: "Invalid user id" }, 400);
  }

  const characterId = context.req.param("characterId");
  const characterIdParsed = parseInt(characterId);
  if (isNaN(characterIdParsed)) {
    return context.json({ ok: false, error: "Invalid character id" }, 400);
  }

  const user = await UserService.getOrCreateUser(userId);

  const character = await CharacterService.getCharacterById(characterIdParsed);
  if (!character) {
    return context.json({ ok: false, error: "Character not found" }, 404);
  }
  user.currentCharacterId = character.id;
  await UserService.updateUser(user);
  return context.json({
    ok: true,
    message: "Character with id " + character.id + " set as active",
  });
});

export default api;
