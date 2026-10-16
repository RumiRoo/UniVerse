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
                    targetRadio.dispatchEvent(new Event('change'));
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
        postedDate: record.postedDate || 'Posted on ' + new Date(record.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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

// EVENTS PAGE: Search + Filter Events
const eventSearch = document.getElementById('event-search');
const eventCategorySelect = document.getElementById('event-category');
const eventCards = document.querySelectorAll('.event-card');
const noEventsMessage = document.getElementById('no-events-message');
const statusFilterButtons = document.querySelectorAll('.event-status-filter');

let selectedStatus = 'all';

if (eventSearch && eventCategorySelect) {

    function applyEventFilters() {
        const searchTerm = eventSearch.value.trim().toLowerCase();
        const selectedCategory = eventCategorySelect.value;

        let visibleCount = 0;

        eventCards.forEach(function (card) {
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

    eventSearch.addEventListener('input', applyEventFilters);
    eventCategorySelect.addEventListener('change', applyEventFilters);

    //for status filters
    statusFilterButtons.forEach(function (button) {
        function selectFilter() {
            statusFilterButtons.forEach(function (btn) {
                btn.classList.format ? btn.classList.remove('active') : btn.classList.remove('active');
            });
            button.classList.add('active');
            selectedStatus = button.dataset.value;
            applyEventFilters();
        }

        button.addEventListener('click', selectFilter);

        //ensuring on enter press with a tab-focused status filter, the filter works
        button.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectFilter();
            }
        });
    });
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

// OFFICER: master data for Events
const defaultOfficerEvents = [
    {
        id: "event-seed-1",
        name: "Student Organization Fair",
        description: "A collaboration between all of MMDC's organizations, this special event brings together the talents of all student groups. Join now to showcase your talents!",
        dateStart: "2026-08-31",
        dateEnd: "2026-08-31",
        orgs: ["digital-fort", "disenyo-malaya", "scholars-club"],
        postedDate: "Posted on Sept. 6, 2026",
        schedules: [
            {
                title: "Grand Opening & Main Booth Fair",
                date: "2026-08-31", startTime: "09:00", endTime: "10:00",
                location: "Main Quad",
                description: "Kickoff ceremony, welcome address, and opening of all general booth exhibits."
            },
            {
                title: "\"Behind the Headlines\" Live Pitch & Workshop",
                date: "2026-08-31", startTime: "10:30", endTime: "12:30",
                location: "Student Center 201",
                description: "Interactive session on campus reporting, photojournalism basics, and pitch ideas."
            },
            {
                title: "Academic Bowl & Quiz Bee",
                date: "2026-08-31", startTime: "13:30", endTime: "14:45",
                location: "Auditorium",
                description: "Inter-departmental trivia challenge showcasing top academic talent across subjects."
            },
            {
                title: "Live Canvas & Interactive Mural Jam",
                date: "2026-08-31", startTime: "15:00", endTime: "17:30",
                location: "Main Courtyard",
                description: "Watch live painting demonstrations or leave your mark on the interactive campus mural."
            }
        ]
    }
];

// Loaded from localStorage if existing, falls back to the defaults if not
let officerEventsData = JSON.parse(localStorage.getItem('officerEvents')) || defaultOfficerEvents;

function saveOfficerEvents() {
    localStorage.setItem('officerEvents', JSON.stringify(officerEventsData));
}

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

function createOrgCheckboxGridHTML(selectedOrgIds) {
    return '<div class="org-checkbox-grid">' +
        organizationsData.map(function (org) {
            const isChecked = selectedOrgIds.includes(org.id) ? ' checked' : '';
            return '<label class="org-checkbox-item" tabindex="0">' +
                '<input type="checkbox" tabindex="-1" name="orgs" value="' + org.id + '"' + isChecked + '>' +
                '<span>' + org.name + '</span>' +
            '</label>';
        }).join('') +
    '</div>';
}

// Dashboard org officer, make select involved organizations interactive with enter if tab-focused on, for both new event and edit event form
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const label = e.target.closest('.org-checkbox-item');
        if (label) {
            e.preventDefault();
            
            const checkbox = label.querySelector('input[type="checkbox"]');

            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        }
    }
});

