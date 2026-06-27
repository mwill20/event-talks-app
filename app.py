import os
import re
import time
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request, session

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Cache setup
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
feed_cache = {
    "data": None,
    "last_fetched": 0,
    "cache_duration": 3600  # 1 hour
}

def clean_html_tags(html_str):
    """Strip HTML tags and normalize whitespace."""
    if not html_str:
        return ""
    # Simple regex to strip HTML tags
    clean = re.compile('<.*?>')
    text = re.sub(clean, '', html_str)
    # Replace multiple spaces/newlines with single ones
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_sub_items(html, date, base_link):
    """Parse raw entry HTML by splitting on <h3> tags to isolate specific updates."""
    # Find all <h3>Tags</h3>
    pattern = re.compile(r'<h3>(.*?)</h3>', re.IGNORECASE)
    matches = list(pattern.finditer(html))
    
    if not matches:
        # If there are no <h3> tags, treat the whole content as one general update
        text_content = clean_html_tags(html)
        return [{
            "id": f"gen-{hash(html) & 0xffffffff}",
            "type": "General",
            "html": html,
            "text": text_content,
            "date": date,
            "link": base_link
        }]
        
    sub_items = []
    for i, match in enumerate(matches):
        item_type = match.group(1).strip()
        start = match.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(html)
        item_html = html[start:end].strip()
        
        # Strip outer paragraphs or clean tags
        text_content = clean_html_tags(item_html)
        
        # Generate a unique sub-item ID
        item_id = f"item-{hash(date + item_type + text_content[:20]) & 0xffffffff}"
        
        sub_items.append({
            "id": item_id,
            "type": item_type,
            "html": item_html,
            "text": text_content,
            "date": date,
            "link": base_link
        })
    return sub_items

def fetch_and_parse_feed(force_refresh=False):
    """Fetch the RSS/Atom feed from Google Cloud and parse it."""
    current_time = time.time()
    
    # Check cache
    if not force_refresh and feed_cache["data"] and (current_time - feed_cache["last_fetched"] < feed_cache["cache_duration"]):
        return feed_cache["data"], False
        
    try:
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        xml_text = response.text
        
        # Register namespaces to prevent namespace prefixes in output
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(xml_text)
        
        parsed_entries = []
        for entry in root.findall('atom:entry', ns):
            title_elem = entry.find('atom:title', ns)
            title = title_elem.text if title_elem is not None else "Unknown Date"
            
            updated_elem = entry.find('atom:updated', ns)
            updated = updated_elem.text if updated_elem is not None else ""
            
            id_elem = entry.find('atom:id', ns)
            id_val = id_elem.text if id_elem is not None else ""
            
            # Extract link
            link = ""
            link_elem = entry.find("atom:link[@rel='alternate']", ns)
            if link_elem is not None:
                link = link_elem.attrib.get('href', '')
            else:
                link_elem = entry.find("atom:link", ns)
                if link_elem is not None:
                    link = link_elem.attrib.get('href', '')
                    
            content_elem = entry.find('atom:content', ns)
            content_html = content_elem.text if content_elem is not None else ""
            
            # Parse sub-items
            sub_items = parse_sub_items(content_html, title, link)
            
            parsed_entries.append({
                "date": title,
                "updated": updated,
                "id": id_val,
                "link": link,
                "sub_items": sub_items
            })
            
        feed_cache["data"] = parsed_entries
        feed_cache["last_fetched"] = current_time
        return parsed_entries, True
        
    except Exception as e:
        # If fetch fails but we have cached data, return cache as backup
        if feed_cache["data"]:
            return feed_cache["data"], False
        raise e

def generate_local_post(date, item_type, text, tone, include_hashtags, include_emojis, include_link, link):
    """Generate a LinkedIn post locally using templates and heuristics."""
    summary = text.strip()
    
    # Custom tags based on content analysis
    tags = ["#BigQuery", "#GoogleCloud", "#DataAnalytics", "#CloudComputing", "#DataEngineering"]
    text_lower = text.lower()
    if any(k in text_lower for k in ["vector", "search", "ai", "ml", "embedding"]):
        tags.extend(["#AI", "#VectorSearch", "#MachineLearning", "#GenAI"])
    if any(k in text_lower for k in ["secure", "iam", "encrypt", "key", "access"]):
        tags.extend(["#CloudSecurity", "#DataSecurity"])
    if any(k in text_lower for k in ["performance", "speed", "fast", "partition", "cluster"]):
        tags.extend(["#DataOps", "#Performance"])
    if any(k in text_lower for k in ["cost", "price", "billing"]):
        tags.extend(["#FinOps", "#CloudCost"])
        
    hashtag_str = " ".join(tags[:4])
    link_to_share = link if link else "https://cloud.google.com/bigquery/docs/release-notes"
    
    # Bullet points format
    bullet_point = "•"
    if include_emojis:
        bullet_point = "⚡" if tone == "Excited" else "🔹"

    # Tone templates
    if tone == "Professional":
        intro = "📢 Google Cloud BigQuery Release Update" if include_emojis else "Google Cloud BigQuery Release Update"
        post = (
            f"{intro}\n\n"
            f"A new {item_type.lower()} update has been rolled out for BigQuery (Release Date: {date}).\n\n"
            f"{bullet_point} Details:\n"
            f"{summary}\n\n"
            f"This update is valuable for data teams seeking to leverage Google Cloud's latest data warehousing capabilities. "
            f"How does this update impact your current workflows?"
        )
    elif tone == "Excited":
        intro = "🚀 Big news for BigQuery and GCP builders!" if include_emojis else "Big news for BigQuery and GCP builders!"
        post = (
            f"{intro}\n\n"
            f"Google Cloud has just announced a major {item_type.lower()} update! \n\n"
            f"{bullet_point} Release Highlights:\n"
            f"{summary}\n\n"
            f"I'm really excited to see how this enhances performance and unlocks new workflows for analytics engineering. "
            f"Time to try it out!"
        )
    elif tone == "Tech-Evangelist":
        intro = "💡 Deep Dive: Google Cloud BigQuery Updates" if include_emojis else "Deep Dive: Google Cloud BigQuery Updates"
        post = (
            f"{intro}\n\n"
            f"Let's break down the latest {item_type.lower()} release in BigQuery ({date}):\n\n"
            f"🔍 The Update:\n"
            f"{summary}\n\n"
            f"⚙️ Architectural Impact:\n"
            f"Constant upgrades like this are why serverless cloud data lakes are transforming data-driven organizations. "
            f"By offloading operational overhead, teams can focus entirely on value generation. "
            f"What's your take on this release?"
        )
    elif tone == "Short & Punchy":
        intro = "🔥 New in BigQuery" if include_emojis else "New in BigQuery"
        post = (
            f"{intro} ({date}):\n\n"
            f"Type: {item_type}\n"
            f"{summary}"
        )
    else:
        post = f"BigQuery Update ({date}) - {item_type}:\n\n{summary}"

    # Add Link & Hashtags
    sections = [post]
    if include_link:
        link_icon = "🔗 " if include_emojis else ""
        sections.append(f"{link_icon}Read the official notes: {link_to_share}")
    if include_hashtags:
        sections.append(hashtag_str)
        
    return "\n\n".join(sections)

