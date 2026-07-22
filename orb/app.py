from flask import Flask, request, jsonify, send_from_directory
import subprocess, os, time, json, socket

app = Flask(__name__, static_folder=".", static_url_path="")
TASKS_PATH = r"C:\Jarvis\TASKS.md"
STATUS_PATH = r"C:\Jarvis\orb\status.json"
SESSION_MARKER = r"C:\Jarvis\orb\webchat_session_created.flag"
WEBCHAT_SESSION_ID = "8f14e45f-ceea-467e-9575-5c3c4a5c6f2b"

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

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/chat", methods=["POST"])
def chat():
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

    write_status("speaking", reply, tasks, None)

    token = None
    try:
        txt_path = os.path.join(os.environ.get("TEMP", "."), "jarvis-response.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(reply)
        mp3_path = r"C:\Jarvis\orb\latest.mp3"
        subprocess.run(
            ["cmd", "/c", "edge-tts", "--voice", "en-GB-RyanNeural", "--rate=-2%", "--file", txt_path, "--write-media", mp3_path],
            timeout=30
        )
        token = str(int(time.time() * 1000))
    except Exception:
        pass

    tasks = get_open_tasks()
    write_status("speaking" if token else "idle", reply, tasks, token)

    return jsonify({"reply": reply, "audioToken": token, "tasks": tasks})

def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0

if __name__ == "__main__":
    if port_in_use(8420):
        print("Port 8420 is already in use by another process. Stop it first (check for a stray python.exe) before starting a new instance.")
    else:
        app.run(port=8420)
