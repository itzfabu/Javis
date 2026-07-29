from flask import Flask, request, jsonify, send_from_directory
import subprocess, os, time, json, socket, threading, uuid

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

def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0

if __name__ == "__main__":
    if port_in_use(8420):
        print("Port 8420 is already in use. Stop the other instance first.")
    else:
        app.run(host="127.0.0.1", port=8420)
