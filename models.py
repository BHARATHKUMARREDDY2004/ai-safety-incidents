from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from bson import ObjectId
from os import environ
client = MongoClient(environ.get("MONGO_URI", "mongodb://localhost:27017"))

db = client.get_database("ai_safety")
incidents_collection = db.incidents

# Data validation
SEVERITY_LEVELS = ["Low", "Medium", "High"]

class Incident:
    @staticmethod
    def create_incident(title, description, severity):
        """Create a new incident in the database"""
        if severity not in SEVERITY_LEVELS:
            raise ValueError("Invalid severity level")
        
        incident_data = {
            "title": title,
            "description": description,
            "severity": severity,
            "reported_at": datetime.utcnow()
        }
        
        try:
            result = incidents_collection.insert_one(incident_data)
            return str(result.inserted_id)
        except PyMongoError as e:
            raise Exception(f"Database error: {str(e)}")

    @staticmethod
    def get_all_incidents():
        """Retrieve all incidents from the database"""
        try:
            incidents = list(incidents_collection.find().sort("reported_at", -1))
            for incident in incidents:
                incident["id"] = str(incident["_id"])
                incident["reported_at"] = incident["reported_at"].isoformat() + "Z"
                del incident["_id"]
            return incidents
        except PyMongoError as e:
            raise Exception(f"Database error: {str(e)}")

    @staticmethod
    def get_incident_by_id(incident_id):
        """Retrieve a single incident by ID"""
        try:
            incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
            if incident:
                incident["id"] = str(incident["_id"])
                incident["reported_at"] = incident["reported_at"].isoformat() + "Z"
                del incident["_id"]
                return incident
            return None
        except PyMongoError as e:
            raise Exception(f"Database error: {str(e)}")

    @staticmethod
    def delete_incident(incident_id):
        """Delete an incident by ID"""
        try:
            result = incidents_collection.delete_one({"_id": ObjectId(incident_id)})
            return result.deleted_count > 0
        except PyMongoError as e:
            raise Exception(f"Database error: {str(e)}")

    @staticmethod
    def seed_initial_data():
        """Seed the database with initial sample data"""
        try:
            db.command('ping')
            
            if incidents_collection.count_documents({}) == 0:
                sample_incidents = [
                    {
                        "title": "Model bias in hiring algorithm",
                        "description": "AI system showed gender bias in resume screening",
                        "severity": "High",
                        "reported_at": datetime.utcnow()
                    },
                    {
                        "title": "Chatbot providing harmful advice",
                        "description": "Users reported chatbot suggesting dangerous activities",
                        "severity": "Medium",
                        "reported_at": datetime.utcnow()
                    }
                ]
                incidents_collection.insert_many(sample_incidents)
                return True
            return False
        except PyMongoError as e:
            print(f"Warning: Could not seed initial data - {str(e)}")
            return False