import { json, StatusError } from "itty-router";
import { addActivePost, isAlreadyProcessed, removeActivePost, setCache, scraper, launchBrowser } from "../middleware/scraperHandler.js";
import { getPostId, handleBlockedResources } from "../utils/helpers.js";

export const getPost = async (req, env, ctx) => {
  const url = req.query?.url;
  if (!url) throw new StatusError(400, { success: false, error: "url query is required" });

  await launchBrowser();
  await login();

  const postId = getPostId(url);
  console.log("Fetching post: " + postId);

  // Check if cached response exists
  const cachedResponse = await isAlreadyProcessed(postId);
  if (cachedResponse) {
    console.log("Using cached response for post: " + postId);
    return json(cachedResponse);
  }

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
        // Parse JSON
        dataResponse = await response.json();
        console.log(dataResponse);
        if (!dataResponse?.require_login) {
          setCache(postId, dataResponse);
          console.log("Successfully fetched post: " + postId);
        }
        else if (dataResponse?.require_login) {
          console.log("Failed to fetch post: " + postId);
          scraper.loggedIn = false;
          throw { status: 500, success: false, error: "An error ocurred. Please try again" };
        }
      }
      else {
        console.log("Failed to fetch post: " + postId);
        scraper.loggedIn = false;
        throw { status: 500, success: false, error: "An error ocurred. Please try again" };
      }
    });

    await currentPage.goto(apiURL, { waitUntil: "networkidle0" });
    await currentPage.pdf({ path: "post.pdf", format: "A4" });
    return json(dataResponse);
  }
  catch (error) {
    console.error(error);
    return new StatusError(error?.status || 500, error);
  }
  finally {
    removeActivePost(postId);
    await currentPage.close();
  }
};