export type ButtonProps = {
  children?: JSX.Element;
  className?: string;
  as: "button" | "a";
};

export function Button(props: ButtonProps) {
  const className = [
    "rounded-md border border-gray-100/20 bg-gray-800 px-4 py-2 text-lg font-bold text-white shadow-sm shadow-black transition-colors duration-200 hover:bg-gray-700 cursor-pointer hover:border-white flex items-center gap-x-2",
    props.className,
  ].join(" ");
  const Element = props.as;
  return <Element class={className}>{props.children}</Element>;
}
