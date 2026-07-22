from flask import Flask, request, jsonify, send_from_directory
import subprocess, os, time

app = Flask(__name__, static_folder=".", static_url_path="")
TASKS_PATH = r"C:\Jarvis\TASKS.md"

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

def get_open_tasks():
    tasks = []
    if os.path.exists(TASKS_PATH):
        with open(TASKS_PATH, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("- [ ]"):
                    tasks.append(line[5:].strip())
    return tasks

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")
    if not message:
        return jsonify({"error": "empty"}), 400

    result = subprocess.run(
        ["cmd", "/c", "claude", "-p", message, "--permission-mode", "acceptEdits"],
        cwd=r"C:\Jarvis", capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120
    )
    reply = result.stdout.strip() or "Sorry, I could not process that."

    txt_path = os.path.join(os.environ.get("TEMP", "."), "jarvis-response.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(reply)
    mp3_path = r"C:\Jarvis\orb\latest.mp3"
    subprocess.run(
        ["cmd", "/c", "edge-tts", "--voice", "en-GB-RyanNeural", "--rate=-2%", "--file", txt_path, "--write-media", mp3_path],
        timeout=60
    )

    return jsonify({"reply": reply, "audioToken": str(int(time.time() * 1000)), "tasks": get_open_tasks()})

if __name__ == "__main__":
    app.run(port=8420)
