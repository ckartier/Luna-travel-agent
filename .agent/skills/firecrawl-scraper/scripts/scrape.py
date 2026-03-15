#!/usr/bin/env python3
"""
Firecrawl Scraper — Quick scrape utility for Luna.
Usage: python scrape.py <url> [--extract]
"""
import os
import sys
import json
import requests

API_KEY = os.getenv("FIRECRAWL_API_KEY")
API_URL = "https://api.firecrawl.dev/v1/scrape"

HOTEL_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "stars": {"type": "number"},
        "description": {"type": "string"},
        "amenities": {"type": "array", "items": {"type": "string"}},
        "price_range": {"type": "string"},
        "location": {"type": "string"},
        "check_in": {"type": "string"},
        "check_out": {"type": "string"},
    }
}


def scrape(url, extract=False):
    if not API_KEY:
        print("Error: FIRECRAWL_API_KEY not set.")
        print("Get a free key at https://firecrawl.dev")
        sys.exit(1)

    payload = {"url": url, "formats": ["markdown"]}
    if extract:
        payload["formats"].append("extract")
        payload["extract"] = {"schema": HOTEL_SCHEMA}

    response = requests.post(
        API_URL,
        headers={"Authorization": f"Bearer {API_KEY}"},
        json=payload
    )

    if response.status_code != 200:
        print(f"Error {response.status_code}: {response.text}")
        sys.exit(1)

    data = response.json().get("data", {})
    result = {
        "url": url,
        "title": data.get("metadata", {}).get("title", ""),
        "description": data.get("metadata", {}).get("description", ""),
    }

    if extract and "extract" in data:
        result["extracted"] = data["extract"]
    
    if "markdown" in data:
        result["content_length"] = len(data["markdown"])
        result["content_preview"] = data["markdown"][:500]

    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scrape.py <url> [--extract]")
        sys.exit(1)
    
    url = sys.argv[1]
    extract = "--extract" in sys.argv
    result = scrape(url, extract)
    print(json.dumps(result, indent=2, ensure_ascii=False))
