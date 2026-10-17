import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages project sites live under /<repository>/.
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    host: "127.0.0.1",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: "Queenify",
        short_name: "Queenify",
        description: "Conheça a prévia Queenify para organizar produtos digitais.",
        lang: "pt-BR",
        theme_color: "#35b8f2",
        background_color: "#0b1018",
        display: "standalone",
        orientation: "any",
        start_url: process.env.VITE_BASE_PATH || "/",
        icons: [
          { src: `${process.env.VITE_BASE_PATH || "/"}queenify-192.png`, sizes: "192x192", type: "image/png" },
          { src: `${process.env.VITE_BASE_PATH || "/"}queenify-512.png`, sizes: "512x512", type: "image/png" },
          { src: `${process.env.VITE_BASE_PATH || "/"}queenify-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
