// ORGANIZATION WEBPAGE
// Search + Filter orgs
const searchInput = document.getElementById('organization-search');
const categorySelect = document.getElementById('category');
const orgCards = document.querySelectorAll('.organization-card');
const noResultsMessage = document.getElementById('no-results-message');

if (searchInput && categorySelect) {
    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCategory = categorySelect.value;

        let visibleCount = 0;

        orgCards.forEach(function (card) {
            const title = card.querySelector('.org-title').textContent.toLowerCase();
            const description = card.querySelector('.org-description').textContent.toLowerCase();
            const cardCategory = card.dataset.category;

            const matchesSearch =
                title.includes(searchTerm) ||
                description.includes(searchTerm);

            const matchesCategory =
                selectedCategory === 'all' ||
                cardCategory === selectedCategory;

            const shouldShow =
                matchesSearch &&
                matchesCategory;

            if (shouldShow) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        noResultsMessage.style.display =
            visibleCount === 0 ? 'block' : 'none';
    }

    searchInput.addEventListener('input', applyFilters);
    categorySelect.addEventListener('change', applyFilters);

    searchInput.closest('form').addEventListener('submit', function (event) {
        event.preventDefault();
        applyFilters();
    });
}


// Join + Leave orgs
// Runs on organization profile pages

const joinButton =
    document.querySelector('#org-profile-banner .join-button');

if (joinButton) {
    const orgId = document.body.dataset.org;

    const joinedOrgs =
        JSON.parse(localStorage.getItem('joinedOrgs')) || [];

    if (joinedOrgs.includes(orgId)) {
        joinButton.textContent = 'Joined';
        joinButton.classList.add('joined');
    }

    joinButton.addEventListener('click', function (event) {
        event.preventDefault();

        const isJoined =
            joinButton.classList.contains('joined');

        if (isJoined) {

            // Leave
            joinButton.textContent = 'Join Organization';
            joinButton.classList.remove('joined');

            const index =
                joinedOrgs.indexOf(orgId);

            if (index !== -1) {
                joinedOrgs.splice(index, 1);
            }

        } else {

            // Join
            joinButton.textContent = 'Joined';
            joinButton.classList.add('joined');

            joinedOrgs.push(orgId);
        }

        localStorage.setItem(
            'joinedOrgs',
            JSON.stringify(joinedOrgs)
        );
    });
}


// Search + Filter Events
const eventSearch =
    document.getElementById('event-search');

const eventCategorySelect =
    document.getElementById('event-category');

const eventCards =
    document.querySelectorAll('.event-card');

const noEventsMessage =
    document.getElementById('no-events-message');

const statusFilterButtons =
    document.querySelectorAll('.event-status-filter');

let selectedStatus = 'all';

if (eventSearch && eventCategorySelect) {

    function applyEventFilters() {
        const searchTerm =
            eventSearch.value.trim().toLowerCase();

        const selectedCategory =
            eventCategorySelect.value;

        let visibleCount = 0;

        eventCards.forEach(function (card) {

            const title =
                card.querySelector('.event-title')
                    .textContent
                    .toLowerCase();

            const description =
                card.querySelector('.event-description')
                    .textContent
                    .toLowerCase();

            const cardCategories =
                card.dataset.categories
                    ? card.dataset.categories
                        .split(',')
                        .map(c => c.trim().toLowerCase())
                    : [];

            const cardStatus =
                card.dataset.status
                    ? card.dataset.status
                        .trim()
                        .toLowerCase()
                    : '';

            const matchesSearch =
                title.includes(searchTerm) ||
                description.includes(searchTerm);

            const matchesCategory =
                selectedCategory === 'all' ||
                cardCategories.includes(
                    selectedCategory.toLowerCase()
                );

            const matchesStatus =
                selectedStatus === 'all' ||
                cardStatus === selectedStatus.toLowerCase();

            const shouldShow =
                matchesSearch &&
                matchesCategory &&
                matchesStatus;

            if (shouldShow) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (noEventsMessage) {
            noEventsMessage.style.display =
                visibleCount === 0 ? 'block' : 'none';
        }
    }

    eventSearch.addEventListener(
        'input',
        applyEventFilters
    );

    eventCategorySelect.addEventListener(
        'change',
        applyEventFilters
    );

    statusFilterButtons.forEach(function (button) {
        button.addEventListener('click', function () {

            statusFilterButtons.forEach(function (btn) {
                btn.classList.remove('active');
            });

            button.classList.add('active');

            selectedStatus =
                button.dataset.value;

            applyEventFilters();
        });
    });
}

// DASHBOARD
// reflects joined organization; only runs if there's "My Organizations" section

const myOrganizationsList = document.getElementById('my-organizations-list');

if (myOrganizationsList) {
    const joinedOrgs = JSON.parse(localStorage.getItem('joinedOrgs')) || [];
    const myOrgCards = myOrganizationsList.querySelectorAll('.organization-card');
    const noJoinedOrgsMessage = document.getElementById('no-joined-orgs-message');

    let joinedCount = 0;

    myOrgCards.forEach(function (card) {
        const orgId = card.dataset.org;

        if (joinedOrgs.includes(orgId)) {
            card.style.display = '';
            joinedCount++;
        } else {
            card.style.display = 'none';
        }
    });

    noJoinedOrgsMessage.style.display = joinedCount === 0 ? 'block' : 'none';
}

// ADMIN DASHBOARD: buttons Approve + Reject Org. Requests
const requestList = document.getElementById('request-list');

if (requestList) {
    const noRequestsMessage = document.getElementById('no-requests-message');
    const adminOrgList = document.getElementById('admin-org-list');
    const pendingCountEl = document.getElementById('pending-requests-count');

    function updatePendingCount() {
        const remaining = requestList.querySelectorAll('.request-card').length;
        if (pendingCountEl) {
            pendingCountEl.textContent = remaining;
        }
        noRequestsMessage.style.display = remaining === 0 ? 'block' : 'none';
    }

    // One listener on the whole list instead of one per button so
    // it still works even if more requests are added later
    requestList.addEventListener('click', function (event) {
        const approveClicked = event.target.classList.contains('request-approve');
        const rejectClicked = event.target.classList.contains('request-reject');

        if (!approveClicked && !rejectClicked) return; // clicked somewhere else, ignore

        event.preventDefault();

        const card = event.target.closest('.request-card');
        const orgName = card.dataset.orgName;
        const orgCategory = card.dataset.orgCategory;

        if (approveClicked && adminOrgList) {
            // Add the newly approved org. into "Manage Organizations"
            const newItem = document.createElement('li');
            newItem.innerHTML =
                '<div class="manage-item-main">' +
                    '<span>' + orgName + ' - ' + orgCategory + '</span>' +
                    '<span class="manage-actions">' +
                        '<a href="#" class="manage-action">View</a>' +
                        '<a href="#" class="manage-action manage-action-danger">Remove</a>' +
                    '</span>' +
                '</div>';
            adminOrgList.appendChild(newItem);
        }

        // Whether approved or rejected, request is handled either way
        card.remove();
        updatePendingCount();
    });
}

// Admin: Remove an organization from "Manage Organizations"
const adminOrgListEl = document.getElementById('admin-org-list');

if (adminOrgListEl) {
    adminOrgListEl.addEventListener('click', function (event) {
        if (!event.target.classList.contains('manage-action-danger')) return;

        event.preventDefault();
        const item = event.target.closest('li');
        item.remove();
    });
}

// Small helper for when "?" or "&" is typed
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// OFFICER DASHBOARD: Submit New Event
const newEventForm = document.querySelector('#panel-new-event form');
const manageEventsList = document.getElementById('manage-events-list');

if (newEventForm && manageEventsList) {
    newEventForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const nameInput = newEventForm.querySelector('input[name="event-name"]');
        const descriptionInput = newEventForm.querySelector('textarea');
        const eventName = nameInput.value.trim();
        const eventDescription = descriptionInput.value.trim();

        if (eventName === '') return; // prevents a blank event

        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const safeName = escapeHtml(eventName);
        const safeDescription = escapeHtml(eventDescription);

        const newItem = document.createElement('li');
        newItem.innerHTML =
            '<div class="manage-item-main has-date">' +
                '<h4>' + safeName + '</h4>' +
                '<p class="announcement-meta-date">Posted on ' + today + '</p>' +
                '<label class="manage-action"><input type="checkbox" class="edit-toggle">Edit</label>' +
            '</div>' +
            '<div class="panel-edit-event quick-act-panel">' +
                '<form>' +
                    '<div>' +
                        '<h4>Event Name</h4>' +
                        '<input type="text" name="event-name" value="' + safeName + '">' +
                    '</div>' +
                    '<div>' +
                        '<h4>Event Description</h4>' +
                        '<textarea name="event-description">' + safeDescription + '</textarea>' +
                    '</div>' +
                    '<div class="edit-actions">' +
                        '<button class="join-button" type="submit">Save Changes</button>' +
                        '<button class="cancel-button" type="button">Cancel</button>' +
                    '</div>' +
                '</form>' +
            '</div>';

        manageEventsList.appendChild(newItem);
        newEventForm.reset();
    });
}

// OFFICER DASHBOARD: Submit New Announcement
const newAnnounceForm = document.querySelector('#panel-new-announce form');
const manageAnnouncementsList = document.getElementById('manage-announcements-list');

if (newAnnounceForm && manageAnnouncementsList) {
    newAnnounceForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const nameInput = newAnnounceForm.querySelector('input[name="announce-name"]');
        const descriptionInput = newAnnounceForm.querySelector('textarea[name="announce-body"]');
        const announceName = nameInput.value.trim();
        const announceBody = descriptionInput.value.trim();

        if (announceName === '') return;

        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const safeName = escapeHtml(announceName);
        const safeBody = escapeHtml(announceBody);

        const newItem = document.createElement('li');
        newItem.innerHTML =
            '<div class="manage-item-main has-date">' +
                '<h4>' + safeName + '</h4>' +
                '<p class="announcement-meta-date">Posted on ' + today + '</p>' +
                '<label class="manage-action"><input type="checkbox" class="edit-toggle">Edit</label>' +
            '</div>' +
            '<div class="panel-edit-event quick-act-panel">' +
                '<form>' +
                    '<div>' +
                        '<h4>Announcement Title</h4>' +
                        '<input type="text" name="announce-name" value="' + safeName + '">' +
                    '</div>' +
                    '<div>' +
                        '<h4>Announcement Description</h4>' +
                        '<textarea name="announce-body">' + safeBody + '</textarea>' +
                    '</div>' +
                    '<div class="edit-actions">' +
                        '<button class="join-button" type="submit">Save Changes</button>' +
                        '<button class="cancel-button" type="button">Cancel</button>' +
                    '</div>' +
                '</form>' +
            '</div>';

        manageAnnouncementsList.appendChild(newItem);
        newAnnounceForm.reset();
    });
}

