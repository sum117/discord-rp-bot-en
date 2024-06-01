import type { z } from "zod";

import type { jwtPayloadSchema } from "@/api/schema";

export function UserCard({ user }: { user: z.infer<typeof jwtPayloadSchema> }) {
  return (
    <div class="relative mt-2 rounded-lg bg-gray-800 px-2 py-4">
      <a href="/auth/logout" class="absolute right-2 top-2 text-gray-400 duration-200 hover:text-white">
        <i class="fa-solid fa-sign-out"></i>
      </a>
      <header class="flex items-center justify-start gap-x-4">
        <img
          class="h-12 w-12 rounded-full"
          src={`https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png?size=128`}
          alt={`${user.username}'s avatar`}
        />
        <h2 class="text-xl font-thin">{user.username}</h2>
      </header>
      <p class="text-sm text-gray-400">{user.userId}</p>
    </div>
  );
}
