export interface ButtonProps extends HTMLElement {
  children?: JSX.Element;
  className?: string;
  as: "button" | "a";
  href?: string;
}

export function Button({ children, className, as, href, ...rest }: ButtonProps) {
  const classes = [
    "rounded-md border border-gray-100/20 bg-gray-800 px-4 py-2 text-lg font-bold text-white shadow-sm shadow-black transition-colors duration-200 hover:bg-gray-700 cursor-pointer hover:border-white flex items-center gap-x-2",
    className,
  ].join(" ");
  const Element = as;
  return (
    <Element class={classes} href={href} {...rest}>
      {children}
    </Element>
  );
}
