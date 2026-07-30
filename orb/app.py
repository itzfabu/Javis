from flask import Flask, request, jsonify, send_from_directory
import subprocess, os, time, json, socket, threading, uuid, re
from datetime import datetime, timezone

app = Flask(__name__, static_folder=".", static_url_path="")
TASKS_PATH = r"C:\Jarvis\TASKS.md"
STATUS_PATH = r"C:\Jarvis\orb\status.json"
SESSION_STATE_PATH = r"C:\Jarvis\orb\session_state.json"
SECRET_TOKEN = "bfee9c861c8a6a792a579f613b8bda86a3a6ac9fb5513d78"

# Resuming the same Claude session forever means every message reloads the
# whole accumulated transcript. CLAUDE.md, knowledge/*.md, the vault, and the
# auto-memory files are all re-read fresh on every subprocess call regardless
# of session id, so continuity survives a rotation - only the raw back-and-forth
# transcript gets dropped, which is exactly what was making this expensive.
ROTATE_AFTER_TURNS = 20

def get_session_state():
    if os.path.exists(SESSION_STATE_PATH):
        try:
            with open(SESSION_STATE_PATH, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"session_id": str(uuid.uuid4()), "turns": 0}

def save_session_state(state):
    with open(SESSION_STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f)

def load_env_file():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())

load_env_file()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
FALLBACK_KEYWORDS = ("usage limit", "rate limit", "429", "quota", "overloaded")

def get_open_tasks():
    tasks = []
    if os.path.exists(TASKS_PATH):
        with open(TASKS_PATH, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("- [ ]"):
                    tasks.append(line[5:].strip())
    return tasks

def write_status(status, message, tasks, token, source="claude"):
    with open(STATUS_PATH, "w", encoding="utf-8") as f:
        json.dump({"status": status, "lastMessage": message, "tasks": tasks, "audioToken": token, "source": source}, f)

def run_claude(message):
    state = get_session_state()
    fresh = state["turns"] == 0
    if fresh:
        cmd = ["cmd", "/c", "claude", "-p", message, "--permission-mode", "acceptEdits", "--session-id", state["session_id"]]
    else:
        cmd = ["cmd", "/c", "claude", "-p", message, "--permission-mode", "acceptEdits", "--resume", state["session_id"]]
    result = subprocess.run(cmd, cwd=r"C:\Jarvis", capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600)
    combined = ((result.stdout or "") + "\n" + (result.stderr or "")).lower()
    needs_fallback = result.returncode != 0 or any(kw in combined for kw in FALLBACK_KEYWORDS)
    if needs_fallback:
        reason = (result.stderr.strip() or result.stdout.strip() or "unknown error")[:300]
        return None, reason
    state["turns"] += 1
    if state["turns"] >= ROTATE_AFTER_TURNS:
        state = {"session_id": str(uuid.uuid4()), "turns": 0}
    save_session_state(state)
    return result.stdout.strip() or "Sorry, I could not process that.", None

def call_openai_fallback(message):
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set")
    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": message}]},
            timeout=60,
        )
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"OpenAI fallback failed: {e}")
    return resp.json()["choices"][0]["message"]["content"].strip()

def background_backup():
    try:
        subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-File", r"C:\Jarvis\.claude\hooks\git-backup.ps1"],
            timeout=60
        )
    except Exception:
        pass

