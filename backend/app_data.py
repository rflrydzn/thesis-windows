# app_data.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

# MySQL configuration
db_host = 'localhost'
database = 'sensor_data'
db_user = 'root'
db_password = 'dizon0019'

# Global variable to track whether recording is active
recording_active = False
current_session_id = None

###############################
# Utility: Insert sensor reading into DB
###############################
def insert_data(heartrate, oxygen, confidence, session_id=None):
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        if connection.is_connected():
            cursor = connection.cursor()
            query = "INSERT INTO readings (heartrate, oxygen_level, confidence, session_id) VALUES (%s, %s, %s, %s)"
            cursor.execute(query, (heartrate, oxygen, confidence, session_id))
            connection.commit()
            cursor.close()
            print("Data inserted:", heartrate, oxygen, confidence, session_id)
    except Error as e:
        print("Error while inserting data into MySQL:", e)
    finally:
        if connection.is_connected():
            connection.close()

###############################
# Endpoint: Start Recording
###############################
@app.route('/recording/start', methods=['POST'])
def start_recording():
    global current_session_id, recording_active
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor()
        # Insert NULL for user_id since we're not using login.
        query = "INSERT INTO sessions (user_id) VALUES (%s)"
        cursor.execute(query, (None,))
        connection.commit()
        session_id = cursor.lastrowid
        current_session_id = session_id
        cursor.close()
        connection.close()

        # Set the recording flag to true so that the Arduino knows to send data.
        recording_active = True
        return jsonify({'msg': 'Recording started', 'session_id': session_id}), 201
    except Exception as e:
        print("Error in /recording/start:", e)
        return jsonify({'msg': 'Error starting recording', 'error': str(e)}), 500


###############################
# Endpoint: Stop Recording
###############################
@app.route('/recording/stop', methods=['POST'])
def stop_recording():
    global recording_active, current_session_id
    data = request.get_json()
    session_id = data.get('session_id')
    if not session_id:
        return jsonify({'msg': 'Session ID is required.'}), 400

    # Turn off the recording flag.
    recording_active = False

    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor()
        query = "UPDATE sessions SET end_time = NOW() WHERE id = %s"
        cursor.execute(query, (session_id,))
        connection.commit()
        cursor.close()
        connection.close()
        current_session_id = None
        return jsonify({'msg': 'Recording stopped'}), 200
    except Exception as e:
        print("Error in /recording/stop:", e)
        return jsonify({'msg': 'Error stopping recording', 'error': str(e)}), 500

###############################
# Endpoint: Recording Status (for Arduino)
###############################
@app.route('/recording/status', methods=['GET'])
def recording_status():
    # Return "true" if recording is active, else "false"
    return "true" if recording_active else "false", 200

###############################
# Endpoint: Receive sensor data from Arduino
###############################
@app.route('/data', methods=['POST'])
def receive_data():
    global current_session_id  # The session id set in /recording/start
    try:
        heartrate = request.form.get('heartrate')
        oxygen = request.form.get('oxygen')
        confidence = request.form.get('confidence')
        session_id = request.form.get('session_id')
        # If no session_id was provided, use the global current_session_id
        if not session_id and current_session_id is not None:
            session_id = current_session_id

        if heartrate and oxygen and confidence:
            insert_data(heartrate, oxygen, confidence, session_id)
            return "Data received and stored.", 200
        else:
            return "Invalid data.", 400
    except Exception as e:
        print("Error in /data:", e)
        return f"Error processing the data: {e}", 500

@app.route('/sessions', methods=['GET'])
def list_sessions():
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM sessions ORDER BY start_time DESC"
        cursor.execute(query)
        sessions = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify({'sessions': sessions}), 200
    except Exception as e:
        print("Error in /sessions:", e)
        return jsonify({'msg': 'Error retrieving sessions', 'error': str(e)}), 500

@app.route('/session/<int:session_id>', methods=['GET'])
def get_session_data(session_id):
    try:
        connection = mysql.connector.connect(
            host=db_host,
            database=database,
            user=db_user,
            password=db_password
        )
        cursor = connection.cursor(dictionary=True)
        
        # Fetch the session information
        query = "SELECT * FROM sessions WHERE id = %s"
        cursor.execute(query, (session_id,))
        session = cursor.fetchone()
        if not session:
            return jsonify({'msg': 'Session not found.'}), 404
        
        # Fetch all sensor readings for the session, ordered by timestamp
        query = "SELECT * FROM readings WHERE session_id = %s ORDER BY timestamp ASC"
        cursor.execute(query, (session_id,))
        readings = cursor.fetchall()
        
        cursor.close()
        connection.close()
        return jsonify({'session': session, 'readings': readings}), 200
    except Exception as e:
        print("Error in /session/{}: {}".format(session_id, e))
        return jsonify({'msg': 'Error retrieving session data', 'error': str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
