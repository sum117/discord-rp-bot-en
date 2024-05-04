import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { DateTime } from "luxon";

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
      context.json({ ok: false, error: "File too large" }, 413);
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
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!(characterFormData.image instanceof File)) {
      return context.json({ ok: false, error: "Image is required" }, 400);
    }
    const isImage = (image: File): image is File & { type: string } => {
      return "type" in image && typeof image.type === "string" && allowedTypes.includes(image.type);
    };
    if (!isImage(characterFormData.image)) {
      return context.json({ ok: false, error: "Invalid image type" }, 400);
    }

    const formData = await context.req.formData();
    formData.delete("name");
    formData.delete("embedColor");
    formData.append("image", characterFormData.image);
    formData.append("type", "image");
    formData.append("title", characterFormData.name + " - " + DateTime.now().toISO());

    console.log(formData);

    const imgurResponse = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: "Client-ID " + Bun.env.IMGUR_CLIENT_ID,
      },
      body: formData,
    });
    const imgurJson = await imgurResponse.json();
    if (!imgurJson.success) {
      return context.json({ ok: false, error: "Error uploading image" }, 500);
    }
    const characterToCreate = { ...characterFormData, imageUrl: imgurJson.data.link };
    const newCharacter = await CharacterService.createCharacter({ authorId: userId, ...characterToCreate });
    return context.json({ ok: true, character: newCharacter }, 201);
  },
);

export default api;
