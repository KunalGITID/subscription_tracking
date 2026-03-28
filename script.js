const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

// --- Global State ---
let profile = JSON.parse(localStorage.getItem('atelier_profile')) || {
    name: 'Atelier',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
};

let subscriptions = JSON.parse(localStorage.getItem('atelier_subscriptions')) || [];
let activeSubId = null; // for Details page

// --- Utilities ---
function saveState() {
    localStorage.setItem('atelier_profile', JSON.stringify(profile));
    localStorage.setItem('atelier_subscriptions', JSON.stringify(subscriptions));
}

function formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMonthlyCost(sub) {
    return sub.cycle === 'Yearly' ? parseFloat(sub.price) / 12 : parseFloat(sub.price);
}

// --- Navigation ---
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
            if (targetId === 'dashboard-page' || targetId === 'analytics-page') {
                renderApp();
            }
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

// --- Details Page Logic ---
function viewDetails(id) {
    activeSubId = id;
    const sub = subscriptions.find(s => s.id === id);
    if(sub) {
        document.getElementById('detail-name').textContent = sub.name;
        document.getElementById('detail-cycle').textContent = sub.cycle + ' Plan';
        document.getElementById('detail-price').textContent = parseFloat(sub.price).toFixed(2);
        document.getElementById('detail-date').textContent = formatDate(sub.dateAdded);
        switchPage('details-page');
    }
}

document.getElementById('delete-sub-btn').addEventListener('click', () => {
    if(confirm('Are you sure you want to delete this subscription?')) {
        subscriptions = subscriptions.filter(s => s.id !== activeSubId);
        saveState();
        switchPage('dashboard-page');
    }
});


// --- Profile Logic ---
const profileForm = document.getElementById('profile-form');
const nameInput = document.getElementById('profile-name');
const avatarInput = document.getElementById('profile-avatar');

profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    profile.name = nameInput.value.trim() || 'User';
    profile.avatar = avatarInput.value.trim() || profile.avatar;
    saveState();
    renderApp();
    switchPage('dashboard-page'); // give them visual feedback it saved by redirecting
});

// --- Form Logic ---
const addForm = document.getElementById('add-form');
addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('add-name').value.trim();
    const cycle = document.getElementById('add-cycle').value;
    const price = document.getElementById('add-price').value;

    if (!name || !price) return;

    const newSub = {
        id: Date.now().toString(),
        name,
        cycle,
        price: parseFloat(price).toFixed(2),
        dateAdded: new Date().toISOString()
    };

    subscriptions.push(newSub);
    saveState();
    
    // reset form
    addForm.reset();
    
    // instant transition
    switchPage('dashboard-page');
});

// --- Render Core App state ---
function renderApp() {
    // 1. Profile
    document.getElementById('user-display-name').textContent = profile.name;
    document.getElementById('user-avatar-img').src = profile.avatar;
    nameInput.value = profile.name;
    avatarInput.value = profile.avatar;

    let totalMonthly = 0;
    
    // 2. Clear lists
    const portfolioList = document.getElementById('portfolio-list');
    const upcomingScroll = document.getElementById('upcoming-scroll');
    const analyticsList = document.getElementById('analytics-list');
    
    portfolioList.innerHTML = '';
    upcomingScroll.innerHTML = '';
    analyticsList.innerHTML = '';

    if (subscriptions.length === 0) {
        portfolioList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--on-surface-variant); font-size: 0.9rem; background: var(--surface-low); border-radius: var(--radius-md);">No active subscriptions. Tap (+) to add.</div>';
    } else {
        document.getElementById('spend-trend').style.display = 'inline-flex';
    }

    // 3. Populate
    subscriptions.forEach((sub, index) => {
        totalMonthly += getMonthlyCost(sub);

        // Generate a pseudo-random color based on name for aesthetic
        const colors = ['#1db954', '#e50914', '#c0c1ff', '#4edea3', '#ffb4ab', '#4b4dd8'];
        const color = colors[sub.name.length % colors.length];

        // Portfolio Item
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-left">
                <div class="list-icon-wrapper" style="background: ${color}20; color: ${color}; font-size: 24px;">
                    ${sub.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div class="list-title">${sub.name}</div>
                    <div class="list-subtitle">${sub.cycle}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="list-price">₹${sub.price}</div>
                <div class="list-date">${formatDate(sub.dateAdded)}</div>
            </div>
        `;
        item.addEventListener('click', () => viewDetails(sub.id));
        portfolioList.appendChild(item);

        // Upcoming Mini Card
        const miniCard = document.createElement('div');
        miniCard.className = 'card-mini';
        miniCard.innerHTML = `
            <div class="card-icon" style="background: ${color}20; color: ${color};">
                <span class="material-symbols-outlined">payments</span>
            </div>
            <h3>${sub.name}</h3>
            <p>₹${sub.price}</p>
        `;
        miniCard.addEventListener('click', () => viewDetails(sub.id));
        upcomingScroll.appendChild(miniCard);
    });

    // 4. Update Totals
    document.getElementById('total-spend').textContent = totalMonthly.toFixed(2);
    document.getElementById('ytd-spend').textContent = (totalMonthly * 12).toFixed(2);

    // 5. Analytics Basic Rendering
    if (subscriptions.length > 0) {
        const sorted = [...subscriptions].sort((a, b) => getMonthlyCost(b) - getMonthlyCost(a));
        sorted.forEach(sub => {
            const pct = Math.round((getMonthlyCost(sub) / totalMonthly) * 100);
            const aItem = document.createElement('div');
            aItem.className = 'list-item';
            aItem.innerHTML = `
                <div class="list-item-left">
                     <div>
                         <div class="list-title">${sub.name}</div>
                         <div class="list-subtitle">${pct}% of total <span style="font-size:10px;">(₹${getMonthlyCost(sub).toFixed(2)}/mo)</span></div>
                     </div>
                 </div>
            `;
            analyticsList.appendChild(aItem);
        });
    }
}

// Initial load
renderApp();