// OFFICER DASHBOARD: Add Schedule
document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('add-schedule')) return;

    const schedulesContainer = event.target.closest('.event-programme-section').querySelector('.schedules');
    const firstSchedule = schedulesContainer.querySelector('.schedule');

    const newSchedule = firstSchedule.cloneNode(true);
    newSchedule.querySelectorAll('input').forEach(function (input) { input.value = ''; });
    newSchedule.querySelectorAll('textarea').forEach(function (textarea) { textarea.value = ''; });

    schedulesContainer.appendChild(newSchedule);
});

// OFFICER DASHBOARD: Remove Schedule
document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('remove-schedule')) return;

    const schedulesContainer = event.target.closest('.schedules');
    const allSchedules = schedulesContainer.querySelectorAll('.schedule');

    if (allSchedules.length > 1) {
        event.target.closest('.schedule').remove();
    }
});

// OFFICER DASHBOARD: Save Changes
document.addEventListener('submit', function (event) {
    if (!event.target.closest('.panel-edit-event')) return;

    event.preventDefault();

    const form = event.target;
    const nameInput = form.querySelector('input[name="event-name"], input[name="announce-name"]');
    const li = form.closest('li');
    const heading = li.querySelector('.manage-item-main h4');

    if (nameInput && heading && nameInput.value.trim() !== '') {
        heading.textContent = nameInput.value.trim();
    }

    const toggle = li.querySelector('.edit-toggle');
    if (toggle) toggle.checked = false;
});

