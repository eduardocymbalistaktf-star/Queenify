// Restore SPA deep links routed through the GitHub Pages 404 document.
const routeKey = "queenify:github-pages-route";
const savedRoute = sessionStorage.getItem(routeKey);

if (savedRoute) {
  sessionStorage.removeItem(routeKey);
  if (savedRoute.startsWith("/") && !savedRoute.startsWith("//")) {
    window.history.replaceState(null, "", savedRoute);
  }
}
