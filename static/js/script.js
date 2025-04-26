document.addEventListener('DOMContentLoaded', function() {
    // Load incidents when page loads
    loadIncidents();
    
    // Handle form submission
    const incidentForm = document.getElementById('incidentForm');
    incidentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            severity: document.getElementById('severity').value
        };
        
        fetch('/incidents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(data => {
            // Clear form
            incidentForm.reset();
            // Reload incidents
            loadIncidents();
        })
        .catch(error => {
            alert(`Error: ${error.error || 'Failed to create incident'}`);
        });
    });
});

function loadIncidents() {
    fetch('/incidents')
        .then(response => response.json())
        .then(incidents => {
            const container = document.getElementById('incidentsContainer');
            container.innerHTML = '';
            
            if (incidents.length === 0) {
                container.innerHTML = '<p>No incidents reported yet.</p>';
                return;
            }
            
            incidents.forEach(incident => {
                const incidentCard = document.createElement('div');
                incidentCard.className = `incident-card ${incident.severity.toLowerCase()}`;
                
                const severityClass = `severity-${incident.severity.toLowerCase()}`;
                
                incidentCard.innerHTML = `
                    <h3 class="incident-title">${incident.title}</h3>
                    <span class="incident-severity ${severityClass}">${incident.severity}</span>
                    <p class="incident-description">${incident.description}</p>
                    <p class="incident-date">Reported at: ${new Date(incident.reported_at).toLocaleString()}</p>
                    <button class="delete-btn" data-id="${incident.id}">Delete Incident</button>
                `;
                
                container.appendChild(incidentCard);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const incidentId = this.getAttribute('data-id');
                    deleteIncident(incidentId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading incidents:', error);
            document.getElementById('incidentsContainer').innerHTML = 
                '<p>Error loading incidents. Please try again later.</p>';
        });
}

function deleteIncident(incidentId) {
    if (confirm('Are you sure you want to delete this incident?')) {
        fetch(`/incidents/${incidentId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                loadIncidents();
            } else {
                alert('Failed to delete incident');
            }
        })
        .catch(error => {
            console.error('Error deleting incident:', error);
            alert('Error deleting incident');
        });
    }
}