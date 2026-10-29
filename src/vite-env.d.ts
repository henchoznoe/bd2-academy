/// <reference types="vite/client" />
declare module "*.mdx" {
  export const meta: import("./lib/catalog").Lesson;
  const Component: import("react").ComponentType;
  export default Component;
}
