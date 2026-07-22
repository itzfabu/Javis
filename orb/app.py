from flask import Flask, request, jsonify, send_from_directory
import subprocess, os, time, json, socket

app = Flask(__name__, static_folder=".", static_url_path="")
TASKS_PATH = r"C:\Jarvis\TASKS.md"
STATUS_PATH = r"C:\Jarvis\orb\status.json"
HISTORY_PATH = r"C:\Jarvis\orb\history.json"
SESSION_MARKER = r"C:\Jarvis\orb\webchat_session_created.flag"
WEBCHAT_SESSION_ID = "8f14e45f-ceea-467e-9575-5c3c4a5c6f2b"
SECRET_TOKEN = "bfee9c861c8a6a792a579f613b8bda86a3a6ac9fb5513d78"

def get_open_tasks():
    tasks = []
    if os.path.exists(TASKS_PATH):
        with open(TASKS_PATH, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("- [ ]"):
                    tasks.append(line[5:].strip())
    return tasks

def write_status(status, message, tasks, token):
    with open(STATUS_PATH, "w", encoding="utf-8") as f:
        json.dump({"status": status, "lastMessage": message, "tasks": tasks, "audioToken": token}, f)

def add_history(text):
    history = []
    if os.path.exists(HISTORY_PATH):
        try:
            with open(HISTORY_PATH, encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            history = []
    short = text if len(text) <= 80 else text[:80] + "..."
    history.append({"time": time.strftime("%H:%M"), "text": short})
    history = history[-10:]
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f)

def run_claude(message):
    if os.path.exists(SESSION_MARKER):
        cmd = ["cmd", "/c", "claude", "-p", message, "--permission-mode", "acceptEdits", "--resume", WEBCHAT_SESSION_ID]
    else:
        cmd = ["cmd", "/c", "claude", "-p", message, "--permission-mode", "acceptEdits", "--session-id", WEBCHAT_SESSION_ID]
    result = subprocess.run(cmd, cwd=r"C:\Jarvis", capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    if result.returncode != 0 and result.stderr.strip():
        raise RuntimeError(result.stderr.strip()[:300])
    if not os.path.exists(SESSION_MARKER):
        with open(SESSION_MARKER, "w") as f:
            f.write("created")
    return result.stdout.strip() or "Sorry, I could not process that."

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
        reply = run_claude(message)
    except subprocess.TimeoutExpired:
        write_status("idle", "Sorry, that request timed out.", tasks, None)
        return jsonify({"error": "timeout"}), 504
    except Exception as e:
        write_status("idle", "Something went wrong: " + str(e), tasks, None)
        return jsonify({"error": str(e)}), 500

    add_history(reply)
    write_status("speaking", reply, tasks, None)

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
    write_status("speaking" if audio_token else "idle", reply, tasks, audio_token)

    return jsonify({"reply": reply, "audioToken": audio_token, "tasks": tasks})

def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0

if __name__ == "__main__":
    if port_in_use(8420):
        print("Port 8420 is already in use. Stop the other instance first.")
    else:
        app.run(host="127.0.0.1", port=8420)
