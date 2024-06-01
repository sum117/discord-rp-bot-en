import { type Context, Hono, type Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import { Duration } from "luxon";
import type { z } from "zod";

import type { jwtPayloadSchema } from "./schema";
import { discordAuthResponseSchema, discordUserResponseSchema } from "./schema";

const JWT_SECRET = "character_vault_jwt_secret_masoria_2024";
const authApi = new Hono();

const clientId = Bun.env.DISCORD_CLIENT_ID!;
const clientSecret = Bun.env.DISCORD_CLIENT_SECRET!;
const redirectUri = `${Bun.env.BASE_URL}/auth/callback`;

interface AuthContext extends Context {
  get(key: "user"): z.infer<typeof jwtPayloadSchema>;
  set(key: "user", value: z.infer<typeof jwtPayloadSchema>): void;
}
export const SessionAuth = ({ protectedRoute }: { protectedRoute: boolean } = { protectedRoute: true }) =>
  createMiddleware<{ Variables: { user: z.infer<typeof jwtPayloadSchema> | null }; Context: AuthContext }>(
    async (context: Context, next: Next) => {
      const session = getCookie(context, "session");
      const handleProtectedRoute = async () => {
        if (protectedRoute) {
          return context.json({ error: "Unauthorized" }, 401);
        } else {
          context.set("user", null);
          await next();
        }
      };
      if (!session) {
        return handleProtectedRoute();
      }
      try {
        const payload = await verify(session, JWT_SECRET);
        context.set("user", payload);
        await next();
      } catch (error) {
        console.error(error);
        return handleProtectedRoute();
      }
    },
  );

authApi.get("/", (context) => {
  const scope = "identify";
  const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  return context.redirect(oauthUrl);
});

authApi.get("/callback", async (context) => {
  const code = context.req.query("code");
  if (!code) {
    return context.redirect("/");
  }

  const body = new URLSearchParams();
  body.append("client_id", clientId);
  body.append("client_secret", clientSecret);
  body.append("grant_type", "authorization_code");
  body.append("code", code);
  body.append("redirect_uri", redirectUri);
  body.append("scope", "identify");

  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = discordAuthResponseSchema.parse(await response.json());
    const accessToken = data.access_token;

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    const user = discordUserResponseSchema.parse(await userResponse.json());
    const session = await sign(
      {
        userId: user.id,
        accessToken,
        refreshToken: data.refresh_token,
        avatar: user.avatar,
        username: user.username,
        exp: Date.now() + Duration.fromObject({ seconds: data.expires_in }).as("milliseconds"),
      },
      JWT_SECRET,
    );
    setCookie(context, "session", session, { httpOnly: true });
    return context.redirect("/");
  } catch (authError) {
    console.error(authError);
    return context.redirect("/");
  }
});

authApi.get("/logout", SessionAuth({ protectedRoute: true }), (context) => {
  context.set("user", null);
  setCookie(context, "session", "", { httpOnly: true, maxAge: 0 });
  return context.redirect("/");
});

export default authApi;
