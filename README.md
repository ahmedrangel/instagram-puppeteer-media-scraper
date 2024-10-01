# Instagram Puppeteer Media Scraper API
Scrape instagram post medias using puppeteer and itty-router.

# Setup

Install dependencies
```sh
pnpm i
```

Add your `SERVER_PORT`, `IG_USER`, `IG_PASSWORD` env variable in the .env
```sh
# .env example
SERVER_PORT = "3000"
IG_USER = "YOUR_USERNAME"
IG_PASSWORD = "YOUR_PASSWORD"
```

Running the server
```sh
pnpm start
```

# API Endpoints
- `GET /post?url=${POST_URL}`
- `GET /story?url=${STORY_URL}`