import os
import time
import psycopg2
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_HOST = os.getenv("DB_HOST", "db")
DB_NAME = os.getenv("DB_NAME", "corps_squad")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_PORT = os.getenv("DB_PORT", "5432")


def get_conn():
    return psycopg2.connect(
        host=DB_HOST,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )


def wait_for_db():
    for _ in range(30):
        try:
            conn = get_conn()
            conn.close()
            return
        except Exception:
            time.sleep(2)
    raise RuntimeError("Database not ready")


def is_admin(req):
    return req.headers.get("X-Role", "") == "admin"


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "missing JSON body"}), 400

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "missing username or password"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT username, role FROM users WHERE username = %s AND password = %s",
        (username, password)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({"error": "invalid credentials"}), 401

    return jsonify({
        "message": "login successful",
        "username": user[0],
        "role": user[1]
    }), 200

@app.route("/events", methods=["GET"])
def get_events():
    team = request.args.get("team")
    sport = request.args.get("sport")

    query = """
        SELECT id, team, sport, date, time, at, opponent, location, incentive
        FROM events
    """
    conditions = []
    params = []

    if team:
        conditions.append("team ILIKE %s")
        params.append(team)
    if sport:
        conditions.append("sport ILIKE %s")
        params.append(sport)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY date, time;"

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    events = []
    for row in rows:
        events.append({
            "id": row[0],
            "team": row[1],
            "sport": row[2],
            "date": str(row[3]),
            "time": str(row[4]),
            "at": row[5],
            "opponent": row[6],
            "location": row[7],
            "incentive": row[8]
        })

    return jsonify(events), 200


@app.route("/events", methods=["POST"])
def create_event():
    if not is_admin(request):
        return jsonify({"error": "forbidden"}), 403

    data = request.get_json()

    required = ["team", "sport", "date", "time", "at", "opponent", "location"]
    for field in required:
        if field not in data or not data[field]:
            return jsonify({"error": f"missing field: {field}"}), 400

    if data["at"] not in ["Home", "Away", "Neutral"]:
        return jsonify({"error": "invalid value for 'at'"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO events (team, sport, date, time, at, opponent, location, incentive)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
    """, (
        data["team"],
        data["sport"],
        data["date"],
        data["time"],
        data["at"],
        data["opponent"],
        data["location"],
        data.get("incentive")
    ))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "event created", "id": new_id}), 201


@app.route("/events/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    if not is_admin(request):
        return jsonify({"error": "forbidden"}), 403

    data = request.get_json()

    required = ["team", "sport", "date", "time", "at", "opponent", "location"]
    for field in required:
        if field not in data or not data[field]:
            return jsonify({"error": f"missing field: {field}"}), 400

    if data["at"] not in ["Home", "Away", "Neutral"]:
        return jsonify({"error": "invalid value for 'at'"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        UPDATE events
        SET team=%s, sport=%s, date=%s, time=%s, at=%s, opponent=%s, location=%s, incentive=%s
        WHERE id=%s
    """, (
        data["team"],
        data["sport"],
        data["date"],
        data["time"],
        data["at"],
        data["opponent"],
        data["location"],
        data.get("incentive"),
        event_id
    ))

    if cur.rowcount == 0:
        cur.close()
        conn.close()
        return jsonify({"error": "event not found"}), 404

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "event updated"}), 200


@app.route("/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    if not is_admin(request):
        return jsonify({"error": "forbidden"}), 403

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM events WHERE id = %s", (event_id,))

    if cur.rowcount == 0:
        cur.close()
        conn.close()
        return jsonify({"error": "event not found"}), 404

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "event deleted"}), 200


if __name__ == "__main__":
    wait_for_db()
    app.run(host="0.0.0.0", port=5000)