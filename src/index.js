import { AutoRouter, error, cors } from "itty-router";
import { createServerAdapter } from "@whatwg-node/server";
import { createServer } from "http";
import { getPost } from "./routes/getPost.js";
import { getStory } from "./routes/getStory.js";
import "dotenv/config";
import { launchBrowser, login } from "./middleware/scraperHandler.js";

await launchBrowser();
await login();

const { preflight, corsify } = cors();
const router = AutoRouter({
  before: [preflight],
  catch: error,
  finally: [corsify]
});

router.get("/post?", getPost);
router.get("/story?", getStory);

const ittyServer = createServerAdapter((req, env, ctx) => router.fetch(req, env, ctx));
const httpServer = createServer(ittyServer);
httpServer.listen(process.env.SERVER_PORT);
console.log(`Server is running on port ${process.env.SERVER_PORT}`);