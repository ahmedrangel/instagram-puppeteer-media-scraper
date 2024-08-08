export const getPostId = (url) => {
  const regex = /instagram.com\/(?:[A-Za-z0-9_.]+\/)?(p|reels|reel|stories)\/([A-Za-z0-9-_]+)/;
  const match = url.match(regex);
  return match && match[2] ? match[2] : null;
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

export const maxAge = 86400;