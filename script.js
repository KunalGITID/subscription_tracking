const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

function switchPage(targetId) {
    // Update Nav
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === targetId) {
            item.classList.add('active');
        }
    });

    // Update Pages
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === targetId) {
            page.classList.add('active');
        }
    });
    
    window.scrollTo(0,0);
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('data-target');
        if (targetId) {
            switchPage(targetId);
        }
    });
});

// Demo Setup
document.getElementById('add-sub-btn').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Subscription simulated adding...');
    switchPage('dashboard-page');
});

// View Sub Details
const subs = document.querySelectorAll('.list-item');
subs.forEach(sub => {
    sub.addEventListener('click', () => {
        switchPage('details-page');
    });
});
