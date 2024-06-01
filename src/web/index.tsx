import { Hono } from "hono";

import { Navbar } from "./components/Navbar";

const web = new Hono();

web.get("/", (context) => {
  return context.html(
    <html>
      <head>
        <title>Character Vault</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://kit.fontawesome.com/e9655a2de7.js" crossorigin="anonymous"></script>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <aside class="fixed left-0 h-full border-r-2 border-gray-700 bg-gray-900 px-2">
          <Navbar
            navbarItems={[
              { label: "Home", href: "/", icon: "fa-solid fa-home" },
              { label: "Characters", href: "/characters", icon: "fa-solid fa-users" },
            ]}
          />
        </aside>
        <header>
          <h1>Character Vault</h1>
          <p>Coming soon...</p>
        </header>
      </body>
    </html>,
  );
});
export default web;
