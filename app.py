from flask import Flask, request, jsonify, render_template, make_response
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
        # Handle empty or invalid request body
        if not request.data:
            return jsonify({"error": "Request body is required"}), 400
            
        try:
            data = request.get_json()
            if data is None:
                return jsonify({"error": "Invalid JSON format"}), 400
        except Exception:
            return jsonify({"error": "Invalid JSON format"}), 400
        
        # Validate required fields
        if not all(key in data for key in ['title', 'description', 'severity']):
            return jsonify({
                "error": "Missing required fields", 
                "required": ['title', 'description', 'severity']
            }), 400
        
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
            return jsonify({"message": "Incident successfully deleted"}), 200
        return jsonify({"error": "Incident not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True)