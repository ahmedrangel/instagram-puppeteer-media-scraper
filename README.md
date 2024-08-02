# Instagram Puppeteer Media Scraper API
Scrape instagram post medias using puppeteer and itty-router.

# Setup
Clone the repository

```sh
git clone https://github.com/ahmedrangel/instagram-puppeteer-media-scraper.git
```

Intsall dependencies
```sh
cd instagram-puppeteer-media-scraper && pnpm i
```

Add your `SERVER_PORT`, `IG_USER`, `IG_PASSWORD` env variable in the .env
```sh
# .env example
SERVER_PORT = "3000"
IG_USER =
IG_PASSWORD =
```

Running the server
```sh
pnpm start
```

# API Endpoints
- `GET /post?url=${POST_URL}`