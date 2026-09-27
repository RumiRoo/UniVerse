// ORGANIZATION
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

            const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);

            // Category condition: either "All Organizations" is selected
            // or the card's category matches the dropdown's selection
            const matchesCategory = selectedCategory === 'all' || cardCategory === selectedCategory;

            // Card only shows if both conditions are true
            const shouldShow = matchesSearch && matchesCategory;

            if (shouldShow) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    searchInput.addEventListener('input', applyFilters);
    categorySelect.addEventListener('change', applyFilters);

    searchInput.closest('form').addEventListener('submit', function (event) {
        event.preventDefault();
        applyFilters();
    });

}

// Join + Leave orgs
// runs only on organization profile pages)

const joinButton = document.querySelector('#org-profile-banner .join-button');

if (joinButton) {
    const orgId = document.body.dataset.org; // For ex. "digital-fort"

    // Remember which orgs the student joined even after refreshing
    const joinedOrgs = JSON.parse(localStorage.getItem('joinedOrgs')) || [];

    // If this org was already joined before, show on page load
    if (joinedOrgs.includes(orgId)) {
        joinButton.textContent = 'Joined';
        joinButton.classList.add('joined');
    }

    joinButton.addEventListener('click', function (event) {
        event.preventDefault(); // stops the form from reloading the page

        const isJoined = joinButton.classList.contains('joined');

        if (isJoined) {
            // Leave
            joinButton.textContent = 'Join Organization';
            joinButton.classList.remove('joined');
            const index = joinedOrgs.indexOf(orgId);
            if (index !== -1) joinedOrgs.splice(index, 1);
        } else {
            // Join
            joinButton.textContent = 'Joined';
            joinButton.classList.add('joined');
            joinedOrgs.push(orgId);
        }

        localStorage.setItem('joinedOrgs', JSON.stringify(joinedOrgs));
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

// Only runs on announcement-details.html
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
        // Fill in the page with this announcement's real content
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