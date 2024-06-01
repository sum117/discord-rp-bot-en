import { Hono } from "hono";
import type { z } from "zod";

import { SessionAuth } from "@/api/auth";
import type { jwtPayloadSchema } from "@/api/schema";
import type { characters } from "@/schema";

import { Navbar, type NavbarItem } from "./components/navbar";

const web = new Hono();
const navbarItems: Array<NavbarItem> = [
  { label: "Login", href: "/auth", icon: "fa-solid fa-sign-in" },
  { label: "Home", href: "#", icon: "fa-solid fa-home" },
];
const Layout = ({
  user = null,
  children,
}: {
  user: z.infer<typeof jwtPayloadSchema> | null;
  children?: JSX.Element;
}) => {
  return (
    <html>
      <head>
        <title>Character Vault</title>
        <script
          src="https://unpkg.com/htmx.org@1.9.12"
          integrity="sha384-ujb1lZYygJmzgSwoxRggbCHcjc0rB2XoQrxeTUQyRjrOnlCoYta87iKBWq3EsdM2"
          crossorigin="anonymous"
        ></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://kit.fontawesome.com/e9655a2de7.js" crossorigin="anonymous"></script>
      </head>
      <body class="flex bg-black text-white">
        <aside class="h-full min-w-52 border-r-2 border-gray-700 bg-gray-900 px-2">
          <Navbar user={user} navbarItems={navbarItems} />
        </aside>
        <main class="w-full overflow-y-scroll px-4 py-2">{children}</main>
      </body>
    </html>
  );
};

web.get("/", SessionAuth({ protectedRoute: false }), (context) => {
  const sessionUser = context.get("user");
  return context.html(
    <Layout user={sessionUser}>
      <header class="mb-8 [&>p:not(:last-child)]:mb-3 [&>p]:max-w-prose [&>p]:pl-2">
        <h1 class="mb-4 text-5xl">
          Character Vault <span class="text-sm italic text-white/50">Coming soon...</span>
        </h1>
        <p>
          Character Vault is a web application that allows you to store and manage your characters for various discord
          servers.
        </p>
        <p>This website is currently under development and is not yet ready for production.</p>
      </header>
      {sessionUser && <h2 class="mb-4 text-3xl">Your Characters</h2>}
      <ul id="characters" hx-get="/characters" hx-trigger="load" hx-swap="outerHTML" hx-target="#characters"></ul>
    </Layout>,
  );
});

web.get("/characters", SessionAuth({ protectedRoute: true }), async (context) => {
  const user = context.get("user");
  if (!user) {
    return context.json({ error: "Internal Server Error" }, 500);
  }

  const charactersJson = await fetch(`${Bun.env.BASE_URL}/api/characters/${user.userId}`);
  const { userCharacters } = (await charactersJson.json()) as { userCharacters: Array<typeof characters.$inferInsert> };
  return context.html(
    <ul id="characters" class="grid grid-cols-2 gap-4">
      {userCharacters.map((character) => (
        <li
          key={character.id}
          tabindex="0"
          class="flex cursor-pointer items-center overflow-hidden rounded-md border border-gray-100/20 bg-gray-900 shadow-sm shadow-black transition-colors duration-200 hover:border-white hover:bg-gray-700 focus:border-white focus:bg-gray-700"
        >
          <img
            src={character.imageUrl}
            alt={character.name}
            width="128"
            height="128"
            class="aspect-square object-cover"
          />
          <div class="flex w-full justify-between px-4">
            <h3 class="text-ellipsis text-lg font-semibold">{character.name}</h3>
            <span>{character.level}</span>
          </div>
        </li>
      ))}
    </ul>,
  );
});
export default web;