@app.before_request
def check_origin():
    if request.path == "/chat":
        origin = request.headers.get("Origin", "")
        if origin and not origin.startswith("http://localhost:8420") and not origin.startswith("http://127.0.0.1:8420"):
            return jsonify({"error": "forbidden"}), 403

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/chat", methods=["POST"])
def chat():
    token = request.headers.get("X-Jarvis-Token", "")
    if token != SECRET_TOKEN:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json()
    message = data.get("message", "")
    if not message:
        return jsonify({"error": "empty"}), 400

    tasks = get_open_tasks()
    write_status("thinking", "", tasks, None)

    try:
        reply, fail_reason = run_claude(message)
    except subprocess.TimeoutExpired:
        write_status("idle", "Sorry, that request timed out.", tasks, None)
        return jsonify({"error": "timeout"}), 504
    except Exception as e:
        write_status("idle", "Something went wrong: " + str(e), tasks, None)
        return jsonify({"error": str(e)}), 500

    source = "claude"
    if reply is None:
        print(f"[{time.strftime('%H:%M:%S')}] Claude CLI issue ({fail_reason}) -> using OpenAI fallback (via ChatGPT-Fallback)")
        source = "openai"
        try:
            reply = call_openai_fallback(message)
        except Exception as e:
            write_status("idle", "Something went wrong: " + str(e), tasks, None)
            return jsonify({"error": str(e)}), 500

    write_status("speaking", reply, tasks, None, source=source)

    audio_token = None
    try:
        txt_path = os.path.join(os.environ.get("TEMP", "."), "jarvis-response.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(reply)
        mp3_path = r"C:\Jarvis\orb\latest.mp3"
        subprocess.run(
            ["cmd", "/c", "edge-tts", "--voice", "en-GB-RyanNeural", "--rate=-2%", "--file", txt_path, "--write-media", mp3_path],
            timeout=30
        )
        audio_token = str(int(time.time() * 1000))
    except Exception:
        pass

    tasks = get_open_tasks()
    write_status("speaking" if audio_token else "idle", reply, tasks, audio_token, source=source)

    threading.Thread(target=background_backup, daemon=True).start()

    return jsonify({"reply": reply, "audioToken": audio_token, "tasks": tasks})

PROJECTS_MD_PATH = r"C:\Jarvis\knowledge\PROJECTS.md"
GOALS_MD_PATH = r"C:\Jarvis\knowledge\GOALS.md"
VAULT_PROJECTS_DIR = r"C:\Jarvis\vault\Projects"
VAULT_IDEAS_DIR = r"C:\Jarvis\vault\Ideas"
ENGINEERING_BOARD_PATH = r"C:\Jarvis\vault\Boards\Engineering.md"

def parse_projects_md():
    projects = []
    if not os.path.exists(PROJECTS_MD_PATH):
        return projects
    current = None
    with open(PROJECTS_MD_PATH, encoding="utf-8") as f:
        for raw in f:
            line = raw.rstrip("\n")
            m = re.match(r"^##\s+(.+)", line)
            if m:
                if current:
                    projects.append(current)
                name = m.group(1).strip()
                current = None if name == "Project Name" else {"name": name, "status": "unknown", "owner": "", "goal": "", "notes": ""}
                continue
            if current is None:
                continue
            m = re.match(r"^-\s*Status:\s*(.+)", line)
            if m:
                current["status"] = m.group(1).strip()
                continue
            m = re.match(r"^-\s*Owner agent:\s*(.+)", line)
            if m:
                current["owner"] = m.group(1).strip()
                continue
            m = re.match(r"^-\s*Goal:\s*(.+)", line)
            if m:
                current["goal"] = m.group(1).strip()
                continue
            m = re.match(r"^-\s*Notes:\s*(.+)", line)
            if m:
                current["notes"] = m.group(1).strip()
                continue
    if current:
        projects.append(current)
    return projects

def parse_vault_project_note(name):
    target = None
    exact = os.path.join(VAULT_PROJECTS_DIR, name + ".md")
    if os.path.exists(exact):
        target = exact
    elif os.path.isdir(VAULT_PROJECTS_DIR):
        for fn in os.listdir(VAULT_PROJECTS_DIR):
            if fn.lower() == (name + ".md").lower():
                target = os.path.join(VAULT_PROJECTS_DIR, fn)
                break
    if not target:
        return {
            "found": False,
            "updated": "",
            "tags": [],
            "relatedProjects": [],
            "openItems": [],
            "openItemsCount": 0,
        }

    with open(target, encoding="utf-8") as f:
        text = f.read()

    fm_date, fm_updated, fm_tags, fm_related = "", "", [], []
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            frontmatter = text[3:end]
            for fline in frontmatter.splitlines():
                s = fline.strip()
                if s.startswith("date:"):
                    fm_date = s.split(":", 1)[1].strip()
                elif s.startswith("updated:"):
                    fm_updated = s.split(":", 1)[1].strip()
                elif s.startswith("related-projects:"):
                    fm_related = re.findall(r"\[\[Projects/([^\]]+)\]\]", s.split(":", 1)[1])
            tags_match = re.search(r"tags:\s*\n((?:\s*-\s*.+\n)+)", frontmatter)
            if tags_match:
                fm_tags = [t.strip().lstrip("- ").strip() for t in tags_match.group(1).splitlines() if t.strip()]

    open_items = []
    m = re.search(r"##\s*Open Items.*?\n(.*?)(?=\n##\s|\Z)", text, re.S)
    if m:
        for iline in m.group(1).splitlines():
            s = iline.strip()
            if s.startswith("- "):
                open_items.append(s[2:].strip())

    return {
        "found": True,
        "updated": fm_updated or fm_date,
        "tags": fm_tags,
        "relatedProjects": fm_related,
        "openItems": open_items,
        "openItemsCount": len(open_items),
    }

def parse_engineering_board(project_names):
    """Returns (board, unowned): board maps known project name -> column -> items;
    unowned collects items whose [[wikilink]]s don't match any known project name."""
    board = {name: {"backlog": [], "sprint": [], "inProgress": [], "done": []} for name in project_names}
    unowned = {"backlog": [], "sprint": [], "inProgress": [], "done": []}
    if not os.path.exists(ENGINEERING_BOARD_PATH):
        return board, unowned
    with open(ENGINEERING_BOARD_PATH, encoding="utf-8") as f:
        text = f.read()

    col_patterns = [
        (re.compile(r"backlog", re.I), "backlog"),
        (re.compile(r"sprint", re.I), "sprint"),
        (re.compile(r"in progress", re.I), "inProgress"),
        (re.compile(r"done", re.I), "done"),
    ]
    name_lower_map = {n.lower(): n for n in project_names}

    sections = re.split(r"\n##\s+", text)
    for sec in sections[1:]:
        header, _, body = sec.partition("\n")
        col_id = None
        for pattern, cid in col_patterns:
            if pattern.search(header):
                col_id = cid
                break
        if not col_id:
            continue
        lines = body.splitlines()
        i = 0
        while i < len(lines):
            m = re.match(r"^-\s*\[( |x)\]\s*(.*)", lines[i])
            if not m:
                i += 1
                continue
            raw_title = m.group(2)
            cancelled = "\u274c" in raw_title or "cancelled" in raw_title.lower()
            title_match = re.search(r"\*\*(.+?)\*\*", raw_title)
            title = title_match.group(1) if title_match else re.sub(r"[~*]", "", raw_title).strip()
            j = i + 1
            links_text = ""
            while j < len(lines) and lines[j].strip() and not re.match(r"^-\s*\[", lines[j]):
                links_text += lines[j] + " "
                j += 1
            matched_any = False
            for link in re.findall(r"\[\[([^\]]+)\]\]", links_text):
                link_name = link.split("/")[-1]
                if link_name.lower() in name_lower_map:
                    real_name = name_lower_map[link_name.lower()]
                    board[real_name][col_id].append({"title": title, "cancelled": cancelled})
                    matched_any = True
            if not matched_any:
                unowned[col_id].append({"title": title, "cancelled": cancelled})
            i = j
    return board, unowned

def parse_tasks_md():
    result = {"active": [], "done": [], "cancelled": [], "warnings": []}
    if not os.path.exists(TASKS_PATH):
        return result
    section = None
    with open(TASKS_PATH, encoding="utf-8") as f:
        lines = f.readlines()
    for idx, raw_line in enumerate(lines):
        line = raw_line.rstrip("\n")
        h = re.match(r"^##\s+(Active|Done)", line)
        if h:
            section = h.group(1).lower()
            continue
        if section is None:
            continue
        if not line.strip():
            continue
        if line.startswith(" ") or line.startswith("\t"):
            continue  # indented continuation/sub-note, not a task
        if line.strip().startswith("("):
            continue  # instructional aside like "(move completed tasks here...)"
        m = re.match(r"^-\s*\[( |x)\]\s*(.*)$", line)
        if not m:
            if re.search(r"\\-|\\\[|\\\]", line):
                warn_text = line if len(line) <= 120 else line[:117] + "..."
                result["warnings"].append(f"TASKS.md line {idx+1} looks like a malformed task (escaped markdown) and was not parsed: '{warn_text}'")
            continue
        checked = m.group(1) == "x"
        body = m.group(2)
        cancelled_marker = ("\u274c" in body) or ("cancelled:" in body.lower())
        text = body.replace("\u274c", "").strip()
        text = text.split("|", 1)[0].strip()
        priority_m = re.search(r"priority:\s*(\w+)", body, re.I)
        due_m = re.search(r"due:\s*([\d-]+)", body, re.I)
        cancelled_date_m = re.search(r"cancelled:\s*([\d-]+)", body, re.I)
        projects = re.findall(r"#([\w-]+)", body)
        entry = {
            "text": text,
            "priority": priority_m.group(1).lower() if priority_m else None,
            "due": due_m.group(1) if due_m else None,
            "projects": projects,
        }
        if section == "active":
            entry["status"] = "active"
            result["active"].append(entry)
        else:
            if checked and not cancelled_marker:
                entry["status"] = "done"
                result["done"].append(entry)
            else:
                entry["status"] = "cancelled"
                entry["cancelledDate"] = cancelled_date_m.group(1) if cancelled_date_m else None
                result["cancelled"].append(entry)
    return result

def parse_goals_md():
    goals = []
    if not os.path.exists(GOALS_MD_PATH):
        return goals
    current = None
    with open(GOALS_MD_PATH, encoding="utf-8") as f:
        for raw in f:
            line = raw.rstrip("\n")
            m = re.match(r"^##\s+(.+)", line)
            if m:
                if current:
                    goals.append(current)
                name = m.group(1).strip()
                current = None if name == "Goal Name" else {"name": name, "timeframe": "", "status": "unknown"}
                continue
            if current is None:
                continue
            m = re.match(r"^-\s*Timeframe:\s*(.+)", line)
            if m:
                current["timeframe"] = m.group(1).strip()
                continue
            m = re.match(r"^-\s*Status:\s*(.+)", line)
            if m:
                current["status"] = m.group(1).strip()
                continue
    if current:
        goals.append(current)
    return goals

def parse_ideas():
    ideas = []
    if not os.path.isdir(VAULT_IDEAS_DIR):
        return ideas
    for fn in sorted(os.listdir(VAULT_IDEAS_DIR)):
        if not fn.lower().endswith(".md"):
            continue
        path = os.path.join(VAULT_IDEAS_DIR, fn)
        with open(path, encoding="utf-8") as f:
            text = f.read()
        title = fn[:-3]
        fm_date, fm_updated, fm_status = "", "", ""
        if text.startswith("---"):
            end = text.find("\n---", 3)
            if end != -1:
                frontmatter = text[3:end]
                for fline in frontmatter.splitlines():
                    s = fline.strip()
                    if s.startswith("date:"):
                        fm_date = s.split(":", 1)[1].strip()
                    elif s.startswith("updated:"):
                        fm_updated = s.split(":", 1)[1].strip()
                    elif s.startswith("status:"):
                        fm_status = s.split(":", 1)[1].strip()
        summary = ""
        m = re.search(r"##\s*For future Claude\s*\n(.*?)(?=\n##\s|\Z)", text, re.S)
        if not m:
            m = re.search(r"##\s*Overview\s*\n(.*?)(?=\n##\s|\Z)", text, re.S)
        if m:
            paragraph = m.group(1).strip()
            summary = re.sub(r"\s+", " ", paragraph)[:280]
        ideas.append({
            "title": title,
            "updated": fm_updated or fm_date,
            "status": fm_status,
            "summary": summary,
        })
    return ideas

@app.route("/projects-dashboard.json")
def projects_dashboard():
    projects = parse_projects_md()
    names = [p["name"] for p in projects]
    board, _ = parse_engineering_board(names)
    for p in projects:
        p["vault"] = parse_vault_project_note(p["name"])
        b = board.get(p["name"], {"backlog": [], "sprint": [], "inProgress": [], "done": []})
        done_count = sum(1 for it in b["done"] if not it["cancelled"])
        cancelled_count = sum(1 for it in b["done"] if it["cancelled"])
        p["board"] = {
            "backlog": len(b["backlog"]),
            "sprint": len(b["sprint"]),
            "inProgress": len(b["inProgress"]),
            "done": done_count,
            "cancelled": cancelled_count,
            "items": b,
        }
    return jsonify({"projects": projects, "generatedAt": datetime.now(timezone.utc).isoformat()})

@app.route("/background-dashboard.json")
def background_dashboard():
    tasks = parse_tasks_md()
    goals = parse_goals_md()
    projects = parse_projects_md()
    for g in goals:
        g["linkedProjects"] = [p["name"] for p in projects if p.get("goal", "").lower().startswith(g["name"].lower())]
    ideas = parse_ideas()
    names = [p["name"] for p in projects]
    _, unowned = parse_engineering_board(names)
    return jsonify({
        "tasks": tasks,
        "goals": goals,
        "ideas": ideas,
        "unownedBoardItems": unowned,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    })

GENERATED_SITES_DIR = r"C:\Jarvis\generated-sites"
GENERATION_JOBS = {}
GENERATION_JOBS_LOCK = threading.Lock()

def slugify(name):
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "site"

def unique_slug(base_slug):
    candidate = base_slug
    counter = 2
    while os.path.isdir(os.path.join(GENERATED_SITES_DIR, candidate)):
        candidate = f"{base_slug}-{counter}"
        counter += 1
    return candidate

def build_generation_prompt(business_name, description, reviews, output_dir):
    reviews_block = "\n".join(f"- {r}" for r in reviews) if reviews else "(no reviews provided)"
    return f"""Generate a single-page marketing landing site for this business, as real static files written to this exact folder: {output_dir}\\index.html, {output_dir}\\styles.css, {output_dir}\\script.js

Business name: {business_name}
What the site should say / who it's for: {description}

Customer reviews to use as trust signals (paraphrase or quote naturally, do not fabricate additional ones):
{reviews_block}

Hard requirements (non-negotiable, based on conversion-rate research):
- Above the fold: a clear, plain-language headline that answers "what's in it for me" within seconds - no clever/cryptic copy. Exactly ONE call-to-action button, visually dominant, with no competing links or navigation distracting from it.
- Above-the-fold content must be lightweight and render instantly - no video, no heavy animation libraries, no large blocking assets in the initial view.
- Any motion, scroll effects, or richer visual flourishes belong further down the page (e.g. a subtle scroll-reveal on the services/testimonials sections), never on the critical path to the first impression or the CTA.
- Include a trust-signals section using the reviews above (as testimonials with attribution if given).
- If there is any contact/signup form, keep it to the minimum fields possible (e.g. name + email, or name + message) - do not ask for more than necessary.
- Load speed is a hard requirement: no external JS frameworks or CDN dependencies. Vanilla JS only in script.js. Fonts are the one exception - link Google Fonts via a <link> tag in the <head> rather than bundling font files.
- Do not reference or create any image files - there is no assets/ content yet. Use CSS (gradients, shapes, color, typography) for visual interest instead of images.
- Repeat the single CTA at least once more further down the page (e.g. near the footer), but it must remain the same action worded consistently.

Write exactly those three files to the exact absolute paths given above. Do not create any other files or folders, and do not write anywhere else."""

def run_generation_job(job_id, business_name, description, reviews, slug, output_dir, client_contact, price, license_type):
    with GENERATION_JOBS_LOCK:
        GENERATION_JOBS[job_id]["status"] = "running"
    prompt = build_generation_prompt(business_name, description, reviews, output_dir)
    try:
        result = subprocess.run(
            ["cmd", "/c", "claude", "-p", prompt, "--permission-mode", "acceptEdits"],
            cwd=r"C:\Jarvis", capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600
        )
        expected = ["index.html", "styles.css", "script.js"]
        missing = [fn for fn in expected if not os.path.exists(os.path.join(output_dir, fn))]
        if result.returncode != 0 or missing:
            reason = (result.stderr.strip() or result.stdout.strip() or "unknown error")[:500]
            if missing:
                reason += f" | missing files: {missing}"
            with GENERATION_JOBS_LOCK:
                GENERATION_JOBS[job_id]["status"] = "error"
                GENERATION_JOBS[job_id]["error"] = reason
            return

        meta = {
            "business_name": business_name,
            "slug": slug,
            "prompt_used": description,
            "reviews_used": reviews,
            "created_date": datetime.now(timezone.utc).isoformat(),
            "status": "draft",
            "client_contact": client_contact or "",
            "price": price,
            "license_type": license_type or "",
        }
        with open(os.path.join(output_dir, "meta.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

        with GENERATION_JOBS_LOCK:
            GENERATION_JOBS[job_id]["status"] = "done"
            GENERATION_JOBS[job_id]["output_dir"] = output_dir
    except subprocess.TimeoutExpired:
        with GENERATION_JOBS_LOCK:
            GENERATION_JOBS[job_id]["status"] = "error"
            GENERATION_JOBS[job_id]["error"] = "generation timed out"
    except Exception as e:
        with GENERATION_JOBS_LOCK:
            GENERATION_JOBS[job_id]["status"] = "error"
            GENERATION_JOBS[job_id]["error"] = str(e)

@app.route("/generate-website", methods=["POST"])
def generate_website():
    token = request.headers.get("X-Jarvis-Token", "")
    if token != SECRET_TOKEN:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    business_name = (data.get("business_name") or "").strip()
    description = (data.get("prompt") or "").strip()
    reviews = data.get("reviews") or []
    client_contact = data.get("client_contact")
    price = data.get("price")
    license_type = data.get("license_type")

    if not business_name or not description:
        return jsonify({"error": "business_name and prompt are required"}), 400

    os.makedirs(GENERATED_SITES_DIR, exist_ok=True)
    slug = unique_slug(slugify(business_name))
    output_dir = os.path.join(GENERATED_SITES_DIR, slug)
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.join(output_dir, "assets"), exist_ok=True)

    job_id = str(uuid.uuid4())
    with GENERATION_JOBS_LOCK:
        GENERATION_JOBS[job_id] = {"status": "queued", "slug": slug, "business_name": business_name}

    threading.Thread(
        target=run_generation_job,
        args=(job_id, business_name, description, reviews, slug, output_dir, client_contact, price, license_type),
        daemon=True,
    ).start()

    return jsonify({"job_id": job_id, "slug": slug, "status": "queued"})

@app.route("/generate-website/status/<job_id>")
def generate_website_status(job_id):
    with GENERATION_JOBS_LOCK:
        job = GENERATION_JOBS.get(job_id)
    if not job:
        return jsonify({"error": "not_found"}), 404
    return jsonify(job)

def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0

if __name__ == "__main__":
    if port_in_use(8420):
        print("Port 8420 is already in use. Stop the other instance first.")
    else:
        app.run(host="127.0.0.1", port=8420)
