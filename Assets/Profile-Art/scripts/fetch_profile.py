"""Public profile + language breakdown from the REST API -> data/profile.json
Uses GITHUB_TOKEN when present (CI) to avoid the 60 req/h anonymous limit."""
import os
from collections import Counter

import requests

from common import save
from config import USERNAME

API = "https://api.github.com"


def main():
    s = requests.Session()
    s.headers["Accept"] = "application/vnd.github+json"
    if os.environ.get("GITHUB_TOKEN"):
        s.headers["Authorization"] = f"Bearer {os.environ['GITHUB_TOKEN']}"

    user = s.get(f"{API}/users/{USERNAME}", timeout=30).json()
    repos = s.get(f"{API}/users/{USERNAME}/repos", params={"per_page": 100, "type": "owner"}, timeout=30).json()
    repos = [r for r in repos if not r["fork"]]

    langs = Counter()
    for r in repos:
        resp = s.get(r["languages_url"], timeout=30)
        if resp.ok:
            langs.update(resp.json())

    save("profile.json", {
        "name": user.get("name"),
        "created_at": user.get("created_at"),
        "public_repos": user.get("public_repos", len(repos)),
        "followers": user.get("followers", 0),
        "stars": sum(r["stargazers_count"] for r in repos),
        "languages": dict(langs.most_common()),
    })
    print(f"{len(repos)} repos, {len(langs)} languages")


if __name__ == "__main__":
    main()
