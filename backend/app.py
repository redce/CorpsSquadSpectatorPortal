import os
import time
import re
import datetime
import jwt
import psycopg2
from flask import Flask, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_HOST = os.getenv("DB_HOST", "db")
DB_NAME = os.getenv("DB_NAME", "corps_squad")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_PORT = os.getenv("DB_PORT", "5432")

# JWT Secret Key (In production, load this securely from a .env file!)
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-west-point-key")

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

# NEW: CIA+ Authenticity Check
def is_admin(req):
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return False
    
    token = auth_header.split(" ")[1]
    try:
        # Cryptographically verifies the token wasn't tampered with
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded.get("role") == "admin"
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return False


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

# NEW: CIA+ Confidentiality (Hashed Passwords & JWT Issue)
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
    # Fetch the hashed password from the DB
    cur.execute(
        "SELECT username, role, password FROM users WHERE username = %s",
        (username,)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()

    # Verify the password against the stored hash securely
    if user and check_password_hash(user[2], password):
        # Generate a secure session token valid for 12 hours
        token = jwt.encode({
            "username": user[0],
            "role": user[1],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            "message": "login successful",
            "token": token,
            "username": user[0],
            "role": user[1]
        }), 200
    else:
        return jsonify({"error": "invalid credentials"}), 401

@app.route("/events", methods=["GET"])
def get_events():
    incentive = request.args.get("incentive")
    sport = request.args.get("sport")

    query = """
        SELECT id, team, sport, date, time, at, opponent, location, incentive
        FROM events
    """
    conditions = []
    params = []

    if incentive:
        conditions.append("incentive ILIKE %s")
        params.append(incentive)
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
            "id": row[0], "team": row[1], "sport": row[2],
            "date": str(row[3]), "time": str(row[4]), "at": row[5],
            "opponent": row[6], "location": row[7], "incentive": row[8]
        })

    return jsonify(events), 200

@app.route("/events", methods=["POST"])
def create_event():
    if not is_admin(request):
        return jsonify({"error": "forbidden - invalid or missing token"}), 403

    data = request.get_json()
    required = ["team", "sport", "date", "time", "at", "opponent", "location"]
    for field in required:
        if field not in data or not data[field]:
            return jsonify({"error": f"missing field: {field}"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO events (team, sport, date, time, at, opponent, location, incentive)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
    """, (data["team"], data["sport"], data["date"], data["time"], data["at"], data["opponent"], data["location"], data.get("incentive")))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "event created", "id": new_id}), 201

@app.route("/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    if not is_admin(request):
        return jsonify({"error": "forbidden - invalid or missing token"}), 403

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

# NEW: CIA+ Integrity (Backend Input Validation)
@app.route("/events/<int:event_id>/signup", methods=["POST", "DELETE"])
def handle_event_signup(event_id):
    if request.method == "POST":
        data = request.get_json()
        required = ["firstName", "lastName", "regiment", "company", "cNumber"]
        for field in required:
            if field not in data or not data[field]:
                return jsonify({"error": f"missing field: {field}"}), 400
        
        c_number = data.get("cNumber")
        # Ensure it is exactly C followed by 8 numbers
        if not re.match(r"^[Cc]\d{8}$", c_number):
            return jsonify({"error": "Invalid format. Must be a 'C' followed by exactly 8 digits."}), 400

        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute("""
                INSERT INTO event_registrations (event_id, first_name, last_name, regiment, company, c_number)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (event_id, data["firstName"], data["lastName"], data["regiment"], data["company"], c_number.upper()))
            new_id = cur.fetchone()[0]
            conn.commit()
            return jsonify({"message": "Successfully signed up", "id": new_id}), 201
        except psycopg2.IntegrityError:
            conn.rollback()
            return jsonify({"error": "Cadet is already signed up for this event."}), 409
        except Exception as e:
            conn.rollback()
            return jsonify({"error": "Database error occurred."}), 500
        finally:
            cur.close()
            conn.close()

    elif request.method == "DELETE":
        data = request.get_json()
        c_number = data.get("cNumber")
        
        if not c_number or not re.match(r"^[Cc]\d{8}$", c_number):
            return jsonify({"error": "Invalid or Missing C-Number"}), 400

        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute("""
                DELETE FROM event_registrations 
                WHERE event_id = %s AND c_number = %s;
            """, (event_id, c_number.upper()))
            if cur.rowcount == 0:
                return jsonify({"error": "No registration found matching that C-Number for this event."}), 404
            conn.commit()
            return jsonify({"message": "Successfully cancelled sign-up"}), 200
        except Exception as e:
            conn.rollback()
            return jsonify({"error": "Database error occurred."}), 500
        finally:
            cur.close()
            conn.close()

@app.route("/events/<int:event_id>/roster", methods=["GET"])
def get_event_roster(event_id):
    if not is_admin(request):
        return jsonify({"error": "forbidden - invalid or missing token"}), 403

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT first_name, last_name, regiment, company, c_number, registration_time
            FROM event_registrations
            WHERE event_id = %s
            ORDER BY regiment, company, last_name;
        """, (event_id,))
        rows = cur.fetchall()
        roster = []
        for row in rows:
            roster.append({
                "firstName": row[0], "lastName": row[1], "regiment": row[2],
                "company": row[3], "cNumber": row[4], "registrationTime": str(row[5])
            })
        return jsonify(roster), 200
    except Exception as e:
        return jsonify({"error": "Database error occurred."}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    wait_for_db()
    app.run(host="0.0.0.0", port=5000)