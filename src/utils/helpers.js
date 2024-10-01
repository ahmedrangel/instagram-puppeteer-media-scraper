import { StatusError } from "itty-router";
import { launchBrowser, login } from "../middleware/scraperHandler.js";

export const getPostId = (url) => {
  const regex = /instagram.com\/(?:[A-Za-z0-9_.]+\/)?(p|reels|reel)\/([A-Za-z0-9-_]+)/;
  const match = url.match(regex);
  return match && match[2] ? match[2] : null;
};

export const getStoryUrlInfo = (url) => {
  const regex = /instagram\.com\/stories\/([A-Za-z0-9-_]+)\/(\d+)/;
  const match = url.match(regex);
  return match && match[1] ? { username: match[1], story_id: match[2] } : null;
};

export const handleBlockedResources = (request) => {
  const blockedResources = [
    "image",
    "stylesheet",
    "font",
    "ping",
    "media",
    "manifest",
    "other"
  ];
  if (blockedResources.includes(request.resourceType())) {
    request.abort();
  }
  else {
    request.continue();
  }
};

export const reLoginAttempt = async () => {
  await launchBrowser();
  try {
    await login();
  }
  catch (error) {
    return new StatusError(error?.status || 500, error);
  }
};

export const maxAge = 86400;

export const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";