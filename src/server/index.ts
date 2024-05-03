import { Hono } from "hono";
import { cors } from "hono/cors";

import CharacterService from "@/services/characterService";
import UserService from "@/services/userService";

const api = new Hono();

api.use("/characters/*", cors());
const matchDiscordId = new RegExp("^[0-9]{18,20}$");

api.get("/characters/:userId", async (context) => {
  const userId = context.req.param("userId");
  if (!matchDiscordId.test(userId)) {
    return context.json({ ok: false, error: "Invalid user id" }, 400);
  }
  const userCharacters = await CharacterService.getCharacters({ userId });
  const userCurrentCharacter = await CharacterService.getCurrentCharacterByUserId(userId);

  return context.json({
    ok: true,
    userCharacters,
    userCurrentCharacter,
  });
});

api.patch("/characters/set-active/:userId/:characterId", async (context) => {
  const userId = context.req.param("userId");
  if (!matchDiscordId.test(userId)) {
    return context.json({ ok: false, error: "Invalid user id" }, 400);
  }

  const characterId = context.req.param("characterId");
  if (characterId === "null") {
    const user = await UserService.getOrCreateUser(userId);
    user.currentCharacterId = null;
    await UserService.updateUser(user);
    return context.json({
      ok: true,
      action: "remove",
      message: "Active character removed",
    });
  }

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
    action: "set",
    message: "Character with id " + character.id + " set as active",
  });
});

api.post("/characters", async (context) => {
  const userId = context.req.query("userId");
  if (!userId || !matchDiscordId.test(userId)) {
    return context.json({ ok: false, error: "Invalid user id" }, 400);
  }

  const character = await context.req.json();
  if (character.imageUrl && !character.imageUrl.startsWith("data:image/")) {
    return context.json({ ok: false, error: "Invalid image" }, 400);
  }
  if (character.imageUrl) {
    const imgurResponse = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: "Client-ID " + Bun.env.IMGUR_CLIENT_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: character.imageUrl }),
    });
    const imgurJson = await imgurResponse.json();
    if (!imgurJson.success) {
      return context.json({ ok: false, error: "Error uploading image" }, 500);
    }
    character.imageUrl = imgurJson.data.link;
  } else {
    return context.json({ ok: false, error: "Image is required" }, 400);
  }

  const newCharacter = await CharacterService.createCharacter({ authorId: userId, ...character });
  return context.json({ ok: true, character: newCharacter });
});

export default api;
