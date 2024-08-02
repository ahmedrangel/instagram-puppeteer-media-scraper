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

Add a `SERVER_PORT` env variable in the .env
```sh
# .env
SERVER_PORT = "3000"
```

Running the server
```sh
pnpm start
```

# API Endpoints
- `GET /post?url=${POST_URL}`