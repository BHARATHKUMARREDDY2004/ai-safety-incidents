document.addEventListener('DOMContentLoaded', function() {
    const methodSelect = document.getElementById('methodSelect');
    const endpointInput = document.getElementById('endpointInput');
    const sendRequest = document.getElementById('sendRequest');
    const requestBody = document.getElementById('requestBody');
    const toggleBody = document.getElementById('toggleBody');
    const requestBodyContainer = document.getElementById('requestBodyContainer');
    const responseOutput = document.getElementById('responseOutput');
    const statusIndicator = document.getElementById('statusIndicator');
    const historyList = document.getElementById('historyList');
    
    let requestHistory = JSON.parse(localStorage.getItem('apiHistory')) || [];
    
    // Initializes UI
    updateHistoryList();
    toggleBody.addEventListener('click', toggleRequestBody);
    
    // Handle request sending
    sendRequest.addEventListener('click', sendApiRequest);
    
    // Update request body visibility based on method
    methodSelect.addEventListener('change', updateRequestBodyVisibility);
    endpointInput.addEventListener('input', updateRequestBodyVisibility);
    
    // Initialize the visibility of the request body
    updateRequestBodyVisibility();
    
    function updateRequestBodyVisibility() {
        const method = methodSelect.value;
        const endpoint = endpointInput.value.toLowerCase();
        
        // Hide request body for GET and DELETE methods or for endpoints that don't need body
        if (method === 'GET' || method === 'DELETE') {
            requestBodyContainer.classList.add('hidden');
        } else {
            requestBodyContainer.classList.remove('hidden');
        }
    }
    
    function toggleRequestBody() {
        requestBody.classList.toggle('hidden');
        const icon = toggleBody.querySelector('i');
        if (requestBody.classList.contains('hidden')) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        } else {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    }
    
    function sendApiRequest() {
        const method = methodSelect.value;
        let endpoint = endpointInput.value.trim();
        
        if (!endpoint) {
            showNotification('Please enter an endpoint', 'warning');
            return;
        }
        
        // Ensure endpoint starts with /
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
            endpointInput.value = endpoint;
        }
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // Only add body for POST requests
        if (method === 'POST') {
            try {
                const bodyText = requestBody.value.trim();
                if (!bodyText) {
                    showNotification('Request body cannot be empty for POST requests', 'warning');
                    return;
                }
                
                options.body = bodyText;
                JSON.parse(bodyText); // Validate JSON
            } catch (e) {
                showNotification('Invalid JSON in request body', 'error');
                return;
            }
        }
        
        // Show loading state
        statusIndicator.textContent = "Sending...";
        statusIndicator.style.backgroundColor = "#f39c12";
        statusIndicator.style.color = "white";
        
        // Disable button while sending
        sendRequest.disabled = true;
        sendRequest.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending';
        
        fetch(endpoint, options)
            .then(async response => {
                let data;
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = { message: 'Response received (non-JSON)' };
                    if (response.status === 204) {
                        data.message = "Successfully deleted";
                    }
                }
                
                showResponse(response.status, data);
                
                // Add to history
                addToHistory({
                    method,
                    endpoint,
                    status: response.status,
                    timestamp: new Date().toISOString()
                });
            })
            .catch(error => {
                showResponse(500, { error: error.message });
                showNotification('Request failed: ' + error.message, 'error');
            })
            .finally(() => {
                // Re-enable button after request completes
                sendRequest.disabled = false;
                sendRequest.innerHTML = 'Send <i class="fas fa-paper-plane"></i>';
            });
    }
    
    function showResponse(status, data) {
        // Update status indicator
        statusIndicator.textContent = `Status: ${status}`;
        
        if (status >= 200 && status < 300) {
            statusIndicator.style.backgroundColor = "#2ecc71"; // Green
        } else if (status >= 400 && status < 500) {
            statusIndicator.style.backgroundColor = "#e74c3c"; // Red
        } else {
            statusIndicator.style.backgroundColor = "#f39c12"; // Orange
        }
        
        statusIndicator.style.color = "white";
        
        // Format and display response
        responseOutput.textContent = JSON.stringify(data, null, 2);
        
        // Syntax highlighting (basic)
        responseOutput.innerHTML = responseOutput.textContent
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
            function(match) {
                let cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    function addToHistory(request) {
        requestHistory.unshift(request);
        if (requestHistory.length > 10) {
            requestHistory = requestHistory.slice(0, 10);
        }
        localStorage.setItem('apiHistory', JSON.stringify(requestHistory));
        updateHistoryList();
    }
    
    function updateHistoryList() {
        historyList.innerHTML = '';
        
        if (requestHistory.length === 0) {
            historyList.innerHTML = '<p class="no-history">No requests yet</p>';
            return;
        }
        
        requestHistory.forEach((req, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            // Add status color indicator
            let statusClass = 'unknown';
            if (req.status >= 200 && req.status < 300) statusClass = 'success';
            else if (req.status >= 400) statusClass = 'error';
            
            item.innerHTML = `
                <div class="history-status ${statusClass}">${req.status}</div>
                <span class="history-method ${req.method.toLowerCase()}">${req.method}</span>
                <span class="history-endpoint">${req.endpoint}</span>
                <span class="history-time" title="${new Date(req.timestamp).toLocaleString()}">${new Date(req.timestamp).toLocaleTimeString()}</span>
                <button class="history-delete" title="Remove from history"><i class="fas fa-times"></i></button>
            `;
            
            // Click on the item to load the request
            item.querySelector(':not(.history-delete)').addEventListener('click', () => {
                methodSelect.value = req.method;
                endpointInput.value = req.endpoint;
                updateRequestBodyVisibility();
                showNotification('Request loaded', 'info');
            });
            
            // Delete from history
            item.querySelector('.history-delete').addEventListener('click', (event) => {
                event.stopPropagation();
                requestHistory.splice(index, 1);
                localStorage.setItem('apiHistory', JSON.stringify(requestHistory));
                updateHistoryList();
                showNotification('Request removed from history', 'info');
            });
            
            historyList.appendChild(item);
        });
    }
    
    // Load sample data on first run
    if (requestHistory.length === 0) {
        requestHistory = [
            {
                method: 'GET',
                endpoint: '/incidents',
                status: 200,
                timestamp: new Date().toISOString()
            },
            {
                method: 'POST',
                endpoint: '/incidents',
                status: 201,
                timestamp: new Date().toISOString()
            }
        ];
        localStorage.setItem('apiHistory', JSON.stringify(requestHistory));
        updateHistoryList();
    }
});