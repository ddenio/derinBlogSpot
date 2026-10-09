export const publicRoutes = [
  "/",
  "/email-verification",
  "/password-email-form",
  "/password-reset-form",
];

// Dynamic public routes, matched against the whole pathname
export const publicRoutePatterns = [
  /^\/blog\/feed\/\d+$/, // /blog/feed/1, /blog/feed/2, ...
  /^\/blog\/[^/]+$/, // /blog/<id>, but not nested paths
];

export const authRoutes = ["/login", "/register"];

export const apiAuthPrefix = "/api/auth";

export const LOGIN_REDIRECT = "/blog/feed/1";
