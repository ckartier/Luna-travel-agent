---
name: firecrawl-scraper
description: "Web scraping skill using the Firecrawl API. Use this when the user wants to extract content from web pages, scrape hotel/destination info, or batch-crawl URLs. Handles JavaScript-rendered pages, screenshots, and structured extraction."
---

# Firecrawl Web Scraper

## Overview

Use the Firecrawl API to extract clean, structured content from any web page — including JavaScript-rendered sites. Ideal for enriching hotel/destination data, competitive research, and content extraction for travel documents.

## Setup

### API Key

1. Sign up at [firecrawl.dev](https://firecrawl.dev) (free tier: 500 credits, no card required)
2. Get your API key from the dashboard
3. Set the environment variable:
   ```bash
   export FIRECRAWL_API_KEY="fc-..."
   ```

### Install Python SDK

```bash
pip install firecrawl-py
```

---

## Usage

### Basic Scrape (1 credit = 1 page)

```python
import os
import requests

API_KEY = os.getenv("FIRECRAWL_API_KEY")

response = requests.post(
    "https://api.firecrawl.dev/v1/scrape",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "url": "https://www.example-hotel.com",
        "formats": ["markdown"],
    }
)

data = response.json()["data"]
content = data["markdown"]       # Clean text content
title = data["metadata"]["title"]
description = data["metadata"].get("description", "")
image = data["metadata"].get("ogImage", "")
```

### Using Python SDK

```python
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key=os.getenv("FIRECRAWL_API_KEY"))

# Scrape a single page
result = app.scrape_url("https://www.example-hotel.com", params={
    "formats": ["markdown"]
})

# Crawl an entire site (uses more credits)
crawl = app.crawl_url("https://www.example-hotel.com", params={
    "limit": 10,  # Max pages to crawl
    "formats": ["markdown"]
})
```

### Batch Scraping (Multiple URLs)

```python
urls = [
    "https://hotel-a.com",
    "https://hotel-b.com",
    "https://hotel-c.com",
]

results = []
for url in urls:
    response = requests.post(
        "https://api.firecrawl.dev/v1/scrape",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"url": url, "formats": ["markdown"]}
    )
    if response.status_code == 200:
        results.append(response.json()["data"])
```

### Extract Structured Data (2-5 credits/page)

```python
response = requests.post(
    "https://api.firecrawl.dev/v1/scrape",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "url": "https://www.hotel.com",
        "formats": ["extract"],
        "extract": {
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "stars": {"type": "number"},
                    "description": {"type": "string"},
                    "amenities": {"type": "array", "items": {"type": "string"}},
                    "price_range": {"type": "string"},
                    "location": {"type": "string"}
                }
            }
        }
    }
)

hotel_data = response.json()["data"]["extract"]
```

---

## Luna Use Cases

| Scenario | Method | Credits |
|----------|--------|---------|
| Enrichir fiche hôtel | `scrape` + `extract` | 2-5 /page |
| Infos destination (météo, visa…) | `scrape` markdown | 1 /page |
| Veille prix Booking/Expedia | `scrape` markdown | 1 /page |
| Crawler site hôtel complet | `crawl` (limit 10) | 10 max |
| Infos pratiques (France Diplomatie) | `scrape` markdown | 1 /page |

---

## Rate Limits (Free Tier)

| Limit | Value |
|-------|-------|
| Total credits | 500 (one-time) |
| Scrapes/minute | 10 |
| Crawls/minute | 1 |
| Concurrent requests | 2 |

---

## Reference

- [API Documentation](https://docs.firecrawl.dev)
- [Python SDK](https://pypi.org/project/firecrawl-py/)
- [Dashboard](https://firecrawl.dev/dashboard)
