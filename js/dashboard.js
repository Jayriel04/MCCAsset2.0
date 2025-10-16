// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();
    
    // Add event listeners
    addEventListeners();
});

function initializeDashboard() {
    // Update stats with real data
    updateStats();
    
    // Load recent activities
    loadRecentActivities();
}

function updateStats() {
    // Sample data - in a real application, this would come from an API
    const stats = {
        totalAssets: 247,
        borrowedAssets: 18,
        maintenanceAssets: 5,
        inactiveAssets: 12
    };
    
    // Update the stat cards with animation
    animateCounter('total-assets', stats.totalAssets);
    animateCounter('borrowed-assets', stats.borrowedAssets);
    animateCounter('maintenance-assets', stats.maintenanceAssets);
    animateCounter('inactive-assets', stats.inactiveAssets);
}

function animateCounter(elementId, finalValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue = 0;
    const increment = finalValue / 30;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
            element.textContent = finalValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentValue);
        }
    }, 50);
}

function loadRecentActivities() {
    const activities = [
        {
            type: 'asset-added',
            icon: 'fas fa-plus-circle',
            title: 'New Asset Added',
            description: 'Dell Laptop - ASSET-2024-001',
            time: '2 hours ago',
            color: 'success'
        },
        {
            type: 'asset-borrowed',
            icon: 'fas fa-hand-holding',
            title: 'Asset Borrowed',
            description: 'Projector - ASSET-2023-045',
            time: '4 hours ago',
            color: 'warning'
        },
        {
            type: 'asset-returned',
            icon: 'fas fa-undo',
            title: 'Asset Returned',
            description: 'Camera - ASSET-2023-032',
            time: '6 hours ago',
            color: 'info'
        },
        {
            type: 'maintenance-completed',
            icon: 'fas fa-check-circle',
            title: 'Maintenance Completed',
            description: 'Printer - ASSET-2023-018',
            time: '1 day ago',
            color: 'success'
        },
        {
            type: 'asset-inactive',
            icon: 'fas fa-ban',
            title: 'Asset Marked Inactive',
            description: 'Old Computer - ASSET-2022-089',
            time: '2 days ago',
            color: 'danger'
        }
    ];
    
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.color}">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
                <small class="activity-time">${activity.time}</small>
            </div>
        </div>
    `).join('');
}


function addEventListeners() {
    // Review button functionality
    const reviewButtons = document.querySelectorAll('.btn-primary');
    reviewButtons.forEach(btn => {
        if (btn.textContent.includes('Review')) {
            btn.addEventListener('click', function() {
                window.location.href = 'borrow-application.html';
            });
        }
    });
    
    // Assign button functionality
    const assignButtons = document.querySelectorAll('.btn-warning');
    assignButtons.forEach(btn => {
        if (btn.textContent.includes('Assign')) {
            btn.addEventListener('click', function() {
                window.location.href = 'maintenance.html';
            });
        }
    });
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
