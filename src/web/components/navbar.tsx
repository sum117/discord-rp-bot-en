import { Button } from "./Button";

export type NavbarItem = {
  label: string;
  href: string;
  icon: string;
};
export type NavbarProps = {
  navbarItems: NavbarItem[];
};
export function Navbar(navbarProps: NavbarProps) {
  return (
    <nav>
      <ul class="grid gap-y-2 py-2">
        {navbarProps.navbarItems.map((item) => (
          <li>
            <Button as="a" className="block">
              <i class={item.icon}></i>
              {item.label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
