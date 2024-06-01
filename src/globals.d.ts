import "typed-htmx";

declare global {
  namespace Hono {
    type HTMLAttributes = HtmxAttributes;
  }
}
