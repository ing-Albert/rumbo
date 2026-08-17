import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  // El build "native" es el que empaqueta Capacitor. Ahi el service worker
  // sobra (los assets ya viajan dentro del APK) y encima estorba: cachearia
  // los archivos de una version vieja y la app quedaria pegada tras actualizar.
  // Con `disable` el plugin sigue resolviendo `virtual:pwa-register`, pero
  // como un no-op, asi que `main.tsx` no necesita saber en que modo corre.
  const isNative = mode === "native";

  return {
    plugins: [
      react(),
      VitePWA({
        disable: isNative,
        registerType: "autoUpdate",
        includeAssets: ["icon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "Rumbo - Planificacion de ahorro",
          short_name: "Rumbo",
          description: "Organiza lo que entra, lo que sale y lo que quieres alcanzar.",
          theme_color: "#6B2948",
          background_color: "#FFF8F0",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "/icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any maskable"
            }
          ]
        },
        workbox: {
          navigateFallback: "/index.html",
          globPatterns: ["**/*.{js,css,html,svg,woff,woff2}"]
        }
      })
    ],
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": "http://localhost:3001",
        "/health": "http://localhost:3001"
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            supabase: ["@supabase/supabase-js"]
          }
        }
      }
    }
  };
});
