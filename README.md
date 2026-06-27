# BigQuery Release Pulse 🚀

**BigQuery Release Pulse** is a modern dashboard that keeps you up-to-date with Google Cloud BigQuery release notes and assists you in drafting high-quality LinkedIn posts. 

Built using a **Python Flask** server and a **Vanilla HTML5/JS/CSS** client, the app slices daily updates into specific release items, filters them by type, and uses local rule templates or **Gemini AI** to write engaging professional drafts.

---

## ✨ Features

- 🔄 **Real-Time Atom Parsing & Caching**: Fetches directly from Google Cloud feeds. Uses server memory caching for 1 hour to ensure near-instant load speeds.
- 🧩 **Granular Update Slicing**: Slices daily release logs (such as features, deprecations, changes, and fixes) into individual cards, making it easy to share specific updates.
- 💼 **LinkedIn Preview Mockup**: A responsive card designed to look like the desktop dark-mode LinkedIn UI. Includes mock action buttons, character counters, and live inline editing.
- ⚡ **Dual Generation Engine**:
  - **Local Heuristics (Offline)**: Generates posts with context-aware hashtags, custom URLs, and emojis based on 4 distinct writing styles.
  - **Gemini AI (Advanced)**: Connects directly with the `gemini-1.5-flash` API for tailor-made posts.
- 🔒 **Privacy Guard**: Your Gemini API key is stored securely in your browser's local storage and is sent transiently with each generation request. It is never stored on the server.

---

## 📂 Project Structure

```
├── app.py                  # Core Flask server (APIs, feed parser, cache, LLM caller)
├── templates/
│   └── index.html          # Web dashboard layout and settings modal
├── static/
│   ├── css/
│   │   └── style.css       # Custom glassmorphic styling and animations
│   └── js/
│       └── app.js          # App state, search/filter algorithms, and UI logic
├── .gitignore              # Ignores venv, caches, and configuration files
└── README.md               # User documentation
```

---

## 🛠️ Setup & Running Locally

### Prerequisites
Make sure you have **Python 3.12+** installed on your system.

### 1. Set up a Virtual Environment
Initialize a clean Python virtual environment and activate it:

```bash
# Create venv
python -m venv .venv

# Activate venv (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate venv (macOS/Linux)
source .venv/bin/activate
```

### 2. Install Dependencies
Install Flask and the requests utility:
```bash
pip install flask requests
```

### 3. Launch the Server
Run the Flask application:
```bash
python app.py
```
By default, the server will launch in debug mode at:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📖 How to Use

1. **Browse updates**: Use the top pills to filter updates (Features, Changes, Deprecations, Fixes) or type keywords in the search bar.
2. **Select an item**: Click any card in the feed list to expand its HTML details on the right panel.
3. **Configure parameters**: Choose one of the 4 writing styles (Professional, Excited, Evangelist, Punchy) and toggle parameters (emojis, hashtags, custom link overrides).
4. **Generate & Edit**: Click **Generate Post Draft**. Once the draft is generated, toggle **Edit Draft** to write inline adjustments directly in the preview card.
5. **Copy**: Click **Copy to Clipboard** to copy the post.

---

## 🔑 Customizing AI Settings
Click the **Gear Icon** in the top-right corner to open the Settings modal. Here you can paste your Gemini API Key and customize your LinkedIn display details (Name and Title) to personalize the preview card.
