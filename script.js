// Search + Filter orgs
const searchInput = document.getElementById('organization-search');
const categorySelect = document.getElementById('category');
const orgCards = document.querySelectorAll('.organization-card');
const noResultsMessage = document.getElementById('no-results-message');

<<<<<<< HEAD
if (searchInput && categorySelect) {
=======
if (searchInput && categorySelect) {    
>>>>>>> main
    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCategory = categorySelect.value;

        let visibleCount = 0;

        orgCards.forEach(function (card) {
            const title = card.querySelector('.org-title').textContent.toLowerCase();
            const description = card.querySelector('.org-description').textContent.toLowerCase();
            const cardCategory = card.dataset.category;

<<<<<<< HEAD
            const matchesSearch =
                title.includes(searchTerm) ||
                description.includes(searchTerm);

            const matchesCategory =
                selectedCategory === 'all' ||
                cardCategory === selectedCategory;

            const shouldShow =
                matchesSearch && matchesCategory;
=======
            const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);

            // Category condition: either "All Organizations" is selected
            // or the card's category matches the dropdown's selection
            const matchesCategory = selectedCategory === 'all' || cardCategory === selectedCategory;

            // Card only shows if both conditions are true
            const shouldShow = matchesSearch && matchesCategory;
>>>>>>> main

            if (shouldShow) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

<<<<<<< HEAD
        if (noResultsMessage) {
            noResultsMessage.style.display =
                visibleCount === 0 ? 'block' : 'none';
        }
=======
        noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
>>>>>>> main
    }

    searchInput.addEventListener('input', applyFilters);
    categorySelect.addEventListener('change', applyFilters);

    searchInput.closest('form').addEventListener('submit', function (event) {
        event.preventDefault();
        applyFilters();
    });
<<<<<<< HEAD
}


// Join + Leave orgs
// Runs only on organization profile pages
=======

}

// Join + Leave orgs
// runs only on organization profile pages)
>>>>>>> main

const joinButton = document.querySelector('#org-profile-banner .join-button');

if (joinButton) {
<<<<<<< HEAD
    const orgId = document.body.dataset.org;

    const joinedOrgs =
        JSON.parse(localStorage.getItem('joinedOrgs')) || [];

=======
    const orgId = document.body.dataset.org; // For ex. "digital-fort"

    // Remember which orgs the student joined even after refreshing
    const joinedOrgs = JSON.parse(localStorage.getItem('joinedOrgs')) || [];

    // If this org was already joined before, show on page load
>>>>>>> main
    if (joinedOrgs.includes(orgId)) {
        joinButton.textContent = 'Joined';
        joinButton.classList.add('joined');
    }

    joinButton.addEventListener('click', function (event) {
<<<<<<< HEAD
        event.preventDefault();

        const isJoined =
            joinButton.classList.contains('joined');

        if (isJoined) {

            // Leave
            joinButton.textContent = 'Join Organization';
            joinButton.classList.remove('joined');

            const index = joinedOrgs.indexOf(orgId);

            if (index !== -1) {
                joinedOrgs.splice(index, 1);
            }

        } else {

=======
        event.preventDefault(); // stops the form from reloading the page

        const isJoined = joinButton.classList.contains('joined');

        if (isJoined) {
            // Leave
            joinButton.textContent = 'Join Organization';
            joinButton.classList.remove('joined');
            const index = joinedOrgs.indexOf(orgId);
            if (index !== -1) joinedOrgs.splice(index, 1);
        } else {
>>>>>>> main
            // Join
            joinButton.textContent = 'Joined ✓';
            joinButton.classList.add('joined');
            joinedOrgs.push(orgId);
<<<<<<< HEAD

        }

        localStorage.setItem(
            'joinedOrgs',
            JSON.stringify(joinedOrgs)
        );
=======
        }

        localStorage.setItem('joinedOrgs', JSON.stringify(joinedOrgs));
>>>>>>> main
    });
}


