const params = new URLSearchParams(window.location.search);
const redirectedPath = params.get("p");

if (redirectedPath) {
  const path = redirectedPath.startsWith("/") ? redirectedPath : `/${redirectedPath}`;
  const query = params.get("q");
  const hash = params.get("h");
  const restoredUrl = `/Queenify${path}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
  window.history.replaceState(null, "", restoredUrl);
}
