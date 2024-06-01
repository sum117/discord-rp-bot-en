import { z } from "zod";

export const discordAuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
});
export const discordUserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string(),
  discriminator: z.string(),
  public_flags: z.number(),
  flags: z.number(),
  banner: z.string(),
  accent_color: z.string().nullable(),
  global_name: z.string(),
  avatar_decoration_data: z.object({
    asset: z.string(),
    sku_id: z.string(),
  }),
  banner_color: z.string().nullable(),
  clan: z.string().nullable(),
  mfa_enabled: z.boolean(),
  locale: z.string(),
  premium_type: z.number(),
});
export const jwtPayloadSchema = z.object({
  userId: z.string(),
  username: z.string(),
  avatar: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  exp: z.number(),
});

export const isAuthenticatedSchema = z.object({
  isAuthenticated: z.boolean(),
});
