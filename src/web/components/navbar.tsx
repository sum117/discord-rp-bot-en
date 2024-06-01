import type { z } from "zod";

import type { jwtPayloadSchema } from "@/api/schema";

import { Button } from "./button";
import { UserCard } from "./user-card";

export type NavbarItem = {
  label: string;
  href: string;
  icon: string;
};
export type NavbarProps = {
  navbarItems: NavbarItem[];
  user: z.infer<typeof jwtPayloadSchema> | null;
};
export function Navbar(navbarProps: NavbarProps) {
  return (
    <nav>
      {navbarProps.user !== null && <UserCard user={navbarProps.user} />}
      <ul class="grid gap-y-2 py-2">
        {navbarProps.navbarItems
          .filter((item) => {
            if (navbarProps.user) {
              return item.href !== "/auth";
            }
            return true;
          })
          .map((item) => (
            <li>
              <Button as="a" className="block" href={item.href}>
                <i class={item.icon}></i>
                {item.label}
              </Button>
            </li>
          ))}
      </ul>
    </nav>
  );
}
