import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import Waifuvault from "waifuvault-node-api";

import CharacterService from "@/services/characterService";
import UserService from "@/services/userService";

const api = new Hono();

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

api.post(
  "/characters/create/:userId",
  bodyLimit({
    maxSize: 50 * 1024 * 1024,
    onError: (context) => {
      return context.json({ ok: false, error: "File too large" }, 413);
    },
  }),
  async (context) => {
    const userId = context.req.param("userId");
    if (!userId || !matchDiscordId.test(userId)) {
      return context.json({ ok: false, error: "Invalid user id" }, 400);
    }
    const characterFormData = await context.req.parseBody<{
      name: string;
      image: File;
      title: string;
      embedColor: string;
    }>({});
    if (!(characterFormData.image instanceof File)) {
      return context.json({ ok: false, error: "Image is required" }, 400);
    }
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(characterFormData.image.type)) {
      return context.json({ ok: false, error: "Invalid image type" }, 400);
    }
    const buffer = Buffer.from(await characterFormData.image.arrayBuffer());
    const uploadedFile = await Waifuvault.uploadFile({
      file: buffer,
      filename: `${characterFormData.name}.${characterFormData.image.type.split("/").pop()}`,
    });
    const characterToCreate = { ...characterFormData, imageUrl: uploadedFile.url };
    const newCharacter = await CharacterService.createCharacter({ authorId: userId, ...characterToCreate });
    return context.json({ ok: true, character: newCharacter }, 201);
  },
);

export default api;
