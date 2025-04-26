from flask import Flask, request, jsonify, render_template
from models import Incident, SEVERITY_LEVELS

app = Flask(__name__)

# Seed initial data
Incident.seed_initial_data()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/incidents', methods=['GET'])
def get_incidents():
    try:
        incidents = Incident.get_all_incidents()
        return jsonify(incidents), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/incidents', methods=['POST'])
def create_incident():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(key in data for key in ['title', 'description', 'severity']):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Validate severity level
        if data['severity'] not in SEVERITY_LEVELS:
            return jsonify({
                "error": "Invalid severity level",
                "valid_levels": SEVERITY_LEVELS
            }), 400
        
        # Create incident
        incident_id = Incident.create_incident(
            data['title'],
            data['description'],
            data['severity']
        )
        
        # Get the created incident to return
        new_incident = Incident.get_incident_by_id(incident_id)
        return jsonify(new_incident), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/incidents/<incident_id>', methods=['GET'])
def get_incident(incident_id):
    try:
        incident = Incident.get_incident_by_id(incident_id)
        if incident:
            return jsonify(incident), 200
        return jsonify({"error": "Incident not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/incidents/<incident_id>', methods=['DELETE'])
def delete_incident(incident_id):
    try:
        if Incident.delete_incident(incident_id):
            return '', 204
        return jsonify({"error": "Incident not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)