// Use event delegation to handle edit button clicks
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for both edit and delete buttons using event delegation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-user-btn')) {
            const userId = e.target.getAttribute('data-user-id');
            const username = e.target.getAttribute('data-username');
            const email = e.target.getAttribute('data-email');
            const role = e.target.getAttribute('data-role');
            const isactive = e.target.getAttribute('data-isactive');

            editUser(userId, username, email, role, isactive);
        }

        // Add event listener for delete buttons using event delegation
        if (e.target.classList.contains('delete-user-btn')) {
            const userId = e.target.getAttribute('data-user-id');
            const username = e.target.getAttribute('data-username');

            showDeleteConfirmation(userId, username);
        }
    });

    // Add event listener for form submission
    const form = document.getElementById('editUserForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            updateUser(event);
        });
    }
});

function showDeleteConfirmation(userId, username) {
    // Create a simple overlay confirmation using DOM methods to avoid innerHTML
    const overlay = document.createElement('div');
    overlay.id = 'delete-overlay';
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

    // Create elements individually instead of using innerHTML
    const title = document.createElement('h4');
    title.textContent = 'Confirm Delete';
    title.style.marginTop = '0';

    const message1 = document.createElement('p');
    message1.textContent = `Are you sure you want to delete user "${username}"?`;

    const message2 = document.createElement('p');
    const strongElement = document.createElement('strong');
    strongElement.textContent = 'This action cannot be undone.';
    message2.appendChild(strongElement);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '15px';

    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'confirm-delete-btn';
    confirmBtn.textContent = 'Delete';
    confirmBtn.style.padding = '8px 16px';
    confirmBtn.style.margin = '0 5px';
    confirmBtn.style.backgroundColor = '#dc3545';
    confirmBtn.style.color = 'white';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '4px';
    confirmBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-delete-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.margin = '0 5px';
    cancelBtn.style.backgroundColor = '#6c757d';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';

    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);

    confirmationBox.appendChild(title);
    confirmationBox.appendChild(message1);
    confirmationBox.appendChild(message2);
    confirmationBox.appendChild(buttonContainer);

    overlay.appendChild(confirmationBox);
    document.body.appendChild(overlay);

    // Add event listeners
    confirmBtn.addEventListener('click', function() {
        document.body.removeChild(overlay);
        deleteUser(userId);
    });

    cancelBtn.addEventListener('click', function() {
        document.body.removeChild(overlay);
    });

    // Click outside to close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

function editUser(id, username, email, role, isactive) {
    document.getElementById('userId').value = id;
    document.getElementById('editUsername').value = username;
    document.getElementById('editEmail').value = email;
    document.getElementById('editRole').value = role;
    document.getElementById('editIsActive').checked = isactive == '1' || isactive == 'true' ? true : false;

    // Update form action to point to the correct endpoint
    const form = document.getElementById('editUserForm');
    form.action = `/admin/users/${id}`;

    // Make sure Bootstrap modal is available before using it
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        // Show the modal
        const modalElement = document.getElementById('editUserModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error('Edit user modal element not found');
        }
    } else {
        console.error('Bootstrap modal is not available');
    }
}

function updateUser(event) {
    event.preventDefault();

    const form = document.getElementById('editUserForm');
    const formData = new FormData(form);

    // Check if checkbox is checked or not (handle string values properly)
    const isActiveChecked = document.getElementById('editIsActive').checked;
    const isActiveValue = isActiveChecked ? 1 : 0;

    // Send the data using fetch API instead of creating a form
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        role: formData.get('role'),
        isactive: isActiveValue,
        _method: 'PUT'
    };

    fetch(form.action, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(userData),
        credentials: 'same-origin' // Include cookies for session
    })
    .then(response => {
        if (response.ok) {
            // Close the modal and reload the page to see changes
            const modalElement = document.getElementById('editUserModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }
            window.location.reload();
        } else {
            console.error('Failed to update user');
            // Show error using a Bootstrap alert
            const errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
            errorAlert.style.zIndex = '9999';

            // Create alert content with text elements
            const alertText = document.createElement('span');
            alertText.textContent = 'Failed to update user. Please try again.';

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'btn-close';
            closeBtn.setAttribute('data-bs-dismiss', 'alert');
            closeBtn.setAttribute('aria-label', 'Close');

            errorAlert.appendChild(alertText);
            errorAlert.appendChild(closeBtn);

            document.body.appendChild(errorAlert);

            // Auto-remove the alert after 5 seconds
            setTimeout(() => {
                if (errorAlert.parentNode) {
                    errorAlert.parentNode.removeChild(errorAlert);
                }
            }, 5000);
        }
    })
    .catch(error => {
        console.error('Error updating user:', error);
        // Show error using a Bootstrap alert
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
        errorAlert.style.zIndex = '9999';

        // Create alert content with text elements
        const alertText = document.createElement('span');
        alertText.textContent = 'Error updating user. Please try again.';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close';
        closeBtn.setAttribute('data-bs-dismiss', 'alert');
        closeBtn.setAttribute('aria-label', 'Close');

        errorAlert.appendChild(alertText);
        errorAlert.appendChild(closeBtn);

        document.body.appendChild(errorAlert);

        // Auto-remove the alert after 5 seconds
        setTimeout(() => {
            if (errorAlert.parentNode) {
                errorAlert.parentNode.removeChild(errorAlert);
            }
        }, 5000);
    });
}

function deleteUser(userId) {
    // Send the delete request using fetch API instead of creating a form
    const deleteData = {
        _method: 'DELETE'
    };

    fetch(`/admin/users/${userId}`, {
        method: 'POST', // Using POST with _method=DELETE due to methodOverride
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(deleteData),
        credentials: 'same-origin' // Include cookies for session
    })
    .then(response => {
        if (response.ok) {
            // Reload the page to see changes
            window.location.reload();
        } else {
            console.error('Failed to delete user');
            // Show error using a Bootstrap alert
            const errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
            errorAlert.style.zIndex = '9999';

            // Create alert content with text elements
            const alertText = document.createElement('span');
            alertText.textContent = 'Failed to delete user. Please try again.';

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'btn-close';
            closeBtn.setAttribute('data-bs-dismiss', 'alert');
            closeBtn.setAttribute('aria-label', 'Close');

            errorAlert.appendChild(alertText);
            errorAlert.appendChild(closeBtn);

            document.body.appendChild(errorAlert);

            // Auto-remove the alert after 5 seconds
            setTimeout(() => {
                if (errorAlert.parentNode) {
                    errorAlert.parentNode.removeChild(errorAlert);
                }
            }, 5000);
        }
    })
    .catch(error => {
        console.error('Error deleting user:', error);
        // Show error using a Bootstrap alert
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
        errorAlert.style.zIndex = '9999';

        // Create alert content with text elements
        const alertText = document.createElement('span');
        alertText.textContent = 'Error deleting user. Please try again.';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close';
        closeBtn.setAttribute('data-bs-dismiss', 'alert');
        closeBtn.setAttribute('aria-label', 'Close');

        errorAlert.appendChild(alertText);
        errorAlert.appendChild(closeBtn);

        document.body.appendChild(errorAlert);

        // Auto-remove the alert after 5 seconds
        setTimeout(() => {
            if (errorAlert.parentNode) {
                errorAlert.parentNode.removeChild(errorAlert);
            }
        }, 5000);
    });
}