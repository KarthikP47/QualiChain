import urllib.request
import json
import csv
import re
import time
import random

def fetch_steemit_posts(method, tag="", limit=100):
    url = "https://api.steemit.com"
    data = json.dumps({
        "jsonrpc": "2.0",
        "method": method,
        "params": [{"tag": tag, "limit": limit}],
        "id": 1
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get("result", [])
    except Exception as e:
        print(f"Error fetching {method} {tag}: {e}")
        return []

def clean_text(text):
    if not text:
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Remove markdown image/link syntax
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    text = re.sub(r'\[.*?\]\(.*?\)', '', text)
    # Remove URLs
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

print("Fetching data from Steemit API... This may take a minute.")

all_posts = []

tags_to_fetch = ["", "crypto", "life", "blog", "photography", "technology", "news"]
methods = [
    "condenser_api.get_discussions_by_trending",
    "condenser_api.get_discussions_by_hot", 
    "condenser_api.get_discussions_by_created"
]

for tag in tags_to_fetch:
    for method in methods:
        print(f"Fetching {method} for tag '{tag}'...")
        posts = fetch_steemit_posts(method, tag, 100)
        all_posts.extend(posts)
        time.sleep(0.5) # Be gentle to the API

# Remove duplicates based on permlink
unique_posts = {}
for p in all_posts:
    if 'permlink' in p:
        unique_posts[p['permlink']] = p

rows = []
for p in unique_posts.values():
    body = clean_text(p.get('body', ''))
    if len(body) < 20:
        continue # Skip completely empty/tiny posts

    upvotes = 0
    downvotes = 0
    for vote in p.get('active_votes', []):
        if int(vote.get('percent', 0)) > 0:
            upvotes += 1
        elif int(vote.get('percent', 0)) < 0:
            downvotes += 1

    # Heuristic for determining quality label (0 or 1)
    # Since we can't manually label them all, we rely on community votes
    # and post length. A good post usually has net positive votes and some length.
    
    label = 0
    if upvotes > 20 and downvotes == 0 and len(body) > 200:
        label = 1
    elif upvotes > 5 * downvotes and len(body) > 500:
        label = 1
    elif (upvotes - downvotes) > 10 and len(body) > 300:
        label = 1
    else:
        # If the community downvotes it heavily or ignores it, or it's short
        if downvotes > upvotes or (upvotes < 2 and len(body) < 300):
            label = 0
        else:
            # Medium quality - we'll randomly classify based on upvotes to add noise
            # but ideally if upvotes > 5 and it's decent length, call it 1
            if upvotes > 5 and len(body) > 400:
                label = 1
            else:
                label = 0

    rows.append([body, upvotes, downvotes, label])

# Balance the dataset slightly if it's too skewed
high_quality = [r for r in rows if r[3] == 1]
low_quality = [r for r in rows if r[3] == 0]

print(f"Total collected: {len(rows)} (High Quality: {len(high_quality)}, Low Quality: {len(low_quality)})")

# Let's limit low_quality to max 2x the high quality to avoid huge imbalance
if len(low_quality) > len(high_quality) * 2 and len(high_quality) > 0:
    random.shuffle(low_quality)
    low_quality = low_quality[:len(high_quality) * 3]
    
final_rows = high_quality + low_quality
random.shuffle(final_rows)

with open("dataset.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["post_body", "upvotes", "downvotes", "score_label"])
    writer.writerows(final_rows)

print(f"Saved {len(final_rows)} rows to dataset.csv")