def generate_gemini_post(api_key, date, item_type, text, tone, include_hashtags, include_emojis, include_link, link):
    """Generate LinkedIn post using Google's Gemini API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}
    
    prompt = f"""
Write a highly engaging and professional LinkedIn post about the following Google Cloud BigQuery release note.

Release Note Details:
- Release Date: {date}
- Update Type: {item_type}
- Text Content: {text}

Requirements:
1. Tone/Style: {tone} (Choices: 'Professional' - structured and informative; 'Excited' - high energy with call-to-actions; 'Tech-Evangelist' - educational and architectural; 'Short & Punchy' - direct and concise).
2. Emojis: {"Yes, use relevant emojis at the beginning of bullet points and key sentences" if include_emojis else "Do not use emojis at all"}.
3. Hashtags: {"Yes, add 3-5 highly relevant professional hashtags at the very bottom" if include_hashtags else "Do not include any hashtags"}.
4. Link: {"Include this link at the end: " + link if include_link else "Do not mention or include any links"}.
5. Return ONLY the text of the LinkedIn post. Do not include markdown blockquote syntax (e.g. do not wrap in >), code blocks, or preamble comments like "Here is your post:".
"""

    data = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    response = requests.post(url, headers=headers, json=data, timeout=20)
    response.raise_for_status()
    res_json = response.json()
    
    # Extract response text
    try:
        generated_text = res_json['candidates'][0]['content']['parts'][0]['text']
        return generated_text.strip()
    except (KeyError, IndexError) as e:
        raise ValueError("Invalid response structure from Gemini API")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/feed', methods=['GET'])
def get_feed():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        entries, refreshed = fetch_and_parse_feed(force_refresh)
        return jsonify({
            "success": True,
            "refreshed": refreshed,
            "last_fetched": feed_cache["last_fetched"],
            "entries": entries
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/generate-post', methods=['POST'])
def generate_post():
    data = request.json or {}
    
    date = data.get('date', '')
    item_type = data.get('type', 'General')
    text = data.get('text', '')
    link = data.get('link', '')
    
    # Generation settings
    tone = data.get('tone', 'Professional')
    include_hashtags = data.get('include_hashtags', True)
    include_emojis = data.get('include_emojis', True)
    include_link = data.get('include_link', True)
    custom_link = data.get('custom_link', '')
    
    api_key = data.get('api_key', '') # Passed securely from client localStorage
    
    link_to_use = custom_link if custom_link else link
    
    try:
        if api_key:
            # Generate with real Gemini
            post_content = generate_gemini_post(
                api_key=api_key,
                date=date,
                item_type=item_type,
                text=text,
                tone=tone,
                include_hashtags=include_hashtags,
                include_emojis=include_emojis,
                include_link=include_link,
                link=link_to_use
            )
            is_ai = True
        else:
            # Fallback to local heuristic engine
            post_content = generate_local_post(
                date=date,
                item_type=item_type,
                text=text,
                tone=tone,
                include_hashtags=include_hashtags,
                include_emojis=include_emojis,
                include_link=include_link,
                link=link_to_use
            )
            is_ai = False
            
        return jsonify({
            "success": True,
            "post": post_content,
            "is_ai": is_ai
        })
    except Exception as e:
        # If Gemini fails, fallback to local template and return a warning
        try:
            fallback_content = generate_local_post(
                date=date,
                item_type=item_type,
                text=text,
                tone=tone,
                include_hashtags=include_hashtags,
                include_emojis=include_emojis,
                include_link=include_link,
                link=link_to_use
            )
            return jsonify({
                "success": True,
                "post": fallback_content,
                "is_ai": False,
                "warning": f"Gemini API error: {str(e)}. Fell back to local generator."
            })
        except Exception as fallback_err:
            return jsonify({
                "success": False,
                "error": f"Failed to generate post: {str(fallback_err)}"
            }), 500

if __name__ == '__main__':
    # Running on port 5000 by default
    app.run(debug=True, port=5000)
