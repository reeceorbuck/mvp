import { app } from "./main.tsx";

Deno.serve({ port: 3032 }, app.fetch);