// OFFICER DASHBOARD: Cancel
document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('cancel-button')) return;

    const li = event.target.closest('li');
    const toggle = li.querySelector('.edit-toggle');
    if (toggle) toggle.checked = false;
});

// ANNOUNCEMENT: navigation to mock announcements
// Each id matches the data-id on the cards in the announcement.html

const announcementsData = [
    {
        id: "org-registrations",
        category: "UNIVERSE",
        title: "Organization Registrations Are Now Open!",
        date: "Posted on Sept. 6, 2026",
        postedBy: "By UniVerse",
        content: [
            "Students may now browse and join registered organizations through UniVerse!",
            "Explore the available student organizations, learn more about their activities and events, and discover opportunities to get involved in the university community.",
            "Whether you're interested in journalism, arts and design, academics, or other student activities, UniVerse makes it easier to discover organizations that match your interests."
        ],
        linkHref: "organizations.html",
        linkLabel: "Organizations"
    },
    {
        id: "news-writing-workshop",
        category: "THE DIGITAL FORT",
        title: "News Writing Workshop",
        date: "Posted on Sept. 12, 2026",
        postedBy: "By The Digital Fort",
        content: [
            "The Digital Fort will be holding a writing workshop for students interested in journalism, and content and news writing.",
            "The session will cover the basics of campus reporting, interviewing techniques, and editorial writing. All beginners are welcome.",
            "Slots are limited so register early to secure a spot!"
        ],
        linkHref: "digital-fort.html",
        linkLabel: "The Digital Fort"
    },
    {
        id: "design-exhibition",
        category: "DISENYO MALAYA",
        title: "Design Exhibition Submissions Are Open!",
        date: "Posted on Sept. 7, 2026",
        postedBy: "By Disenyo Malaya",
        content: [
            "Calling all creatives! Students may submit their artwork for a chance to showcase it on the upcoming campus design exhibition on September 18, Friday.",
            "The theme is \"Digital Consumption\". Interpret and present it however you like, whether through illustration, UI/UX mockups, or mixed media.",
            "Submissions are open to all students, regardless of course or year level."
        ],
        linkHref: "disenyo-malaya.html",
        linkLabel: "Disenyo Malaya"
    },
    {
        id: "leadership-workshop",
        category: "SCHOLARS CLUB",
        title: "Leadership Workshop Registration",
        date: "Posted on Sept. 6, 2026",
        postedBy: "By Scholars Club",
        content: [
            "Registration is now open on Scholars Club's webpage for the upcoming leadership development workshop.",
            "The workshop covers essential skills for scholars taking on peer mentor and leadership roles across the university.",
            "Do take note that seats are limited to keep the session hands-on and interactive."
        ],
        linkHref: "scholars-club.html",
        linkLabel: "Scholars Club"
    }
];

