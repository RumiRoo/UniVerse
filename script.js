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
            joinButton.textContent = 'Joined ✓';
            joinButton.classList.add('joined');
            joinedOrgs.push(orgId);
        }

        localStorage.setItem('joinedOrgs', JSON.stringify(joinedOrgs));
    });
}