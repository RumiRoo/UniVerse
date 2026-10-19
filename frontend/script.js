// ORGANIZATIONS: master data
// For every organization on the app:
// Organizations page, the Dashboard's "My Organizations", and anywhere
// loaded from backend
const API_BASE_URL = 'http://localhost:3000';

let organizationsData = [];

async function fetchOrganizations() {
    try {
        const response = await fetch(API_BASE_URL + '/api/organizations');
        organizationsData = await response.json();
    } catch (error) {
        console.error('Could not load organizations from the server:', error);
        organizationsData = [];
    }
    initOrganizationsPageUI();
    initHomeFeaturedUI();
    refreshAnnouncementOrgOptions();
    renderManageAnnouncements();
}

// Organization Cards: converts stored category value into displayed text in teh frontend
// Any new category added only needs to update this lookup
const categoryLabels = {
    academic: 'Academic',
    arts: 'Arts and Design',
    journalism: 'Journalism',
    sports: 'Sports',
    technology: 'Technology',
};

function getCategoryLabel(category) {
    return categoryLabels[category] || category;
}

function createOrganizationCardHTML(org) {
    // Admin-approved orgs shouldn't have photos/links yet so fall back to safe defaults
    const photo = org.photo || 'assets/no-image.svg';
    const link = org.link || 'organizations.html';

    return '<article class="organization-card" data-category="' + org.category + '">' + 
        '<img class="org-photo" src="' + photo + '" alt="' + escapeHtml(org.name) + ' logo" ' + 
        'style="width: 100%; height: 200px; object-fit: contain; display: block;">' + 
        '<div class="org-body">' +
            '<h3 class="org-title">' + escapeHtml(org.name) + '</h3>' +
            '<p class="org-category">' + getCategoryLabel(org.category) + '</p>' +
            '<p class="org-description">' + escapeHtml(org.description) + '</p>' +
            '<a class="org-link" href="' + link + '">View Organization</a>' +
        '</div>' +
    '</article>';
}

// HOME/LANDING PAGE: Featured Organizations (shows the first 2 organizations from the backend)
function createFeaturedOrgHTML(org) {
    const photo = org.photo || 'assets/no-image.svg';
    const link = org.link || 'organizations.html';

    return '<div class="feat-child">' +
        '<div class="org-photo">' +
            '<img class="org-photo" src="' + photo + '" alt="' + escapeHtml(org.name) + ' img">' +
        '</div>' +
        '<div class="org-details">' +
            '<p class="org-title">' + escapeHtml(org.name) + '</p>' +
            '<p class="org-desc">' + escapeHtml(org.description) + '</p>' +
            '<a class="org-link" href="' + link + '">View More</a>' +
        '</div>' +
    '</div>';
}

function initHomeFeaturedUI() {
    const container = document.querySelector('.home-featured-orgs-con');
    if (!container) return;   // not on the home page, do nothing
    container.innerHTML = organizationsData.slice(0, 2).map(createFeaturedOrgHTML).join('');
}

// ORGANIZATIONS PAGE: render + search/filter
const searchInput = document.getElementById('organization-search');
const categorySelect = document.getElementById('category');
const organizationsListEl = document.getElementById('organizations-list');
const noResultsMessage = document.getElementById('no-results-message');

function initOrganizationsPageUI() {
    if (!(searchInput && categorySelect && organizationsListEl)) return;

    // Takes a filtered array and rebuilds the visible list from scratch
    // Removes the old HTML and builds new HTML from whatever data matches
    function renderOrganizations(orgsToShow) {
        organizationsListEl.innerHTML = orgsToShow.map(createOrganizationCardHTML).join('');
        noResultsMessage.style.display = orgsToShow.length === 0 ? 'block' : 'none';
    }

    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCategory = categorySelect.value;

        const filtered = organizationsData.filter(function (org) {
            const matchesSearch =
                org.name.toLowerCase().includes(searchTerm) ||
                org.description.toLowerCase().includes(searchTerm);

            const matchesCategory =
                selectedCategory === 'all' ||
                org.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        renderOrganizations(filtered);
    }

    // Shows every organization
    renderOrganizations(organizationsData);

    searchInput.addEventListener('input', applyFilters);
    categorySelect.addEventListener('change', applyFilters);

    searchInput.closest('form').addEventListener('submit', function (event) {
        event.preventDefault();
        applyFilters();
    });
}

fetchOrganizations();

// Shared helper: looks up an org's display name + link from its id
// Early declaration because the Officer dashboard section below needs
// announcementsData to already exist the moment the page loads
function getOrgDisplayInfo(orgId) {
    const fallbackOrganizations = {
        universe: { name: 'UniVerse', link: 'organizations.html' },
        'digital-fort': { name: 'The Digital Fort', link: 'digital-fort.html' },
        'disenyo-malaya': { name: 'Disenyo Malaya', link: 'disenyo-malaya.html' },
        'scholars-club': { name: 'Scholars Club', link: 'scholars-club.html' }
    };
    if (fallbackOrganizations[orgId]) return fallbackOrganizations[orgId];
    const org = organizationsData.find(function (o) { return o.id === orgId; });
    if (org) return { name: org.name, link: org.link || 'organizations.html' };

    // A public announcement response may contain the organization's display name
    // before the separate organizations request has completed.
    const matchingAnnouncement = typeof announcementsData !== 'undefined'
        ? announcementsData.find(function (item) { return item.org === orgId && item.organizationName; })
        : null;
    if (matchingAnnouncement) {
        return { name: matchingAnnouncement.organizationName, link: matchingAnnouncement.organizationLink || 'organizations.html' };
    }
    return { name: 'Unknown Organization', link: 'organizations.html' };
}

// DASHBOARD: role-based access control (RBAC)
const dashboardWrapper = document.querySelector('.dashboard-tabs-wrapper');

if (dashboardWrapper) {
    const authUserRaw = localStorage.getItem('authUser');

    if (!authUserRaw) {
        window.location.href = 'login.html';
    } else {
        const authUser = JSON.parse(authUserRaw);

        const dashboardUserInfo = document.getElementById('dashboard-user-info');
        if (dashboardUserInfo) {
            dashboardUserInfo.textContent = authUser.name + ' \u00b7 ' + authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1);
        }

        const panelsByRole = {
            student: document.getElementById('panel-student'),
            officer: document.getElementById('panel-officer'),
            admin: document.getElementById('panel-admin'),
        };

        Object.keys(panelsByRole).forEach(function (role) {
            const panel = panelsByRole[role];
            if (!panel) return;
            panel.style.display = role === authUser.role ? 'block' : 'none';
        });
    }
}

const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', function () {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        window.location.href = 'login.html';
    });
}

// Dashboard Org Officer Quick Acts, get enter to work when a quick act option is focused on for keyboard accessiblity
const quickActionLabels = document.querySelectorAll('#quick-act-tabs label');

