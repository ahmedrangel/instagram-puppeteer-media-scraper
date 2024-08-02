import { AutoRouter, error, cors } from "itty-router";
import { createServerAdapter } from "@whatwg-node/server";
import { createServer } from "http";
import { getPost } from "./routes/getPost.js";

const { preflight, corsify } = cors();
const router = AutoRouter({
  before: [preflight],
  catch: error,
  finally: [corsify]
});

router.get("/post?", getPost);

const ittyServer = createServerAdapter((req, env, ctx) => router.fetch(req, env, ctx));
const httpServer = createServer(ittyServer);
httpServer.listen(8080);