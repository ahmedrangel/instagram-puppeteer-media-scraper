import puppeteer from "puppeteer";
import NodeCache from "node-cache";
import { StatusError } from "itty-router";
import "dotenv/config";

const minimalArgs = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
  "--window-size=100,100"
];

const browserOptions = {
  headless: "new",
  defaultViewport: { width: 400, height: 400 },
  args: minimalArgs
};

if (process.env.PUPPETEER_PATH) {
  browserOptions.executablePath = process.env.PUPPETEER_PATH;
}

const middleware = {};

export const launchBrowser = async () => {
  if (middleware.browser) return;
  middleware.browser = await puppeteer.launch(browserOptions);
  console.log("Browser launched");
};

export const login = async () => {
  const newPage = await middleware.browser.newPage();
  await newPage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36");
  await newPage.goto("https://www.instagram.com/accounts/login/", {
    waitUntil: "networkidle0"
  });
  console.log("Waiting for login page to load...");
  newPage.waitForSelector("input[name=\"username\"]"),
  await newPage.type("input[name=\"username\"]", process.env.IG_USER);
  await newPage.type("input[name=\"password\"]", process.env.IG_PASSWORD);
  await Promise.all([
    newPage.click("button[type=\"submit\"]"),
    newPage.waitForNavigation({ waitUntil: "networkidle0" })
  ]);
  if (newPage.url().includes("/accounts/onetap/") || newPage.url().includes("/challenge")) {
    try {
      await Promise.all([
        newPage.waitForSelector("div[role=\"button\"]", { timeout: 10000 }),
        newPage.click("div[role=\"button\"]"),
        newPage.waitForNavigation({ waitUntil: "networkidle0" })
      ]);
      console.log("Clicked Not Now or Dismiss button");
    }
    catch (error) {
      console.log("Error clicking Not Now or Dismiss button", error);
    }
  }
  console.log("Successfully logged in");
  console.log("Current URL: " + newPage.url());
  await newPage.close();
};

export const reLogin = async () => {
  await middleware.browser.close();
  await launchBrowser();
  await login();
};

// Initialize dependencies
middleware.cache = new NodeCache();
middleware.activePostsId = {};

export const addActivePost = (tabId) => {
  middleware.activePostsId[tabId] = true;
};

export const removeActivePost = (tabId) => {
  delete middleware.activePostsId[tabId];
};

export const setCache = async (key, value, expire = 14400) => {
  try {
    const cachedValue = JSON.stringify(value);
    middleware.cache.set(key, cachedValue, expire);
  }
  catch (error) {
    console.log("Error setting cache:", error);
  }
};

export const getCache = async (cacheKey) => {
  try {
    const cachedValue = await middleware.cache.get(cacheKey);
    if (cachedValue) {
      const parsedValue = JSON.parse(cachedValue);
      return parsedValue;
    }
  }
  catch (error) {
    console.log("Error getting cache:", error);
  }
  return null;
};

export const waitForCache = (key, tabId = null, attempts = 15) => {
  const waitedTabId = tabId || key;
  return new Promise((resolve) => {
    let secondsRemaining = attempts;
    const interval = setInterval(async () => {
      const cachedResponse = await getCache(key);
      if (cachedResponse) {
        clearInterval(interval);
        resolve(cachedResponse);
      }

      if (secondsRemaining === 0) {
        clearInterval(interval);
        resolve(null);
      }

      if (!(waitedTabId in middleware.activePostsId)) {
        secondsRemaining = 0;
      }
      else {
        secondsRemaining -= 1;
      }
    }, 1000);
  });
};

export const isAlreadyProcessed = async (key, tabId = null) => {
  const waitedTabId = tabId || key;
  // Check if cached response exists
  let cachedResponse = await getCache(key);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Check if this post is being processed
  if (key in middleware.activePostsId) {
    cachedResponse = await waitForCache(key, waitedTabId);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw new StatusError(408, { success: false, error: "Request timed out, please try again" });
  }

  return null;
};

export const scraper = middleware;