function createEventListItemHTML(eventItem) {
    return '<li data-id="' + eventItem.id + '">' +
        '<div class="manage-item-main has-date">' +
            '<h4>' + escapeHtml(eventItem.name) + '</h4>' +
            '<p class="announcement-meta-date">' + eventItem.postedDate + '</p>' +
            '<label tabindex="0" class="manage-action"><input type="checkbox" class="edit-toggle">Edit</label>' +
        '</div>' +
        '<div class="panel-edit-event quick-act-panel">' +
            '<form>' +
                '<div><h4>Event Name</h4><input type="text" name="event-name" value="' + escapeHtml(eventItem.name) + '"></div>' +
                '<div><h4>Event Description</h4><textarea name="event-description">' + escapeHtml(eventItem.description) + '</textarea></div>' +
                '<div class="inline-section">' +
                    '<div class="inline-part"><h4>Start Date</h4><input type="date" name="event-date-start" value="' + eventItem.dateStart + '"></div>' +
                    '<div class="inline-part"><h4>End Date</h4><input type="date" name="event-date-end" value="' + eventItem.dateEnd + '"></div>' +
                '</div>' +
                '<div><h4>Select Involved Organizations</h4>' + createOrgCheckboxGridHTML(eventItem.orgs) + '</div>' +
                '<div class="event-programme-section">' +
                    '<div tabindex="0" class="header"><h4>Programme Schedule</h4><div class="add-schedule">Add Schedule</div></div>' +
                    '<div class="schedules">' + eventItem.schedules.map(createScheduleBlockHTML).join('') + '</div>' +
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
const manageEventsList = document.getElementById('manage-events-list');
const manageAnnouncementsList = document.getElementById('manage-announcements-list');

function renderManageEvents() {
    if (!manageEventsList) return;
    manageEventsList.innerHTML = officerEventsData.map(createEventListItemHTML).join('');
}

function renderManageAnnouncements() {
    if (!manageAnnouncementsList) return;
    manageAnnouncementsList.innerHTML = announcementsData.map(createAnnouncementListItemHTML).join('');
}

renderManageEvents();
announcementsLoaded.then(renderManageAnnouncements);

// Helpers: reads a form's current state back into a plain object
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

function todayFormatted() {
    return 'Posted on ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Submit New Event
const newEventForm = document.querySelector('#panel-new-event form');

if (newEventForm) {
    newEventForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const eventName = newEventForm.querySelector('input[name="event-name"]').value.trim();
        if (eventName === '') return;

        officerEventsData.push({
            id: 'event-' + Date.now(),
            name: eventName,
            description: newEventForm.querySelector('textarea[name="event-description"]').value.trim(),
            dateStart: newEventForm.querySelector('input[name="event-date-start"]').value,
            dateEnd: newEventForm.querySelector('input[name="event-date-end"]').value,
            orgs: readOrgsFromForm(newEventForm),
            schedules: readSchedulesFromForm(newEventForm),
            postedDate: todayFormatted()
        });

        saveOfficerEvents();
        renderManageEvents();

        trimScheduleBlocksToOne(newEventForm);
        newEventForm.reset();
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

        eventItem.name = form.querySelector('input[name="event-name"]').value.trim();
        eventItem.description = form.querySelector('textarea[name="event-description"]').value.trim();
        eventItem.dateStart = form.querySelector('input[name="event-date-start"]').value;
        eventItem.dateEnd = form.querySelector('input[name="event-date-end"]').value;
        eventItem.orgs = readOrgsFromForm(form);
        eventItem.schedules = readSchedulesFromForm(form);

        saveOfficerEvents();
        renderManageEvents();
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

// Generates the New Event form's checkbox grid on page load
// (fixes the old hardcoded checkboxes that used mismatched org ids)
const newEventOrgCheckboxes = document.getElementById('new-event-org-checkboxes');
if (newEventOrgCheckboxes) {
    newEventOrgCheckboxes.innerHTML = organizationsData.map(function (org) {
        return '<label tabindex="0" class="org-checkbox-item">' +
            '<input tabindex="-1" type="checkbox" name="orgs" value="' + org.id + '">' +
            '<span>' + org.name + '</span>' +
        '</label>';
    }).join('');
}

// Cancel
document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('cancel-button')) return;

    const li = event.target.closest('li');
    const toggle = li.querySelector('.edit-toggle');
    if (toggle) toggle.checked = false;
});

// Add Schedule
document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('add-schedule')) return;

    const schedulesContainer = event.target.closest('.event-programme-section').querySelector('.schedules');
    const firstSchedule = schedulesContainer.querySelector('.schedule');

    const newSchedule = firstSchedule.cloneNode(true);
    newSchedule.querySelectorAll('input').forEach(function (input) { input.value = ''; });
    newSchedule.querySelectorAll('textarea').forEach(function (textarea) { textarea.value = ''; });

    schedulesContainer.appendChild(newSchedule);
});

// Remove Schedule
document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('remove-schedule')) return;

    const schedulesContainer = event.target.closest('.schedules');
    const allSchedules = schedulesContainer.querySelectorAll('.schedule');

    if (allSchedules.length > 1) {
        event.target.closest('.schedule').remove();
    }
});


//for toggling the menu using enter
const menuToggle = document.querySelector('.menu-checkbox');
const menuBtn = document.querySelector('.mobile-menu-btn');

if (menuBtn && menuToggle) {
    console.log("Hamburger menu script loaded successfully!");

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