<<<<<<< HEAD
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
=======

// Search + Filter Events
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
>>>>>>> main

        let visibleCount = 0;

        eventCards.forEach(function (card) {
<<<<<<< HEAD

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
=======
            const title = card.querySelector('.event-title').textContent.toLowerCase();
            const description = card.querySelector('.event-description').textContent.toLowerCase();
            
            const cardCategories = card.dataset.categories ? card.dataset.categories.split(',').map(c => c.trim().toLowerCase()) : [];
            const cardStatus = card.dataset.status ? card.dataset.status.trim().toLowerCase() : '';

            const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
            const matchesCategory = selectedCategory === 'all' || cardCategories.includes(selectedCategory.toLowerCase());
            const matchesStatus = selectedStatus === 'all' || cardStatus === selectedStatus.toLowerCase();

            const shouldShow = matchesSearch && matchesCategory && matchesStatus;
>>>>>>> main

            if (shouldShow) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (noEventsMessage) {
<<<<<<< HEAD
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

=======
            noEventsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    eventSearch.addEventListener('input', applyEventFilters);
    eventCategorySelect.addEventListener('change', applyEventFilters);

    statusFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            statusFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedStatus = button.dataset.value;
>>>>>>> main
            applyEventFilters();
        });
    });

<<<<<<< HEAD
    const eventForm =
        eventSearch.closest('form');

    if (eventForm) {
        eventForm.addEventListener(
            'submit',
            function (event) {
                event.preventDefault();
                applyEventFilters();
            }
        );
    }
}



// ======================================================
// ANNOUNCEMENTS: Search + Organization Filter
// ======================================================

const announcementSearch =
    document.getElementById('announcement-search');

const announcementOrganization =
    document.getElementById('announcement-organization');

const announcementCards =
    document.querySelectorAll('.announcement-card');

const noAnnouncementsMessage =
    document.getElementById('no-announcements-message');

if (announcementSearch && announcementOrganization) {

    function applyAnnouncementFilters() {

        const searchTerm =
            announcementSearch.value
                .trim()
                .toLowerCase();

        const selectedOrganization =
            announcementOrganization.value;

        let visibleCount = 0;

        announcementCards.forEach(function (card) {

            const titleElement =
                card.querySelector('.announcement-title');

            const descriptionElement =
                card.querySelector('.announcement-description');

            const title =
                titleElement
                    ? titleElement.textContent.toLowerCase()
                    : '';

            const description =
                descriptionElement
                    ? descriptionElement.textContent.toLowerCase()
                    : '';

            const organization =
                card.dataset.organization
                    ? card.dataset.organization.toLowerCase()
                    : '';

            const matchesSearch =
                title.includes(searchTerm) ||
                description.includes(searchTerm);

            const matchesOrganization =
                selectedOrganization === 'all' ||
                organization === selectedOrganization.toLowerCase();

            const shouldShow =
                matchesSearch &&
                matchesOrganization;

            if (shouldShow) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (noAnnouncementsMessage) {
            noAnnouncementsMessage.style.display =
                visibleCount === 0 ? 'block' : 'none';
        }
    }


    // Search while typing
    announcementSearch.addEventListener(
        'input',
        applyAnnouncementFilters
    );


    // Filter when organization changes
    announcementOrganization.addEventListener(
        'change',
        applyAnnouncementFilters
    );


    // Prevent page refresh when Search is clicked
    const announcementForm =
        announcementSearch.closest('form');

    if (announcementForm) {

        announcementForm.addEventListener(
            'submit',
            function (event) {

                event.preventDefault();

                applyAnnouncementFilters();
            }
        );
=======
    const eventForm = eventSearch.closest('form');
    if (eventForm) {
        eventForm.addEventListener('submit', function (event) {
            event.preventDefault();
            applyEventFilters();
        });
>>>>>>> main
    }
}