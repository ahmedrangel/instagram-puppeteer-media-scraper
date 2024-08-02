import { json, StatusError } from "itty-router";
import { addActivePost, isAlreadyProcessed, removeActivePost, setCache, scraper } from "../middleware/scraperHandler.js";
import { getPostId, handleBlockedResources } from "../utils/helpers.js";

export const getPost = async (req, env, ctx) => {
  const url = req.query?.url;
  if (!url) throw new StatusError(400, { success: false, error: "url query is required" });

  const postId = getPostId(url);

  // Check if cached response exists
  const cachedResponse = await isAlreadyProcessed(postId);
  if (cachedResponse) return json(cachedResponse);

  let currentPage, dataResponse;
  try {
    const apiURL = new URL("https://www.instagram.com/graphql/query");
    apiURL.searchParams.set("query_hash", "9f8827793ef34641b2fb195d4d41151c");
    apiURL.searchParams.set("variables", JSON.stringify({ shortcode: postId }));

    currentPage = await scraper.browser.newPage();
    await currentPage.setRequestInterception(true);
    currentPage.on("request", handleBlockedResources);

    addActivePost(postId);
    currentPage.on("response", async (response) => {
      const contentType = response.headers()["content-type"];
      if (contentType && contentType.includes("application/json")) {
        // Parse JSON response
        dataResponse = await response.json();
        setCache(postId, dataResponse);
      }
    });

    await currentPage.goto(apiURL, { waitUntil: "networkidle0" });
    return json(dataResponse);
  }
  catch (error) {
    console.error(error);
    return error(500, { success: false, error: "Internal server error" });
  }
  finally {
    removeActivePost(postId);
    await currentPage.close();
  }
};