if (quickActionLabels.length > 0) {
    quickActionLabels.forEach(function (label) {
        label.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();

                const targetRadioId = label.getAttribute('for');
                const targetRadio = document.getElementById(targetRadioId);

                if (targetRadio) {
                    targetRadio.checked = true;
                    targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
    });
}

// ANNOUNCEMENTS: use the backend as the shared source of truth.
const defaultAnnouncementsData = [
    {
        id: 'org-registrations',
        org: 'universe',
        title: 'Organization Registrations Are Now Open!',
        postedDate: 'Posted on Sep 6, 2026',
        content: [
            'Students may now browse and join registered organizations through UniVerse!',
            'Explore the available student organizations, learn more about their activities and events, and discover opportunities to get involved in the university community.',
            'Whether you are interested in journalism, arts and design, academics, or other student activities, UniVerse makes it easier to discover organizations that match your interests.'
        ]
    },
    {
        id: 'news-writing-workshop',
        org: 'digital-fort',
        title: 'News Writing Workshop',
        postedDate: 'Posted on Sep 12, 2026',
        content: [
            'The Digital Fort will be holding a writing workshop for students interested in journalism, and content and news writing.',
            'The session will cover the basics of campus reporting, interviewing techniques, and editorial writing. All beginners are welcome.',
            'Slots are limited so register early to secure a spot!'
        ]
    },
    {
        id: 'design-exhibition',
        org: 'disenyo-malaya',
        title: 'Design Exhibition Submissions Are Open!',
        postedDate: 'Posted on Sep 7, 2026',
        content: [
            'Calling all creatives! Students may submit their artwork for a chance to showcase it on the upcoming campus design exhibition on September 18, Friday.',
            'The theme is "Digital Consumption". Interpret and present it however you like, whether through illustration, UI/UX mockups, or mixed media.',
            'Submissions are open to all students, regardless of course or year level.'
        ]
    },
    {
        id: 'leadership-workshop',
        org: 'scholars-club',
        title: 'Leadership Workshop Registration',
        postedDate: 'Posted on Sep 6, 2026',
        content: [
            'Registration is now open on Scholars Club\'s webpage for the upcoming leadership development workshop.',
            'The workshop covers essential skills for scholars taking on peer mentor and leadership roles across the university.',
            'Do take note that seats are limited to keep the session hands-on and interactive.'
        ]
    }
];

function normalizeAnnouncementRecord(record) {
    const content = Array.isArray(record.content)
        ? record.content.map(function (part) { return String(part || '').trim(); }).filter(Boolean)
        : String(record.content || '').split(/\n\s*\n/).map(function (part) { return part.trim(); }).filter(Boolean);

    return {
        id: String(record.id),
        org: record.org || record.organizationId || 'universe',
        organizationName: record.organizationName || null,
        organizationLink: record.organizationLink || null,
        title: String(record.title || ''),
        postedDate: record.postedDate || 'Posted on ' + new Date(record.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
        content: content.length ? content : ['']
    };
}

let announcementsData = defaultAnnouncementsData.map(normalizeAnnouncementRecord);

async function loadAnnouncementsFromAPI() {
    try {
        const response = await fetch(API_BASE_URL + '/api/announcements');
        if (!response.ok) throw new Error('Announcements API returned ' + response.status);
        const records = await response.json();
        announcementsData = records.map(normalizeAnnouncementRecord);
    } catch (error) {
        console.error('Could not load announcements from the server. Using demo announcements for display:', error);
        announcementsData = defaultAnnouncementsData.map(normalizeAnnouncementRecord);
    }
    refreshAnnouncementOrgOptions();
    return announcementsData;
}

const announcementsLoaded = loadAnnouncementsFromAPI();

function refreshAnnouncementOrgOptions() {
    const organizations = [
        { id: 'universe', name: 'UniVerse' }
    ].concat(organizationsData.map(function (org) {
        return { id: org.id, name: org.name };
    }));

    const uniqueOrganizations = organizations.filter(function (org, index, list) {
        return list.findIndex(function (candidate) { return candidate.id === org.id; }) === index;
    });

    const publicSelect = document.getElementById('announcement-organization');
    if (publicSelect) {
        const previousValue = publicSelect.value || 'all';
        const publicOptions = [{ id: 'all', name: 'All Organizations' }].concat(uniqueOrganizations);
        publicSelect.innerHTML = publicOptions.map(function (org) {
            return '<option value="' + escapeHtml(org.id) + '">' + escapeHtml(org.name) + '</option>';
        }).join('');
        publicSelect.value = publicOptions.some(function (org) { return org.id === previousValue; }) ? previousValue : 'all';
    }

    const dashboardSelect = document.querySelector('#panel-new-announce select[name="announce-org"]');
    if (dashboardSelect) {
        const previousDashboardValue = dashboardSelect.value || 'universe';
        dashboardSelect.innerHTML = uniqueOrganizations.map(function (org) {
            return '<option value="' + escapeHtml(org.id) + '">' + escapeHtml(org.name) + '</option>';
        }).join('');
        dashboardSelect.value = uniqueOrganizations.some(function (org) { return org.id === previousDashboardValue; }) ? previousDashboardValue : 'universe';
    }
}

// Public listing page: render, search, and filter.
function createAnnouncementCardHTML(announcement) {
    const orgInfo = getOrgDisplayInfo(announcement.org);
    const shortDescription = announcement.content[0] || '';
    const detailUrl = 'announcement-details.html?id=' + encodeURIComponent(announcement.id);

    return '<article class="announcement-card" data-id="' + escapeHtml(announcement.id) + '" data-org="' + escapeHtml(announcement.org) + '">' +
        '<div class="announcement-body">' +
            '<p class="announcement-category">' + escapeHtml(orgInfo.name.toUpperCase()) + '</p>' +
            '<h3 class="announcement-title"><a href="' + detailUrl + '">' + escapeHtml(announcement.title) + '</a></h3>' +
            '<p class="announcement-date">' + escapeHtml(announcement.postedDate) + '</p>' +
            '<p class="announcement-description">' + escapeHtml(shortDescription) + '</p>' +
            '<a class="announcement-link" href="' + detailUrl + '">Read Announcement</a>' +
        '</div>' +
    '</article>';
}

const announcementSearchInput = document.getElementById('announcement-search');
const announcementOrgSelect = document.getElementById('announcement-organization');
const announcementsListEl = document.getElementById('announcements-list');
const noAnnouncementsMessage = document.getElementById('no-announcements-message');

if (announcementSearchInput && announcementOrgSelect && announcementsListEl) {
    function renderAnnouncements(announcementsToShow) {
        announcementsListEl.innerHTML = announcementsToShow.map(createAnnouncementCardHTML).join('');
        if (noAnnouncementsMessage) {
            noAnnouncementsMessage.style.display = announcementsToShow.length === 0 ? 'block' : 'none';
        }
    }

    function applyAnnouncementFilters() {
        const searchTerm = announcementSearchInput.value.trim().toLowerCase();
        const selectedOrg = announcementOrgSelect.value;

        const filtered = announcementsData.filter(function (announcement) {
            const orgInfo = getOrgDisplayInfo(announcement.org);
            const searchableContent = announcement.content.join(' ').toLowerCase();
            const matchesSearch = announcement.title.toLowerCase().includes(searchTerm) ||
                searchableContent.includes(searchTerm) ||
                orgInfo.name.toLowerCase().includes(searchTerm);
            const matchesOrg = selectedOrg === 'all' || announcement.org === selectedOrg;
            return matchesSearch && matchesOrg;
        });

        renderAnnouncements(filtered);
    }

    announcementsLoaded.then(applyAnnouncementFilters);
    announcementSearchInput.addEventListener('input', applyAnnouncementFilters);
    announcementOrgSelect.addEventListener('change', applyAnnouncementFilters);

    const announcementFilterForm = announcementSearchInput.closest('form');
    if (announcementFilterForm) {
        announcementFilterForm.addEventListener('submit', function (event) {
            event.preventDefault();
            applyAnnouncementFilters();
        });
    }
}

// Homepage: show the latest two announcements and include their IDs in detail links.
function initHomeRecentAnnouncements() {
    const container = document.querySelector('.home-recent-announce-con');
    if (!container) return;

    container.innerHTML = announcementsData.slice(0, 2).map(function (announcement) {
        const detailUrl = 'announcement-details.html?id=' + encodeURIComponent(announcement.id);
        const orgInfo = getOrgDisplayInfo(announcement.org);
        return '<a href="' + detailUrl + '">' +
            '<div class="recent-ann">' +
                '<div class="announce-header">' +
                    '<p class="announce-title">' + escapeHtml(announcement.title) + '</p>' +
                    '<p class="announce-date">' + escapeHtml(announcement.postedDate.replace(/^Posted on /, '')) + '</p>' +
                '</div>' +
                '<p class="announce-desc">' + escapeHtml(announcement.content[0] || '') + '</p>' +
            '</div>' +
        '</a>';
    }).join('');
}
announcementsLoaded.then(initHomeRecentAnnouncements);

// Detail page: load the requested announcement by its ?id= query parameter.
const announcementDetailArticle = document.querySelector('.announcement-detail');
if (announcementDetailArticle) {
    announcementsLoaded.then(function () {
        const params = new URLSearchParams(window.location.search);
        const requestedId = params.get('id');
        const announcement = announcementsData.find(function (item) { return item.id === requestedId; });

        const label = document.querySelector('.announcement-label');
        const title = document.querySelector('.announcement-detail-title');
        const meta = document.querySelector('.announcement-meta');
        const metaSpans = document.querySelectorAll('.announcement-meta span');
        const contentContainer = document.querySelector('.announcement-detail-content');

        if (announcement) {
            const orgInfo = getOrgDisplayInfo(announcement.org);
            label.textContent = orgInfo.name.toUpperCase();
            title.textContent = announcement.title;
            meta.style.display = '';
            metaSpans[0].textContent = announcement.postedDate;
            metaSpans[1].textContent = 'Posted by ' + orgInfo.name;
            contentContainer.replaceChildren();

            announcement.content.forEach(function (paragraphText) {
                const paragraph = document.createElement('p');
                paragraph.textContent = paragraphText;
                contentContainer.appendChild(paragraph);
            });

            const linkParagraph = document.createElement('p');
            linkParagraph.appendChild(document.createTextNode('Visit '));
            const link = document.createElement('a');
            link.href = orgInfo.link;
            link.textContent = orgInfo.name;
            linkParagraph.appendChild(link);
            linkParagraph.appendChild(document.createTextNode(' to learn more.'));
            contentContainer.appendChild(linkParagraph);
        } else {
            label.textContent = 'ANNOUNCEMENT';
            title.textContent = 'Announcement Not Found';
            meta.style.display = 'none';
            contentContainer.innerHTML = '<p>We couldn\'t find the announcement you were looking for. It may have been removed or the link may be incorrect.</p>';
        }
    });
}



// Join + Leave orgs
// Runs on organization profile pages
const joinButton = document.querySelector('#org-profile-banner .join-button');

if (joinButton) {
    const orgId = document.body.dataset.org;
    const authToken = localStorage.getItem('authToken');

    function setJoinedState(isJoined) {
        joinButton.textContent = isJoined ? 'Joined' : 'Join Organization';
        joinButton.classList.toggle('joined', isJoined);
    }

    // On page load: asks the server whether the user has already joined that particular org
    if (authToken) {
        fetch(API_BASE_URL + '/api/users/me/organizations', {
            headers: { Authorization: 'Bearer ' + authToken }
        })
            .then(function (response) { return response.json(); })
            .then(function (myOrgs) {
                const alreadyJoined = Array.isArray(myOrgs) && myOrgs.some(function (org) {
                    return org.id === orgId;
                });
                setJoinedState(alreadyJoined);
            })
            .catch(function (error) {
                console.error('Could not check membership:', error);
            });
    }

    joinButton.addEventListener('click', async function (event) {
        event.preventDefault();

        // Not logged in: sends user to the login page instead
        if (!authToken) {
            window.location.href = 'login.html';
            return;
        }

        const isJoined = joinButton.classList.contains('joined');
        const action = isJoined ? 'leave' : 'join';

        try {
            const response = await fetch(API_BASE_URL + '/api/organizations/' + orgId + '/' + action, {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + authToken }
            });

            if (response.ok) {
                setJoinedState(!isJoined);
            } else if (response.status === 401) {
                // Token expired or invalid: log out and ask them to sign in again
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                window.location.href = 'login.html';
            } else {
                console.error('Join/Leave failed with status', response.status);
            }
        } catch (error) {
            console.error('Could not reach the server:', error);
        }
    });
}

// AUTH: Login + Register
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authErrorMessage = document.getElementById('auth-error-message');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

function showAuthError(message) {
    authErrorMessage.textContent = message;
    authErrorMessage.style.display = 'block';
}

function clearAuthError() {
    authErrorMessage.style.display = 'none';
}

if (showRegisterLink && showLoginLink) {
    showRegisterLink.addEventListener('click', function (event) {
        event.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        clearAuthError();
    });

    showLoginLink.addEventListener('click', function (event) {
        event.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        clearAuthError();
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        clearAuthError();

        const email = loginForm.querySelector('[name="login-email"]').value.trim();
        const password = loginForm.querySelector('[name="login-password"]').value;

        try {
            const response = await fetch(API_BASE_URL + '/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                showAuthError(data.error || 'Login failed.');
                return;
            }

            localStorage.setItem('authToken', data.token);
            localStorage.setItem('authUser', JSON.stringify(data.user));

            window.location.href = 'dashboard.html';
        } catch (error) {
            showAuthError('Could not reach the server. Is the backend running?');
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        clearAuthError();

        const name = registerForm.querySelector('[name="register-name"]').value.trim();
        const email = registerForm.querySelector('[name="register-email"]').value.trim();
        const password = registerForm.querySelector('[name="register-password"]').value;

        try {
            const response = await fetch(API_BASE_URL + '/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                showAuthError(data.error || 'Registration failed.');
                return;
            }

            // Registered successfully
            const loginResponse = await fetch(API_BASE_URL + '/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const loginData = await loginResponse.json();

            localStorage.setItem('authToken', loginData.token);
            localStorage.setItem('authUser', JSON.stringify(loginData.user));

            window.location.href = 'dashboard.html';
        } catch (error) {
            showAuthError('Could not reach the server. Check if the backend running');
        }
    });
}


// HOMEPAGE: Load upcoming rvents from the backend
async function initHomeUpcomingEvents() {
    const upcomingEventsContainer = document.querySelector('.home-upcoming-events-con');
    if (!upcomingEventsContainer) return;

    try {
        const response = await fetch(API_BASE_URL + '/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const events = await response.json();

        const upcomingEvents = events.slice(0, 3);

        if (upcomingEvents.length === 0) {
            upcomingEventsContainer.innerHTML = '<p style="text-align: center; color: #666;">No recent events at the moment.</p>';
            return;
        }

        upcomingEventsContainer.innerHTML = upcomingEvents.map(event => {
            const photo = event.eventPhotoUrl || 'assets/no-image.svg';
            const detailUrl = `event-details.html?id=${encodeURIComponent(event.id)}`;
            const location = event.location || 'No location indicated';

            const startDate = new Date(event.startDate);
            const endDate = event.endDate ? new Date(event.endDate) : null;
            
            const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
            let dateString = startFormatted;
            
            if (endDate && startDate.toDateString() !== endDate.toDateString()) {
                const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
                dateString = `${startFormatted} – ${endFormatted}`;
            }

            return `
                <a href="${detailUrl}" class="up-child" style="text-decoration: none; color: inherit; display: block;">
                    <img class="event-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(event.name)}">
                    <div class="event-details">
                        <p class="event-title">${escapeHtml(event.name)}</p>
                        <div class="event-location">
                            <img src="assets/location-gray-thin.svg" alt="">
                            <span>${escapeHtml(location)}</span>
                        </div>
                        <div class="event-date" style="display: flex; align-items: center; gap: 6px;">
                            <img src="assets/date-gray-thin.svg" alt="">
                            <span>${escapeHtml(dateString)}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');

    } catch (error) {
        console.error('Could not load homepage upcoming events:', error);
    }
}

initHomeUpcomingEvents();


//EVENTS PAGE: fetching search categories from db
async function loadEventCategoriesDropdown() {
    const eventCategorySelect = document.getElementById('event-category');
    if (!eventCategorySelect) return;

    try {
        const response = await fetch(API_BASE_URL + '/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const categories = await response.json();

        const previousValue = eventCategorySelect.value || 'all';
        let optionsHTML = '<option value="all">All Event Types</option>';
        
        categories.forEach(function (cat) {
            optionsHTML += '<option value="' + escapeHtml(cat.id) + '">' + escapeHtml(cat.text) + '</option>';
        });

        eventCategorySelect.innerHTML = optionsHTML;
        eventCategorySelect.value = Array.from(eventCategorySelect.options).some(opt => opt.value === previousValue) ? previousValue : 'all';
    } catch (error) {
        console.error('Could not load event categories:', error);
        
        const eventCategorySelect = document.getElementById('event-category');
        if (eventCategorySelect) {
            eventCategorySelect.innerHTML = '<option value="all">All Event Types</option>';
            const errorOption = document.createElement('option');
            errorOption.value = "";
            errorOption.disabled = true;
            errorOption.textContent = "Failed to load categories";
            eventCategorySelect.appendChild(errorOption);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    loadEventCategoriesDropdown();
});


//EVENTS PAGE: loading events list in events.html
async function loadEventCards(retryCount = 1) {
    const eventsListContainer = document.getElementById('events-list');
    
    if (!eventsListContainer) return;

    try {
        const response = await fetch(API_BASE_URL + '/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const events = await response.json();

        //so when user navigates to events.html for the first time, no events message wont display immediately due to delay of fetching info and no need to refresh
        if (events.length === 0 && retryCount > 0) {
            setTimeout(() => loadEventCards(retryCount - 1), 500);
            return;
        }

        if (events.length === 0) {
            eventsListContainer.innerHTML = '';
            if (noEventsMessage) noEventsMessage.style.display = 'block';
            return;
        }

        if (noEventsMessage) noEventsMessage.style.display = 'none';

        let htmlCards = '';

        events.forEach(event => {
            const status = event.status || 'No status indicated.';
            
            const categoryIds = event.categories.map(c => c.id).join(',');
            const coverPhoto = event.eventPhotoUrl || 'assets/no-image.svg';

            const startDate = new Date(event.startDate);
            const endDate = event.endDate ? new Date(event.endDate) : null;

            const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

            let dateString = startFormatted;

            if (endDate && startDate.toDateString() !== endDate.toDateString()) {
                const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                dateString = `${startFormatted} – ${endFormatted}`;
            }

            const location = event.location || 'No location indicated.';

            let categoriesHtml = '';
            event.categories.forEach((cat, index) => {
                if (index < 2) {
                    categoriesHtml += `<div class="event-category">${escapeHtml(cat.text.toUpperCase())}</div>`;
                }
            });
            if (event.categories.length > 2) {
                const extraCount = event.categories.length - 2;
                const tooltipText = event.categories.slice(2).map(c => c.text.toUpperCase()).join(', ');
                categoriesHtml += `<div class="event-category" tabindex="0" data-tooltip="${escapeHtml(tooltipText)}">+${extraCount}</div>`;
            }

            let orgsHtml = '';
            if (event.orgsRelated && event.orgsRelated.length > 0) {
                const mainOrg = event.orgsRelated[0];
                orgsHtml += `
                    <div class="event-org">
                        <img class="org-photo" src="${escapeHtml(mainOrg.photo || 'assets/no-image.svg')}" alt="">
                        <span class="event-org-name">${escapeHtml(mainOrg.name)}</span>
                    </div>
                `;
                if (event.orgsRelated.length > 1) {
                    orgsHtml += `
                        <div class="event-org">
                            <span class="event-org-name">+${event.orgsRelated.length - 1}</span>
                        </div>
                    `;
                }
            }

            htmlCards += `
                <article class="event-card" data-status="${status}" data-categories="${categoryIds}">
                    <div class="event-photo">
                        <img class="event-photo" src="${escapeHtml(coverPhoto)}" alt="${escapeHtml(event.name)}">
                        <div class="event-date">${escapeHtml(dateString)}
                            &nbsp;<div class="circle"></div>&nbsp;
                            <span class="event-status">${escapeHtml(status)}</span>
                        </div>
                    </div>
                    <div class="event-body">
                        <h3 class="event-title">${escapeHtml(event.name)}</h3>
                        <div class="event-categories">
                            ${categoriesHtml}
                        </div>
                        <p class="event-description">${escapeHtml(event.description)}</p>
                        <div class="event-details">
                            <!--<div>
                                <img class="event-detail-icon" src="assets/up_event_clock.svg" alt="">
                                <span>Varying</span>
                            </div>-->
                            <div class="event-location">
                                <img class="event-detail-icon" src="assets/up_event_location.svg" alt="">
                                <span>${escapeHtml(location)}</span>
                            </div>
                        </div>
                        <div class="event-footer">
                            <div class="event-orgs">
                                ${orgsHtml}
                            </div>
                            <a href="event-details.html?id=${encodeURIComponent(event.id)}">
                                <div class="view-details">View Details</div>
                            </a>
                        </div>
                    </div>
                </article>
            `;
        });

        eventsListContainer.innerHTML = htmlCards;
        requestAnimationFrame(() => {
            applyEventFilters();
        });

    } catch (error) {
        eventsListDidNotLoad();
        console.error('Could not load events:', error);
    }
}

function eventsListDidNotLoad() {
    const failedMessage = document.getElementById("events-failed-message");

    if (failedMessage) {
        failedMessage.style.display = 'block';
    }
}



//EVENT DETAILs PAGE: Fetch the clicked event's info
const eventBanner = document.getElementById("event-info-banner");
const eventContents = document.getElementById("event-info-content");

if (eventBanner && eventContents) {
    document.addEventListener('DOMContentLoaded', async () => {
        const params = new URLSearchParams(window.location.search);
        const requestedId = params.get('id');

        try {
            const response = await fetch(`${API_BASE_URL}/api/events/${requestedId}`);
            if (!response.ok) throw new Error('Failed to fetch event details');
            const event = await response.json();

            const eventTitle = document.querySelector('#event-info-banner .page-title');
            const eventDesc = document.querySelector('#event-info-banner .desc');
            const eventStatus = document.querySelector('#event-info-banner .event-status');
            const eventDateSpan = document.querySelector('#event-info-banner .event-date span');
            const eventCategories = document.querySelector('#event-info-banner .event-categories');
            const eventSchedules = document.getElementById('schedules-list');
            const eventGalleryContainer = document.querySelector('#event-gallery .gallery-con');
            const eventOrgsContainer = document.querySelector('.involved-orgs');

            if (eventBanner) {
                if (eventTitle) eventTitle.textContent = event.name;
                if (eventDesc) eventDesc.textContent = event.description;
                if (eventStatus) {
                    const statusText = event.status || 'No status indicated';
                    eventStatus.innerHTML = `<div class="circle"></div>${escapeHtml(statusText)}`;
                }
                
                if (eventDateSpan) {
                    const eventStartDate = new Date(event.startDate);
                    const eventEndDate = event.endDate ? new Date(event.endDate) : null;
                    const startFormatted = eventStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
                    let dateString = startFormatted;
                    if (eventEndDate && eventStartDate.toDateString() !== eventEndDate.toDateString()) {
                        const endFormatted = eventEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
                        dateString = `${startFormatted} – ${endFormatted}`;
                    }

                    eventDateSpan.textContent = dateString;
                }

                if (eventCategories){
                    eventCategories.innerHTML = event.categories.map(cat => 
                        `<p class="event-info-category">${escapeHtml(cat.text)}</p>`
                    ).join('');
                }

            }

            if (eventContents){
                if (eventSchedules){
                    const uniqueDates = [...new Set(event.schedules.map(sched => new Date(sched.date).toISOString().split('T')[0]))];
                    const eventDaysHtml = uniqueDates.map(dateKey => {
                    
                        const daySchedules = event.schedules.filter(sched => 
                            new Date(sched.date).toISOString().split('T')[0] === dateKey
                        );

                        const formattedDate = new Date(dateKey).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' , timeZone: 'UTC'});

                        const logsHtml = daySchedules.map(sched => {
                            let timeString = 'No time indicated';
                            if (sched.startTime && sched.endTime) {
                                const start = new Date(sched.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
                                const end = new Date(sched.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
                                timeString = `${start} – ${end}`;
                            }

                            return `
                                <div class="event-log">
                                    <h2 class="log-title">${escapeHtml(sched.title)}</h2>
                                    <div class="event-details">
                                        <div class="event-time">
                                            <img src="assets/up_event_clock.svg" alt="">
                                            <span>${escapeHtml(timeString)}</span>
                                        </div>
                                        <div class="event-time">
                                            <img src="assets/up_event_location.svg" alt="">
                                            <span>${escapeHtml(sched.location || event.location || 'No location Indicated')}</span>
                                        </div>
                                    </div>
                                    <span>${escapeHtml(sched.description || '')}</span>
                                </div>
                            `;
                        }).join('');

                        
                        return `
                            <div class="event-day">
                                <div class="event-date">
                                    <img src="assets/date-content.svg" alt="">
                                    <span>${escapeHtml(formattedDate)}</span>
                                </div>
                                <div class="event-logs">
                                    ${logsHtml}
                                </div>
                            </div>
                        `;
                    }).join('');

                    eventSchedules.innerHTML = eventDaysHtml;
                }

                if (eventGalleryContainer) {
                    const galleryHtml = event.galleryPhotos.map(photo => {
                        return `
                            <div class="gallery-child">
                                <img src="${escapeHtml(photo.photoUrl || "assets/no-image.svg")}" alt="${escapeHtml(photo.caption || event.name)}">
                                <div class="overlay"></div>
                                <span>${escapeHtml(photo.caption || '')}</span>
                            </div>
                        `;
                    }).join('');

                    eventGalleryContainer.innerHTML = galleryHtml;
                }
            }

            if (eventOrgsContainer) {
                const orgsHtml = event.orgsRelated.map(org => {
                    const orgLink = org.link || `${org.id}.html`;
                    const orgPhoto = org.photo || org.photoUrl || 'assets/no-image.svg';

                    return `
                        <a href="${escapeHtml(orgLink)}">
                            <div class="involved-org">
                                <img class="org-photo" src="${escapeHtml(orgPhoto)}" alt="">
                                <span class="event-org-name">${escapeHtml(org.name)}</span>
                            </div>
                        </a>
                    `;
                }).join('');

                eventOrgsContainer.innerHTML = orgsHtml;
            }

        } catch (error) {
            eventDetailsNotFound();
            console.error('Error loading event detail data:', error);
        }
    });
}

function eventDetailsNotFound() {
    const eventTitle = document.querySelector('#event-info-banner .page-title');
    const eventDesc = document.querySelector('#event-info-banner .desc');
    const eventContentsDiv = document.getElementById('event-info-content');

    if (eventTitle) eventTitle.textContent = 'Event Not Found';
    if (eventDesc) eventDesc.textContent = 'We couldn’t find the event you were looking for. It may have been removed or the link is incorrect.';
    if (eventContentsDiv) {
        eventContentsDiv.innerHTML = '<p>Please return to the events page and select a valid event.<a href="events.html"> &nbsp;Back to Events</a></p>';
    }
}


// EVENTS PAGE: Search + Filter Events
const eventSearch = document.getElementById('event-search');
const eventCategorySelect = document.getElementById('event-category');
const eventCards = document.querySelectorAll('.event-card');
const noEventsMessage = document.getElementById('no-events-message');
const statusFilterButtons = document.querySelectorAll('.event-status-filter');

let selectedStatus = 'all';

function applyEventFilters() {
    if (!eventSearch || !eventCategorySelect) return;
    
    const searchTerm = eventSearch.value.trim().toLowerCase();
    const selectedCategory = eventCategorySelect.value;
    const currentEventCards = document.querySelectorAll('.event-card');

    let visibleCount = 0;

    currentEventCards.forEach(function (card) {
        const title = card.querySelector('.event-title').textContent.toLowerCase();
        const description = card.querySelector('.event-description').textContent.toLowerCase();

        const cardCategories = card.dataset.categories
            ? card.dataset.categories.split(',').map(c => c.trim().toLowerCase())
            : [];

        const cardStatus = card.dataset.status
            ? card.dataset.status.trim().toLowerCase()
            : '';

        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || cardCategories.includes(selectedCategory.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || cardStatus === selectedStatus.toLowerCase();

        const shouldShow = matchesSearch && matchesCategory && matchesStatus;

        if (shouldShow) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    if (noEventsMessage) {
        noEventsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

function initEventsPage() {
    loadEventCards();

    if (eventSearch) {
        eventSearch.addEventListener('input', applyEventFilters);
    }
    if (eventCategorySelect) {
        eventCategorySelect.addEventListener('change', applyEventFilters);
    }

    statusFilterButtons.forEach(function (button) {
        function selectFilter() {
            statusFilterButtons.forEach(function (btn) {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            selectedStatus = button.dataset.value;
            applyEventFilters();
        }

        button.addEventListener('click', selectFilter);

        button.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectFilter();
            }
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEventsPage);
} else {
    initEventsPage();
}



// DASHBOARD: "My Organizations" - fetched from the backend for the logged-in user
const myOrganizationsList = document.getElementById('my-organizations-list');

if (myOrganizationsList) {
    const noJoinedOrgsMessage = document.getElementById('no-joined-orgs-message');
    const dashboardAuthToken = localStorage.getItem('authToken');

    if (dashboardAuthToken) {
        fetch(API_BASE_URL + '/api/users/me/organizations', {
            headers: { Authorization: 'Bearer ' + dashboardAuthToken }
        })
            .then(function (response) {
                if (response.status === 401) {
                    // If token expired or invalid: sign out and go back to login
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('authUser');
                    window.location.href = 'login.html';
                    return null;
                }
                return response.json();
            })
            .then(function (myOrgs) {
                if (!myOrgs) return;
                myOrganizationsList.innerHTML = myOrgs.map(createOrganizationCardHTML).join('');
                noJoinedOrgsMessage.style.display = myOrgs.length === 0 ? 'block' : 'none';
            })
            .catch(function (error) {
                console.error('Could not load your organizations:', error);
            });
    }
}

// ADMIN: registration requests + manage organizations
const requestList = document.getElementById('request-list');
const noRequestsMessage = document.getElementById('no-requests-message');
const pendingCountEl = document.getElementById('pending-requests-count');
const adminOrgList = document.getElementById('admin-org-list');

// Helper: calls the backend with the admin's token attached
// If the token is bad/expired (401), it should log out and go to the login page
async function adminFetch(path, options) {
    options = options || {};
    options.headers = Object.assign(
        { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') },
        options.headers || {}
    );

    const response = await fetch(API_BASE_URL + path, options);

    if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        window.location.href = 'login.html';
        throw new Error('Session expired');
    }

    const data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || 'Something went wrong');
    return data;
}

function createRequestCardHTML(request) {
    return '<div class="request-card" data-id="' + request.id + '">' +
        '<div class="request-info">' +
            '<p class="request-title">' + escapeHtml(request.name) + '</p>' +
            '<p class="request-meta">' + getCategoryLabel(request.category) + ' \u00b7 Submitted by ' + escapeHtml(request.submittedBy || 'Unknown') + '</p>' +
        '</div>' +
        '<div class="request-actions">' +
            '<a href="#" class="button join-button request-approve">Approve</a>' +
            '<a href="#" class="button light-button request-reject">Reject</a>' +
        '</div>' +
    '</div>';
}

function createAdminOrgListItemHTML(org) {
    return '<li data-id="' + org.id + '">' +
        '<div class="manage-item-main">' +
            '<span>' + escapeHtml(org.name) + ' - ' + getCategoryLabel(org.category) + '</span>' +
            '<span class="manage-actions">' +
                '<a href="' + (org.link || 'organizations.html') + '" class="manage-action">View </a>' +
                '<a href="#" class="manage-action manage-action-danger">Remove</a>' +
            '</span>' +
        '</div>' +
    '</li>';
}

async function loadAdminRequests() {
    const requests = await adminFetch('/api/admin/requests');
    requestList.innerHTML = requests.map(createRequestCardHTML).join('');
    if (pendingCountEl) pendingCountEl.textContent = requests.length;
    if (noRequestsMessage) noRequestsMessage.style.display = requests.length === 0 ? 'block' : 'none';
}

async function loadAdminOrganizations() {
    // The route is public so a simple fetch is used
    const response = await fetch(API_BASE_URL + '/api/organizations');
    const orgs = await response.json();
    adminOrgList.innerHTML = orgs.map(createAdminOrgListItemHTML).join('');
}

async function loadAdminStats() {
    const stats = await adminFetch('/api/admin/stats');

    const orgsEl = document.getElementById('stat-organizations');
    const usersEl = document.getElementById('stat-users');

    if (orgsEl) orgsEl.textContent = stats.organizations;
    if (usersEl) usersEl.textContent = stats.students;
}

// Only runs on the dashboard and only for admins (other roles would get a 403)
let adminUser = null;
try { adminUser = JSON.parse(localStorage.getItem('authUser')); } catch (e) {}

if (requestList && adminOrgList && adminUser && adminUser.role === 'admin') {
    loadAdminRequests().catch(function (error) { console.error(error); });
    loadAdminOrganizations().catch(function (error) { console.error(error); });
    loadAdminStats().catch(function (error) { console.error(error); });

    requestList.addEventListener('click', async function (event) {
        const approveClicked = event.target.classList.contains('request-approve');
        const rejectClicked = event.target.classList.contains('request-reject');
        if (!approveClicked && !rejectClicked) return;

        event.preventDefault();
        const requestId = event.target.closest('.request-card').dataset.id;
        const action = approveClicked ? 'approve' : 'reject';

        try {
            await adminFetch('/api/admin/requests/' + requestId + '/' + action, { method: 'POST' });
            await loadAdminRequests();
            await loadAdminOrganizations();
            await loadAdminStats();
        } catch (error) {
            alert(error.message);   // i.e., "An organization with this name already exists"
        }
    });

    adminOrgList.addEventListener('click', async function (event) {
        if (!event.target.classList.contains('manage-action-danger')) return;

        event.preventDefault();
        const li = event.target.closest('li');
        if (!confirm('Remove this organization? This cannot be undone.')) return;

        try {
            await adminFetch('/api/organizations/' + li.dataset.id, { method: 'DELETE' });
            await loadAdminOrganizations();
            await loadAdminStats();
        } catch (error) {
            alert(error.message);
        }
    });
}

// Small helper so typed text never breaks the HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/"/g, '&quot;');
}


let categoriesData = [];

async function fetchCategories() {
    try {
        const response = await fetch(API_BASE_URL + '/api/categories');
        categoriesData = await response.json();
    } catch (error) {
        console.error('Could not load categories from the server:', error);
        categoriesData = [];
    }
}
fetchCategories();



let officerEventsData = [];
let currentUserOrgIds = [];
const manageEventsList = document.getElementById('manage-events-list');

async function loadOfficerEvents() {
    if (!manageEventsList) return;
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
        // need to fetch all events and the user's organizations too in order to not load any events that are not the user's responsibility
        const [eventsResponse, myOrgsResponse] = await Promise.all([
            fetch(API_BASE_URL + '/api/events'),
            fetch(API_BASE_URL + '/api/users/me/organizations', {
                headers: { Authorization: 'Bearer ' + authToken }
            })
        ]);

        if (!eventsResponse.ok || !myOrgsResponse.ok) {
            throw new Error('Failed to fetch officer events data');
        }

        const allEvents = await eventsResponse.json();
        const myOrgs = await myOrgsResponse.json();
        const myOrgIds = myOrgs.map(org => org.id);
        currentUserOrgIds = myOrgIds;

        renderNewEventOrgCheckboxes();

        const managedEvents = allEvents.filter(event => {
            if (!event.orgsRelated || event.orgsRelated.length === 0) return false;
            return event.orgsRelated.some(org => myOrgIds.includes(org.id));
        });

        officerEventsData = managedEvents.map(event => ({
            id: event.id,
            name: event.name,
            description: event.description,
            status: event.status,
            dateStart: event.startDate ? event.startDate.split('T')[0] : '',
            dateEnd: event.endDate ? event.endDate.split('T')[0] : '',
            location: event.location,
            eventPhotoUrl: event.eventPhotoUrl,
            orgs: event.orgsRelated ? event.orgsRelated.map(o => o.id) : [],
            categories: event.categories ? event.categories.map(c => c.id) : [],
            schedules: event.schedules || [],
            galleryPhotos: event.galleryPhotos,
            postedDate: event.createdAt ? new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'No recorded creation date.'
        }));

        renderManageEvents();

    } catch (error) {
        console.error('Error loading officer events:', error);
        manageEventsList.innerHTML = '<p style="padding: 20px; text-align: center; color: red;">Failed to load your organization events.</p>';
    }
}

const eventsLoaded = loadOfficerEvents();

// Templates: turns an event/announcement object into HTML
function createScheduleBlockHTML(schedule) {
    return '<div class="schedule">' +
        '<div tabindex="0" class="remove-schedule">✕ &nbsp; Remove </div>' +
        '<div><h5>Schedule Title</h5>' +
            '<input type="text" name="schedule-title" placeholder="Enter schedule title..." value="' + escapeHtml(schedule.title) + '"></div>' +
        '<div class="inline-section">' +
            '<div class="inline-part"><h5>Schedule Date</h5><input type="date" name="schedule-date" value="' + schedule.date + '"></div>' +
            '<div class="inline-part"><h5>Start Time</h5><input type="time" name="schedule-start-time" value="' + schedule.startTime + '"></div>' +
            '<div class="inline-part"><h5>End Time</h5><input type="time" name="schedule-end-time" value="' + schedule.endTime + '"></div>' +
        '</div>' +
        '<div><h5>Schedule Location</h5>' +
            '<input type="text" name="schedule-location" placeholder="Enter schedule location..." value="' + escapeHtml(schedule.location) + '"></div>' +
        '<div><h5>Schedule Description</h5>' +
            '<textarea placeholder="Enter schedule description...">' + escapeHtml(schedule.description) + '</textarea></div>' +
    '</div>';
}

function createPhotoBlockHTML(photo) {
    return '<div class="photo" data-id="' + (photo.id || '') + '">' +
        '<div tabindex="0" class="remove-photo">✕ &nbsp; Remove </div>' +
        '<div><h5>Photo URL</h5>' +
            '<input type="text" name="photo-url" placeholder="Enter photo URL or asset path..." value="' + escapeHtml(photo.photoUrl || '') + '"></div>' +
        '<div><h5>Caption</h5>' +
            '<input type="text" name="photo-caption" placeholder="Enter photo caption..." value="' + escapeHtml(photo.caption || '') + '"></div>' +
    '</div>';
}

function createOrgCheckboxGridHTML(selectedOrgIds) {
    return '<div class="org-checkbox-grid">' +
        organizationsData.map(function (org) {
            const isUserOrg = currentUserOrgIds.includes(org.id);
            const isChecked = (selectedOrgIds.includes(org.id) || isUserOrg) ? ' checked' : '';
            const marker = isUserOrg ? ' user-owned-org' : '';
            
            return '<label class="org-checkbox-item' + marker + '" tabindex="0">' +
                '<input type="checkbox" tabindex="-1" name="orgs" value="' + org.id + '"' + isChecked + '>' +
                '<span>' + org.name + '</span>' +
            '</label>';
        }).join('') +
    '</div>';
}
function createCatCheckboxGridHTML(selectedCatIds) {
    return '<div class="cat-checkbox-grid">' +
        categoriesData.map(function (cat) {
            const isChecked = selectedCatIds.includes(cat.id) ? ' checked' : '';
            
            return '<label class="cat-checkbox-item" tabindex="0">' +
                '<input type="checkbox" tabindex="-1" name="cats" value="' + cat.id + '"' + isChecked + '>' +
                '<span>' + escapeHtml(cat.text) + '</span>' +
            '</label>';
        }).join('') +
    '</div>';
}

document.addEventListener('change', function (event) {
    const checkbox = event.target;
    
    if (checkbox.name === 'orgs') {
        const labelItem = checkbox.closest('.org-checkbox-item');
        
        if (labelItem && labelItem.classList.contains('user-owned-org') && !checkbox.checked) {
            checkbox.checked = true;
            alert("You cannot remove your own organization from an event you manage. Coordinate with other involved organizations to have your organization removed.");
        }
    }
});

// Dashboard org officer, make select involved organizations interactive with enter if tab-focused on, for both new event and edit event form
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const label = e.target.closest('.org-checkbox-item') || e.target.closest('.cat-checkbox-item');
        if (label) {
            e.preventDefault();
            
            const checkbox = label.querySelector('input[type="checkbox"]');

            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
});

function createEventListItemHTML(eventItem) {
    const selectedOrgIds = eventItem.orgsRelated 
        ? eventItem.orgsRelated.map(o => o.id) 
        : (eventItem.orgs || []);

    const startDate = eventItem.startDate ? eventItem.startDate.split('T')[0] : (eventItem.dateStart || '');
    const endDate = eventItem.endDate ? eventItem.endDate.split('T')[0] : (eventItem.dateEnd || '');
    const postedText = eventItem.postedDate || 'No recorded creation date.';

    
    let rawScheds = eventItem.schedules || [];
    if (rawScheds.length === 0) {
        rawScheds = [{ title: '', date: '', startTime: '', endTime: '', location: '', description: '' }];
    }

    const formattedSchedules = rawScheds.map(sched => ({
        title: sched.title || '',
        date: sched.date ? sched.date.split('T')[0] : '',
        startTime: sched.startTime ? (sched.startTime.includes('T') ? sched.startTime.split('T')[1].substring(0,5) : sched.startTime) : '',
        endTime: sched.endTime ? (sched.endTime.includes('T') ? sched.endTime.split('T')[1].substring(0,5) : sched.endTime) : '',
        location: sched.location || '',
        description: sched.description || ''
    }));

    let rawPhotos = eventItem.galleryPhotos || [];

    const formattedPhotos = rawPhotos.map(photo => ({
        photoUrl: photo.photoUrl || '',
        caption: photo.caption || ''
    }));

    const selectedCatIds = eventItem.categories || [];

    return '<li data-id="' + eventItem.id + '">' +
        '<div class="manage-item-main has-date">' +
            '<h4>' + escapeHtml(eventItem.name) + '</h4>' +
            '<p class="event-meta-date">' + postedText + '</p>' +
            '<span class="manage-actions">' +
                '<label tabindex="0" class="manage-action"><input type="checkbox" class="edit-toggle">Edit</label>' +
                '<button type="button" class="cancel-button delete-event">Delete</button>' +
            '</span>' +
        '</div>' +
        '<div class="panel-edit-event quick-act-panel">' +
            '<form>' +
                '<div><h4>Event Name</h4><input type="text" name="event-name" value="' + escapeHtml(eventItem.name) + '"></div>' +
                '<div><h4>Event Description</h4><textarea name="event-description">' + escapeHtml(eventItem.description || '') + '</textarea></div>' +
                '<div><h4>Event Status</h4>' +
                    '<select name="event-status">' +
                        '<option value="Upcoming"' + (eventItem.status === 'Upcoming' ? ' selected' : '') + '>Upcoming</option>' +
                        '<option value="Ongoing"' + (eventItem.status === 'Ongoing' ? ' selected' : '') + '>Ongoing</option>' +
                        '<option value="Finished"' + (eventItem.status === 'Finished' ? ' selected' : '') + '>Finished</option>' +
                    '</select>' +
                '</div>' +
                '<div><h4>Event Location</h4><input type="text" name="event-location" value="' + escapeHtml(eventItem.location) + '"></div>' +
                '<div class="inline-section">' +
                    '<div class="inline-part"><h4>Start Date</h4><input type="date" name="event-date-start" value="' + startDate + '"></div>' +
                    '<div class="inline-part"><h4>End Date</h4><input type="date" name="event-date-end" value="' + endDate + '"></div>' +
                '</div>' +
                '<div><h4>Event Photo URL</h4><input type="text" name="event-photoUrl" value="' + escapeHtml(eventItem.eventPhotoUrl) + '"></div>' +
                '<div><h4>Select Involved Organizations</h4>' + createOrgCheckboxGridHTML(selectedOrgIds) + '</div>' +
                '<div><h4>Select Categories</h4>' + createCatCheckboxGridHTML(selectedCatIds) + '</div>' +
                '<div class="event-programme-section">' +
                    '<div class="header"><h4>Programme Schedule</h4><div tabindex="0" class="add-schedule">Add Schedule</div></div>' +
                    '<div class="schedules">' + formattedSchedules.map(createScheduleBlockHTML).join('') + '</div>' +
                '</div>' +
                '<div class="event-gallery-section">' +
                    '<div class="header"><h4>Gallery</h4><div tabindex="0" class="add-photo">Add Photo</div></div>' +
                    '<div class="gallery">' + formattedPhotos.map(createPhotoBlockHTML).join('') + '</div>' +
                '</div>' +
                '<div class="edit-actions">' +
                    '<button class="join-button" type="submit">Save Changes</button>' +
                    '<button class="cancel-button" type="button">Cancel</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
    '</li>';
}

function createAnnouncementListItemHTML(announcement) {
    const orgIds = ['universe'].concat(organizationsData.map(function (org) { return org.id; }));
    if (!orgIds.includes(announcement.org)) orgIds.push(announcement.org);
    const orgOptions = Array.from(new Set(orgIds)).map(function (orgId) {
        const isSelected = announcement.org === orgId ? ' selected' : '';
        return '<option value="' + escapeHtml(orgId) + '"' + isSelected + '>' + escapeHtml(getOrgDisplayInfo(orgId).name) + '</option>';
    }).join('');

    return '<li data-id="' + escapeHtml(announcement.id) + '">' +
        '<div class="manage-item-main has-date">' +
            '<h4>' + escapeHtml(announcement.title) + '</h4>' +
            '<p class="announcement-meta-date">' + escapeHtml(announcement.postedDate) + '</p>' +
            '<span class="manage-actions">' +
                '<label tabindex="0" class="manage-action"><input type="checkbox" class="edit-toggle">Edit</label>' +
                '<button type="button" class="cancel-button delete-announcement">Delete</button>' +
            '</span>' +
        '</div>' +
        '<div class="panel-edit-event quick-act-panel">' +
            '<form>' +
                '<div><h4>Announcement Title</h4><input type="text" name="announce-name" value="' + escapeHtml(announcement.title) + '" required></div>' +
                '<div><h4>Posted By</h4><select name="announce-org">' + orgOptions + '</select></div>' +
                '<div><h4>Announcement Description</h4><textarea name="announce-body" required>' + escapeHtml(announcement.content.join('\n\n')) + '</textarea></div>' +
                '<div class="edit-actions">' +
                    '<button class="join-button" type="submit">Save Changes</button>' +
                    '<button class="cancel-button" type="button">Cancel</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
    '</li>';
}

// Render functions: rebuilds each list from its data array
const manageAnnouncementsList = document.getElementById('manage-announcements-list');

function renderManageAnnouncements() {
    if (!manageAnnouncementsList) return;
    manageAnnouncementsList.innerHTML = announcementsData.map(createAnnouncementListItemHTML).join('');
}

function renderManageEvents() {
    if (!manageEventsList) return;
    manageEventsList.innerHTML = officerEventsData.map(createEventListItemHTML).join('');
}


announcementsLoaded.then(renderManageAnnouncements);
eventsLoaded.then(renderManageEvents);

function readSchedulesFromForm(formEl) {
    return Array.from(formEl.querySelectorAll('.schedule')).map(function (block) {
        return {
            title: block.querySelector('[name="schedule-title"]').value.trim(),
            date: block.querySelector('[name="schedule-date"]').value,
            startTime: block.querySelector('[name="schedule-start-time"]').value,
            endTime: block.querySelector('[name="schedule-end-time"]').value,
            location: block.querySelector('[name="schedule-location"]').value.trim(),
            description: block.querySelector('textarea').value.trim()
        };
    });
}

function readOrgsFromForm(formEl) {
    return Array.from(formEl.querySelectorAll('input[name="orgs"]:checked')).map(function (checkbox) {
        return checkbox.value;
    });
}

function trimScheduleBlocksToOne(formEl) {
    const blocks = formEl.querySelectorAll('.schedule');
    blocks.forEach(function (block, index) {
        if (index > 0) block.remove();
    });
}

function readCatsFromForm(formEl) {
    return Array.from(formEl.querySelectorAll('input[name="cats"]:checked')).map(function (checkbox) {
        return checkbox.value;
    });
}

function readPhotosFromForm(formEl) {
    return Array.from(formEl.querySelectorAll('.gallery .photo')).map(function (block) {
        return {
            id: block.dataset.id || undefined,
            photoUrl: block.querySelector('[name="photo-url"]').value.trim(),
            caption: block.querySelector('[name="photo-caption"]').value.trim()
        };
    });
}

function todayFormatted() {
    return 'Posted on ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// Submit New Event
const newEventForm = document.querySelector('#panel-new-event form');
if (newEventForm) {
    newEventForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        
        const validationError = validateEventForm(newEventForm);
        if (validationError) {
            alert(validationError);
            return;
        }

        const newEventPayload = {
            name: newEventForm.querySelector('input[name="event-name"]').value.trim(),
            description: newEventForm.querySelector('textarea[name="event-description"]').value.trim(),
            status: newEventForm.querySelector('select[name="event-status"]').value,
            location: newEventForm.querySelector('input[name="event-location"]').value.trim(),
            startDate: newEventForm.querySelector('input[name="event-date-start"]').value,
            endDate: newEventForm.querySelector('input[name="event-date-end"]').value,
            eventPhotoUrl: newEventForm.querySelector('input[name="event-photoUrl"]').value.trim(),
            orgs: readOrgsFromForm(newEventForm),
            categories: readCatsFromForm(newEventForm),
            schedules: readSchedulesFromForm(newEventForm),
            galleryPhotos: readPhotosFromForm(newEventForm)
        };

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(API_BASE_URL + '/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(newEventPayload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create event');

            officerEventsData.unshift({
                id: data.id,
                name: data.name,
                description: data.description,
                status: data.status,
                dateStart: data.startDate ? data.startDate.split('T')[0] : '',
                dateEnd: data.endDate ? data.endDate.split('T')[0] : '',
                location: data.location,
                eventPhotoUrl: data.eventPhotoUrl,
                orgs: data.orgsRelated ? data.orgsRelated.map(o => o.id) : newEventPayload.orgs,
                categories: data.categories ? data.categories.map(c => c.id) : newEventPayload.categories,
                schedules: data.schedules || newEventPayload.schedules,
                galleryPhotos: data.galleryPhotos || newEventPayload.galleryPhotos,
                postedDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : todayFormatted()
            });

            renderManageEvents();
            trimScheduleBlocksToOne(newEventForm);
            newEventForm.reset();
            renderNewEventOrgCheckboxes();
            alert('Event published successfully!');
        } catch (error) {
            alert('Error creating event: ' + error.message);
        }
    });
}

// Delete events from the database
// code based on its announcement counterpart
if (manageEventsList) {
    manageEventsList.addEventListener('click', async function (event) {
        const deleteButton = event.target.closest('.delete-event');
        if (!deleteButton) return;
        
        const listItem = deleteButton.closest('li[data-id]');
        if (!listItem) return;
        
        const eventId = listItem.dataset.id;
        
        if (!confirm('Delete this event? This action cannot be undone.')) return;
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(API_BASE_URL + '/api/events/' + encodeURIComponent(eventId), {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to delete event');

            officerEventsData = officerEventsData.filter(function (item) {
                return item.id !== eventId;
            });

            renderManageEvents();
            alert('Event deleted successfully.');
        } catch (error) {
            alert('Error deleting event: ' + error.message);
        }
    });
}


// Authenticated API helper for announcement create/update/delete.
async function announcementApiRequest(path, options) {
    options = options || {};
    const headers = Object.assign({}, options.headers || {});
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';

    const token = localStorage.getItem('authToken');
    if (token) headers.Authorization = 'Bearer ' + token;

    const response = await fetch(API_BASE_URL + path, Object.assign({}, options, { headers }));
    const data = await response.json().catch(function () { return {}; });

    if (!response.ok) {
        throw new Error(data.error || 'Announcement request failed (' + response.status + ')');
    }
    return data;
}

function announcementFormPayload(form) {
    const bodyText = form.querySelector('textarea[name="announce-body"]').value.trim();
    return {
        title: form.querySelector('input[name="announce-name"]').value.trim(),
        org: form.querySelector('select[name="announce-org"]').value,
        content: bodyText.split(/\n{2,}/).map(function (paragraph) { return paragraph.trim(); }).filter(Boolean)
    };
}

// Submit New Announcement: save it to the database, not only the current browser.
const newAnnounceForm = document.querySelector('#panel-new-announce form');
if (newAnnounceForm) {
    newAnnounceForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        await announcementsLoaded;

        const payload = announcementFormPayload(newAnnounceForm);
        if (!payload.title || payload.content.length === 0) {
            alert('Please enter an announcement title and description.');
            return;
        }

        try {
            const created = await announcementApiRequest('/api/announcements', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            announcementsData.unshift(normalizeAnnouncementRecord(created));
            renderManageAnnouncements();
            newAnnounceForm.reset();
            alert('Announcement published successfully.');
        } catch (error) {
            alert(error.message + '\nMake sure you are logged in as an officer or admin and that the backend is running.');
        }
    });
}

// Delete announcements from the database.
if (manageAnnouncementsList) {
    manageAnnouncementsList.addEventListener('click', async function (event) {
        const deleteButton = event.target.closest('.delete-announcement');
        if (!deleteButton) return;

        const listItem = deleteButton.closest('li[data-id]');
        if (!listItem) return;
        if (!confirm('Delete this announcement? This cannot be undone.')) return;

        try {
            await announcementApiRequest('/api/announcements/' + encodeURIComponent(listItem.dataset.id), {
                method: 'DELETE'
            });
            announcementsData = announcementsData.filter(function (item) { return item.id !== listItem.dataset.id; });
            renderManageAnnouncements();
            alert('Announcement deleted.');
        } catch (error) {
            alert(error.message);
        }
    });
}

// Save Changes: works for both Events and Announcements edit panels
document.addEventListener('submit', async function (event) {
    const form = event.target;
    if (!form.closest('.panel-edit-event')) return;

    event.preventDefault();

    const li = form.closest('li');
    const itemId = li.dataset.id;
    const isEventForm = form.querySelector('input[name="event-name"]') !== null;

    if (isEventForm) {
        const eventItem = officerEventsData.find(function (item) { return item.id === itemId; });
        if (!eventItem) return;

        const validationError = validateEventForm(form);
        if (validationError) {
            alert(validationError);
            return;
        }

        const eventUpdateData = {
            name: form.querySelector('input[name="event-name"]').value.trim(),
            description: form.querySelector('textarea[name="event-description"]').value.trim(),
            status: form.querySelector('select[name="event-status"]').value,
            location: form.querySelector('input[name="event-location"]').value.trim(),
            startDate: form.querySelector('input[name="event-date-start"]').value,
            endDate: form.querySelector('input[name="event-date-end"]').value,
            eventPhotoUrl: form.querySelector('input[name="event-photoUrl"]').value.trim(),
            orgs: readOrgsFromForm(form),
            categories: readCatsFromForm(form),
            schedules: readSchedulesFromForm(form),
            galleryPhotos: readPhotosFromForm(form)
        };

        if (!eventUpdateData.name) {
            alert('Please enter an event name.');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(API_BASE_URL + '/api/events/' + encodeURIComponent(itemId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(eventUpdateData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update event');

            eventItem.name = data.name;
            eventItem.description = data.description;
            eventItem.status = data.status;
            eventItem.location = data.location;
            eventItem.eventPhotoUrl = data.eventPhotoUrl;
            eventItem.dateStart = data.startDate ? data.startDate.split('T')[0] : '';
            eventItem.dateEnd = data.endDate ? data.endDate.split('T')[0] : '';
            eventItem.orgs = data.orgsRelated ? data.orgsRelated.map(o => o.id) : eventUpdateData.orgs;
            eventItem.categories = data.categories ? data.categories.map(c => c.id) : eventUpdateData.categories;
            eventItem.schedules = data.schedules || eventUpdateData.schedules;
            eventItem.galleryPhotos = data.galleryPhotos || eventUpdateData.galleryPhotos;

            renderManageEvents();
            alert('Event updated successfully.');
        } catch (error) {
            alert(error.message);
        }
    } else {
        const announcementItem = announcementsData.find(function (item) { return item.id === itemId; });
        if (!announcementItem) return;

        const payload = announcementFormPayload(form);
        if (!payload.title || payload.content.length === 0) {
            alert('Please enter an announcement title and description.');
            return;
        }

        try {
            const updated = await announcementApiRequest('/api/announcements/' + encodeURIComponent(itemId), {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            const updatedIndex = announcementsData.findIndex(function (item) { return item.id === itemId; });
            if (updatedIndex !== -1) announcementsData[updatedIndex] = normalizeAnnouncementRecord(updated);
            renderManageAnnouncements();
            alert('Announcement updated successfully.');
        } catch (error) {
            alert(error.message);
        }
    }
});

function validateEventForm(formEl) {
    const nameVal = formEl.querySelector('input[name="event-name"]').value.trim();
    const descVal = formEl.querySelector('textarea[name="event-description"]').value.trim();
    const locationVal = formEl.querySelector('input[name="event-location"]').value.trim();
    const startDateVal = formEl.querySelector('input[name="event-date-start"]').value;
    const endDateVal = formEl.querySelector('input[name="event-date-end"]').value;
    const photoUrlVal = formEl.querySelector('input[name="event-photoUrl"]').value.trim();
    const selectedOrgs = readOrgsFromForm(formEl);
    const schedules = readSchedulesFromForm(formEl);
    const galleryPhotos = readPhotosFromForm(formEl);

    if (!nameVal) return 'Event Name: This field is required and cannot be empty.';
    if (!descVal) return 'Event Description: This field is required and cannot be empty.';
    if (!locationVal) return 'Event Location: This field is required and cannot be empty.';
    if (!startDateVal) return 'Start Date: Please select a valid start date.';
    if (!endDateVal) return 'End Date: Please select a valid end date.';
    if (startDateVal > endDateVal) return 'Date Range Error: Start Date cannot be further than (after) the End Date.';
    if (!photoUrlVal) return 'Event Photo URL: This field is required.';
    if (selectedOrgs.length === 0) return 'Involved Organizations: Please select at least one organization.';

    for (let i = 0; i < schedules.length; i++) {
        const sched = schedules[i];
        const schedNum = i + 1;

        if (!sched.title) return `Programme Schedule #${schedNum} (Title): Schedule title is required.`;
        if (!sched.date) return `Programme Schedule #${schedNum} (Date): Schedule date is required.`;
        if (sched.date < startDateVal || sched.date > endDateVal) {
            return `Programme Schedule #${schedNum} (Date): Schedule date must fall within the event's Start Date and End Date range.`;
        }
        if (!sched.startTime) return `Programme Schedule #${schedNum} (Start Time): Start time is required.`;
        if (!sched.endTime) return `Programme Schedule #${schedNum} (End Time): End time is required.`;
        if (sched.startTime >= sched.endTime) return `Programme Schedule #${schedNum} (Times): Start Time must be earlier than the End Time.`;
        if (!sched.location) return `Programme Schedule #${schedNum} (Location): Schedule location is required.`;
    }

    for (let j = 0; j < galleryPhotos.length; j++) {
        const photo = galleryPhotos[j];
        const photoNum = j + 1;

        if (!photo.photoUrl) {
            return `Gallery Photo #${photoNum} (Photo URL): Photo URL is required. You may click "Remove" if you do not wish to include this photo block.`;
        }
    }

    return null;
}


// Generates the New Event form's checkbox grid on page load
// (fixes the old hardcoded checkboxes that used mismatched org ids)
function renderNewEventOrgCheckboxes() {
    const newEventOrgCheckboxes = document.getElementById('new-event-org-checkboxes');
    if (!newEventOrgCheckboxes) return;
    newEventOrgCheckboxes.innerHTML = createOrgCheckboxGridHTML(currentUserOrgIds);
}

// Cancel
document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('cancel-button')) return;

    const li = event.target.closest('li');
    const toggle = li.querySelector('.edit-toggle');
    if (toggle) toggle.checked = false;
});


function addScheduleFrontend(element) {
    const programmeSection = element.closest('.event-programme-section');
    if (!programmeSection) return;
    
    const schedulesContainer = programmeSection.querySelector('.schedules');
    const firstSchedule = schedulesContainer.querySelector('.schedule');
    if (!firstSchedule) return;

    const newSchedule = firstSchedule.cloneNode(true);
    newSchedule.querySelectorAll('input').forEach(function (input) { input.value = ''; });
    newSchedule.querySelectorAll('textarea').forEach(function (textarea) { textarea.value = ''; });

    schedulesContainer.appendChild(newSchedule);
}

function removeScheduleFrontend(element) {
    const scheduleBlock = element.closest('.schedule');
    if (!scheduleBlock) return;
    
    const schedulesContainer = scheduleBlock.closest('.schedules');
    if (!schedulesContainer) return;
    
    const allSchedules = schedulesContainer.querySelectorAll('.schedule');
    if (allSchedules.length > 1) {
        scheduleBlock.remove();
    } else{
        alert("Event must have at least one schedule.");
    }
}

document.addEventListener('click', function (event) {
    const addBtn = event.target.closest('.add-schedule');
    if (addBtn) addScheduleFrontend(addBtn);
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const addBtn = e.target.closest('.add-schedule');
        if (addBtn) {
            e.preventDefault();
            addScheduleFrontend(addBtn);
        }
    }
});


document.addEventListener('click', function (event) {
    const removeBtn = event.target.closest('.remove-schedule');
    if (removeBtn) removeScheduleFrontend(removeBtn);
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const removeBtn = e.target.closest('.remove-schedule');
        if (removeBtn) {
            e.preventDefault();
            removeScheduleFrontend(removeBtn);
        }
    }
});




//for toggling the menu using enter
const menuToggle = document.querySelector('.menu-checkbox');
const menuBtn = document.querySelector('.mobile-menu-btn');

if (menuBtn && menuToggle) {
    menuBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            menuToggle.checked = !menuToggle.checked;
        }
    });
}

