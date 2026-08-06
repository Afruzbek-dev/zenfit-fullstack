import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Telegram Mini Apps are served over HTTPS from your own domain and loaded
// inside Telegram's WebView via the URL you register with @BotFather.
// `base: "./"` keeps built asset paths relative, which matters if you ever
// serve the build from a sub-path.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    host: true, // allows testing from a phone on the same network / via ngrok
    port: 5173,
  },
});
