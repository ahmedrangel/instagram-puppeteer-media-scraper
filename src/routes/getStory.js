import { json, StatusError } from "itty-router";
import { addActivePost, isAlreadyProcessed, removeActivePost, setCache, scraper } from "../middleware/scraperHandler.js";
import { getStoryUrlInfo, handleBlockedResources, reLoginAttempt, userAgent } from "../utils/helpers.js";
import { $fetch } from "ofetch";

export const getStory = async (req, env, ctx) => {
  const url = req.query?.url;
  if (!url) throw new StatusError(400, { success: false, error: "url query is required" });

  await reLoginAttempt();

  const storyUrlInfo = getStoryUrlInfo(url);
  if (!storyUrlInfo) throw new StatusError(400, { success: false, error: "Invalid url" });
  const { username, story_id } = storyUrlInfo;

  console.log("Fetching story: " + username + "/" + story_id);

  // Check if cached response exists
  const storyKey = username + "-" + story_id;
  const cachedResponse = await isAlreadyProcessed(storyKey);
  if (cachedResponse) {
    console.log("Using cached response for story: " + storyKey);
    return json(cachedResponse);
  }

  let currentPage, dataResponse;
  try {
    currentPage = await scraper.browser.newPage();
    const cookie = await currentPage.cookies();
    const headers = {
      "cookie": cookie,
      "user-agent": userAgent,
      "x-ig-app-id": "936619743392459",
      ["sec-fetch-site"]: "same-origin"
    };

    const userData = await $fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`, { headers }).catch(() => null);
    const userId = userData?.data?.user?.id;
    if (!userId) throw new StatusError(500, { success: false, error: `User not found: ${username}` });

    const apiURL = new URL("https://www.instagram.com/graphql/query");
    apiURL.searchParams.set("query_hash", "bf41e22b1c4ba4c9f31b844ebb7d9056");
    apiURL.searchParams.set("variables", JSON.stringify({ reel_ids: userId, precomposed_overlay: false }));

    await currentPage.setRequestInterception(true);
    currentPage.on("request", handleBlockedResources);

    addActivePost(storyKey);
    currentPage.on("response", async (response) => {
      const contentType = response.headers()["content-type"];
      if (contentType && contentType.includes("application/json")) {
        // Parse JSON
        dataResponse = await response.json();
        console.log("Require login?: " + dataResponse?.require_login);
        if (!dataResponse?.require_login) {
          const items = dataResponse?.data?.reels_media[0]?.items;
          dataResponse = items.find(item => item.id === story_id);
          setCache(storyKey, dataResponse);
          console.log("Successfully fetched story: " + storyKey);
        }
        else if (dataResponse?.require_login) {
          console.log("Failed to fetch story: " + storyKey);
          scraper.loggedIn = false;
          throw { status: 500, success: false, error: "An error ocurred. Please try again" };
        }
      }
      else {
        console.log("Failed to fetch story: " + storyKey);
        scraper.loggedIn = false;
        throw { status: 500, success: false, error: "An error ocurred. Please try again" };
      }
    });

    await currentPage.goto(apiURL, { waitUntil: "networkidle0" });
    await currentPage.pdf({ path: "story.pdf", format: "A4" });
    return json(dataResponse);
  }
  catch (error) {
    console.error(error);
    return new StatusError(error?.status || 500, error);
  }
  finally {
    removeActivePost(storyKey);
    await currentPage.close();
  }
};