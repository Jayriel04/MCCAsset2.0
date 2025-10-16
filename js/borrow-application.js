// Borrow Application Form Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeBorrowForm();
});

function initializeBorrowForm() {
    const form = document.getElementById('borrowForm');
    const dateBorrowedInput = document.getElementById('dateBorrowed');
    const expectedReturnInput = document.getElementById('expectedReturn');
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dateBorrowedInput.min = today;
    expectedReturnInput.min = today;
    
    // Update expected return date minimum when date borrowed changes
    dateBorrowedInput.addEventListener('change', function() {
        expectedReturnInput.min = this.value;
        if (expectedReturnInput.value && expectedReturnInput.value < this.value) {
            expectedReturnInput.value = '';
        }
    });
    
    // Form submission handler
    form.addEventListener('submit', handleFormSubmit);
    
    // Form reset handler
    form.addEventListener('reset', function() {
        setTimeout(() => {
            // Reset date minimums after form reset
            dateBorrowedInput.min = today;
            expectedReturnInput.min = today;
        }, 10);
    });
    
    // Real-time validation
    addRealTimeValidation();
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const borrowData = Object.fromEntries(formData.entries());
    
    // Validate form data
    if (validateFormData(borrowData)) {
        showLoadingState();
        try {
            await submitBorrowRequest(borrowData);
        } catch (error) {
            console.error('Submission failed:', error);
            showValidationErrors(['An unexpected error occurred. Please try again.']);
            hideLoadingState();
        }
    }
}

function validateFormData(data) {
    const errors = [];
    
    // Check required fields
    const requiredFields = [
        'borrowerName', 'borrowerDepartment', 'cellphone', 'email',
        'assetDescription', 'assetSerial', 'departmentTag', 
        'purposeOfUse', 'locationOfUse', 'dateBorrowed', 'expectedReturn'
    ];
    
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors.push(`${getFieldLabel(field)} is required`);
        }
    });
    
    // Validate email format
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Please enter a valid email address');
    }
    
    // Validate phone format
    if (data.cellphone && !isValidPhone(data.cellphone)) {
        errors.push('Please enter a valid phone number');
    }
    
    // Validate dates
    if (data.dateBorrowed && data.expectedReturn) {
        if (new Date(data.expectedReturn) <= new Date(data.dateBorrowed)) {
            errors.push('Expected return date must be after the borrow date');
        }
    }
    
    if (errors.length > 0) {
        showValidationErrors(errors);
        return false;
    }
    
    return true;
}

async function submitBorrowRequest(data) {
    // Map form data to the format expected by the PHP API
    const apiData = {
        asset_id: data.assetSerial, // Assuming assetSerial is the asset_id
        borrower_name: data.borrowerName,
        borrower_department: data.borrowerDepartment,
        borrower_contact: data.cellphone,
        borrower_email: data.email,
        purpose: data.purposeOfUse,
        requested_date: data.dateBorrowed,
        expected_return_date: data.expectedReturn,
        notes: `Asset Description: ${data.assetDescription}. Department Tag: ${data.departmentTag}. Location of Use: ${data.locationOfUse}.`
    };

    console.log('Submitting borrow request to API:', apiData);

    try {
        // Use correct relative path and forward slashes from pages/ -> ../Api/...
        const response = await fetch('../Api/borrow/create.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(apiData),
        });

        let resultText = await response.text();
        let result;
        try {
            result = resultText ? JSON.parse(resultText) : {};
        } catch (e) {
            // Not JSON - keep raw text for debugging
            result = { message: resultText };
        }

        hideLoadingState();

        if (response.ok && response.status === 201) {
            const requestId = result.id ? `BR-${result.id}` : 'BR-' + Date.now();
            showSuccessMessage(requestId);
            document.getElementById('borrowForm').reset();
            console.log('Server success response:', result);
        } else {
            console.error('Server returned error:', response.status, result);
            const errors = [
                result.message || `Failed to submit borrow request. Server returned ${response.status}.`
            ];
            showValidationErrors(errors);
        }
    } catch (networkError) {
        hideLoadingState();
        console.error('Network or fetch error:', networkError);
        showValidationErrors(['Network error: could not reach server. Check connection or server status.']);
    }
}

function showLoadingState() {
    const submitBtn = document.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    submitBtn.style.opacity = '0.7';
    
    // Store original text for later restoration
    submitBtn.dataset.originalText = originalText;
}

function hideLoadingState() {
    const submitBtn = document.querySelector('.btn-primary');
    
    submitBtn.disabled = false;
    submitBtn.textContent = submitBtn.dataset.originalText || 'Submit Request';
    submitBtn.style.opacity = '1';
}

function showSuccessMessage(requestId) {
    const message = `
        <div class="success-notification">
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <h3>Request Submitted Successfully!</h3>
                <p>Your borrow request has been submitted with ID: <strong>${requestId}</strong></p>
                <p>You will receive a confirmation email shortly.</p>
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-secondary btn-sm">Close</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', message);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const notification = document.querySelector('.success-notification');
        if (notification) {
            notification.remove();
        }
    }, 5000);
}

function showValidationErrors(errors) {
    const errorMessage = `
        <div class="error-notification">
            <div class="notification-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Please correct the following errors:</h3>
                <ul>
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-secondary btn-sm">Close</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorMessage);
    
    // Auto-remove after 7 seconds
    setTimeout(() => {
        const notification = document.querySelector('.error-notification');
        if (notification) {
            notification.remove();
        }
    }, 7000);
}

function addRealTimeValidation() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            // Clear previous validation styling
            this.classList.remove('error', 'valid');
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    
    // Check if required field is empty
    if (field.hasAttribute('required') && !value) {
        isValid = false;
    }
    
    // Specific validations
    if (value) {
        switch (field.type) {
            case 'email':
                isValid = isValidEmail(value);
                break;
            case 'tel':
                isValid = isValidPhone(value);
                break;
            case 'date':
                isValid = new Date(value) >= new Date().setHours(0,0,0,0);
                break;
        }
    }
    
    // Apply validation styling
    field.classList.remove('error', 'valid');
    if (value) {
        field.classList.add(isValid ? 'valid' : 'error');
    }
}

// Utility functions
function getFieldLabel(fieldName) {
    const labels = {
        'borrowerName': 'Name',
        'borrowerDepartment': 'Department',
        'cellphone': 'Cellphone',
        'email': 'Email',
        'assetDescription': 'Asset Description',
        'assetSerial': 'Asset Serial Number',
        'departmentTag': 'Department Tag',
        'purposeOfUse': 'Purpose of Use',
        'locationOfUse': 'Location of Use',
        'dateBorrowed': 'Date Borrowed',
        'expectedReturn': 'Expected Return Date'
    };
    
    return labels[fieldName] || fieldName;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// Auto-fill today's date for date borrowed
document.addEventListener('DOMContentLoaded', function() {
    const dateBorrowedInput = document.getElementById('dateBorrowed');
    if (dateBorrowedInput && !dateBorrowedInput.value) {
        dateBorrowedInput.value = new Date().toISOString().split('T')[0];
    }
});
