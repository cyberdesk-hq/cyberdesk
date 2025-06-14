import { newApp } from "./lib/hono.js";
import desktop from "./routes/desktop.js";
import { serve } from "@hono/node-server";
import * as dotenv from 'dotenv'
export * as schema from "./db/schema.js"

// Load environment variables from .env.local file
dotenv.config()

const app = newApp();

// app.use(initCache());
// app.use(initRatelimiter());

app.route("/v1/", desktop);

app.get("/health", (c) => c.json({ status: "ok" }));

// Use PORT environment variable with fallback to 3000 for local development
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

serve(
  {
    fetch: app.fetch,
    port: port
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`);
  }
);