const announcementDetailArticle = document.querySelector('.announcement-detail');

if (announcementDetailArticle) {
    // Reads the "id" value from the URL (e.g. announcement-details.html?id=leadership-workshop)
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('id');

    // Look for a matching announcement in the data above
    const announcement = announcementsData.find(function (item) {
        return item.id === requestedId;
    });

    if (announcement) {
        // Fills the page with this announcement's real content
        document.querySelector('.announcement-label').textContent = announcement.category;
        document.querySelector('.announcement-detail-title').textContent = announcement.title;

        const metaSpans = document.querySelectorAll('.announcement-meta span');
        metaSpans[0].textContent = announcement.date;
        metaSpans[1].textContent = announcement.postedBy;

        const contentContainer = document.querySelector('.announcement-detail-content');
        contentContainer.innerHTML = '';

        announcement.content.forEach(function (paragraphText) {
            const p = document.createElement('p');
            p.textContent = paragraphText;
            contentContainer.appendChild(p);
        });

        // Adding the closing "Visit [Org]" link paragraph
        const linkParagraph = document.createElement('p');
        linkParagraph.textContent = 'Visit ';
        const link = document.createElement('a');
        link.href = announcement.linkHref;
        link.textContent = announcement.linkLabel;
        linkParagraph.appendChild(link);
        linkParagraph.appendChild(document.createTextNode(' to learn more.'));
        contentContainer.appendChild(linkParagraph);

    } else {
        // Fallback for  if there's no id in the URL or it didn't match anything
        document.querySelector('.announcement-label').textContent = 'ANNOUNCEMENT';
        document.querySelector('.announcement-detail-title').textContent = 'Announcement Not Found';
        document.querySelector('.announcement-meta').style.display = 'none';

        const contentContainer = document.querySelector('.announcement-detail-content');
        contentContainer.innerHTML = '<p>We couldn\'t find the announcement you were looking for. It may have been removed or the link may be incorrect.</p>';
    }
}

// ANNOUNCEMENT: Search & Filter Functionality

const announcementSearchInput = document.getElementById('announcement-search');
const announcementOrgSelect = document.getElementById('announcement-organization');
const noAnnouncementsMessage = document.getElementById('no-announcements-message');

if (announcementSearchInput && announcementOrgSelect) {
    const announcementCards = document.querySelectorAll('.announcement-card');

    function applyAnnouncementFilters() {
        const searchTerm = announcementSearchInput.value.trim().toLowerCase();
        const selectedOrg = announcementOrgSelect.value;

        let visibleCount = 0;

        announcementCards.forEach(function (card) {
            const title = card.querySelector('.announcement-title').textContent.trim().toLowerCase();
            const description = card.querySelector('.announcement-description').textContent.trim().toLowerCase();
            const category = card.querySelector('.announcement-category').textContent.trim().toLowerCase();
            const cardOrg = card.dataset.org;

            const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm);
            const matchesOrg = selectedOrg === 'all' || cardOrg === selectedOrg;
            const shouldShow = matchesSearch && matchesOrg;

            card.style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
        });

        noAnnouncementsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    announcementSearchInput.addEventListener('input', applyAnnouncementFilters);
    announcementOrgSelect.addEventListener('change', applyAnnouncementFilters);

    announcementSearchInput.closest('form').addEventListener('submit', function (event) {
        event.preventDefault();
        applyAnnouncementFilters();
    });
}

