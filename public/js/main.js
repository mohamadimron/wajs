// main.js - Client-side JavaScript for the application

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.IO connection
    const socket = io({ transports: ['websocket', 'polling'] });
    
    // Update connection status
    const connectionStatus = document.getElementById('connection-status');
    
    socket.on('connect', function() {
        if (connectionStatus) {
            connectionStatus.textContent = 'Connected';
            connectionStatus.className = 'badge bg-success';
        }
        console.log('Connected to server');
    });
    
    socket.on('disconnect', function() {
        if (connectionStatus) {
            connectionStatus.textContent = 'Disconnected';
            connectionStatus.className = 'badge bg-secondary';
        }
        console.log('Disconnected from server');
    });
    
    // Real-time chat functionality (if on dashboard)
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const messagesDiv = document.getElementById('messages');
    
    if (messageInput && sendMessageBtn && messagesDiv) {
        // Function to add a message to the chat
        function addMessage(message, isOwn = false) {
            const messageElement = document.createElement('div');
            messageElement.className = `alert ${isOwn ? 'alert-primary' : 'alert-light'} mb-2`;

            const timeElement = document.createElement('small');
            timeElement.className = 'text-muted';
            timeElement.textContent = new Date().toLocaleTimeString();

            const timeDiv = document.createElement('div');
            timeDiv.appendChild(timeElement);

            const messageContent = document.createElement('div');
            // Use textContent to prevent XSS, but we'll decode HTML entities if needed
            // For the chat, we'll just use textContent to be safe
            messageContent.textContent = message;

            messageElement.appendChild(timeDiv);
            messageElement.appendChild(messageContent);

            messagesDiv.appendChild(messageElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        // Send message when button is clicked
        sendMessageBtn.addEventListener('click', function() {
            const message = messageInput.value.trim();
            if (message) {
                socket.emit('message', {
                    text: message,
                    username: document.querySelector('.navbar-nav .dropdown-toggle')?.textContent?.trim() || 'Guest'
                });
                addMessage(message, true); // Display own message
                messageInput.value = '';
            }
        });
        
        // Send message when Enter key is pressed
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessageBtn.click();
            }
        });
        
        // Listen for incoming messages
        socket.on('message', function(data) {
            addMessage(`<strong>${data.username || 'User'}:</strong> ${data.text}`);
        });
        
        // Add initial message
        addMessage('Welcome to the real-time chat! Start typing to send a message.');
    }
    
    // Add fade-in animation to page content
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.classList.add('fade-in');
    }
    
    // Form validation for login/register pages
    const loginForm = document.querySelector('form[action="/login"]');
    const registerForm = document.querySelector('form[action="/register"]');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (!username || !password) {
                e.preventDefault();
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-3';
                errorDiv.textContent = 'Please fill in all fields';
                loginForm.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 3000);
                return false;
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!username || !email || !password) {
                e.preventDefault();
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-3';
                errorDiv.textContent = 'Please fill in all fields';
                registerForm.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 3000);
                return false;
            }

            if (password.length < 6) {
                e.preventDefault();
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-3';
                errorDiv.textContent = 'Password must be at least 6 characters long';
                registerForm.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 3000);
                return false;
            }
        });
    }
    
    // Add tooltips to all elements with data-bs-toggle="tooltip"
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Handle logout confirmation
    const logoutLink = document.querySelector('a[href="/logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            // Create a simple overlay confirmation
            const overlay = document.createElement('div');
            overlay.id = 'logout-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '10000';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.fontFamily = 'Arial, sans-serif';

            const confirmationBox = document.createElement('div');
            confirmationBox.style.background = 'white';
            confirmationBox.style.padding = '20px';
            confirmationBox.style.borderRadius = '8px';
            confirmationBox.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            confirmationBox.style.textAlign = 'center';
            confirmationBox.style.maxWidth = '400px';
            confirmationBox.style.width = '90%';

            const title = document.createElement('h4');
            title.textContent = 'Confirm Logout';

            const message = document.createElement('p');
            message.textContent = 'Are you sure you want to logout?';

            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '15px';

            const yesBtn = document.createElement('button');
            yesBtn.textContent = 'Yes';
            yesBtn.style.padding = '8px 16px';
            yesBtn.style.margin = '0 5px';
            yesBtn.style.backgroundColor = '#007bff';
            yesBtn.style.color = 'white';
            yesBtn.style.border = 'none';
            yesBtn.style.borderRadius = '4px';
            yesBtn.style.cursor = 'pointer';

            const noBtn = document.createElement('button');
            noBtn.textContent = 'No';
            noBtn.style.padding = '8px 16px';
            noBtn.style.margin = '0 5px';
            noBtn.style.backgroundColor = '#6c757d';
            noBtn.style.color = 'white';
            noBtn.style.border = 'none';
            noBtn.style.borderRadius = '4px';
            noBtn.style.cursor = 'pointer';

            buttonContainer.appendChild(yesBtn);
            buttonContainer.appendChild(noBtn);

            confirmationBox.appendChild(title);
            confirmationBox.appendChild(message);
            confirmationBox.appendChild(buttonContainer);
            overlay.appendChild(confirmationBox);
            document.body.appendChild(overlay);

            // Event listeners
            yesBtn.addEventListener('click', function() {
                document.body.removeChild(overlay);
                // Allow the original click to proceed
            });

            noBtn.addEventListener('click', function() {
                document.body.removeChild(overlay);
                e.preventDefault();
            });

            // Click outside to cancel
            overlay.addEventListener('click', function(event) {
                if (event.target === overlay) {
                    document.body.removeChild(overlay);
                    e.preventDefault();
                }
            });
        });
    }
    
    // Add active class to current page in navigation
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});