// ensuring keyboard accessbility for the edit toggles in dashboard for org officer
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const manageAction = e.target.closest('.manage-action');
        if (manageAction) {
            e.preventDefault();
            
            const checkbox = manageAction.querySelector('input.edit-toggle');

            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
});


function addPhotoFrontend(element) {
    const gallerySection = element.closest('.event-gallery-section');
    if (!gallerySection) return;
    
    const galleryContainer = gallerySection.querySelector('.gallery');
    const firstPhoto = galleryContainer.querySelector('.photo');
    
    if (!firstPhoto) {
        galleryContainer.innerHTML = createPhotoBlockHTML({ photoUrl: '', caption: '' });
        return;
    }
    
    const newPhoto = firstPhoto.cloneNode(true);
    newPhoto.querySelectorAll('input').forEach(function (input) { input.value = ''; });
    galleryContainer.appendChild(newPhoto);
}


function removePhotoFrontend(element) {
    const photoBlock = element.closest('.photo');
    if (!photoBlock) return;
    
    const galleryContainer = photoBlock.closest('.gallery');
    if (!galleryContainer) return;
    
    photoBlock.remove();
}

document.addEventListener('click', function (event) {
    const addPhotoBtn = event.target.closest('.add-photo');
    if (addPhotoBtn) addPhotoFrontend(addPhotoBtn);

    const removePhotoBtn = event.target.closest('.remove-photo');
    if (removePhotoBtn) removePhotoFrontend(removePhotoBtn);
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const addPhotoBtn = e.target.closest('.add-photo');
        if (addPhotoBtn) {
            e.preventDefault();
            addPhotoFrontend(addPhotoBtn);
        }
        const removePhotoBtn = e.target.closest('.remove-photo');
        if (removePhotoBtn) {
            e.preventDefault();
            removePhotoFrontend(removePhotoBtn);
        }
    }
});



// ALL PAGES: header auth button (Log In/Log Out) to reflect login state
const authButton = document.getElementById('auth-button');

if (authButton) {
    const authUserRaw = localStorage.getItem('authUser');

    if (authUserRaw) {
        const authUser = JSON.parse(authUserRaw);
        authButton.textContent = 'Log Out (' + authUser.name + ')';

        authButton.addEventListener('click', function () {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.href = 'login.html';
        });
    } else {
        authButton.textContent = 'Log In';

        authButton.addEventListener('click', function () {
            window.location.href = 'login.html';
        });
    }
}