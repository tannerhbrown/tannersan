/**
 * Tanner-San's Restaurant Map - Main Application Logic
 * This file handles the restaurant filtering, sorting, and display functionality.
 */

// Global variables
let allRestaurants = {};
let filteredRestaurants = [];
let cuisineTypes = new Set();
let activeFilters = {
    hotel: '',
    cuisine: '',
    rating: 0,
    sort: 'distance',
    sortDirection: 'asc'
};

/**
 * Initialize the application
 */
function initApp() {
    // Set up event listeners for filters
    setupFilterListeners();
    
    // Wait for map to be initialized and data to be loaded
    checkMapDataLoaded();
}

/**
 * Check if map data is loaded and proceed with initialization
 */
function checkMapDataLoaded() {
    if (window.mapFunctions && window.mapFunctions.getHotels().length > 0) {
        // Map data is loaded, initialize the restaurant display
        initializeRestaurantDisplay();
    } else {
        // Wait and check again
        setTimeout(checkMapDataLoaded, 500);
    }
}

/**
 * Initialize the restaurant display
 */
function initializeRestaurantDisplay() {
    // Get hotels and restaurants from map.js
    const hotels = window.mapFunctions.getHotels();
    allRestaurants = window.mapFunctions.getRestaurants();
    
    // Extract all cuisine types
    extractCuisineTypes();
    
    // Populate cuisine filter
    populateCuisineFilter();
    
    // Update restaurant display
    updateRestaurantDisplay();
    
    // Add sort direction toggle
    addSortDirectionToggle();
}

/**
 * Extract all unique cuisine types from restaurants
 */
function extractCuisineTypes() {
    cuisineTypes.clear();
    
    // Iterate through all restaurants for all hotels
    Object.values(allRestaurants).forEach(hotelRestaurants => {
        hotelRestaurants.forEach(restaurant => {
            if (restaurant.types && restaurant.types.length > 0) {
                // Filter out generic types
                const relevantTypes = restaurant.types.filter(type => 
                    !['point_of_interest', 'establishment', 'food', 'lodging', 'cafe'].includes(type)
                );
                
                // Add relevant types to the set
                relevantTypes.forEach(type => {
                    cuisineTypes.add(type);
                });
            }
        });
    });
}

/**
 * Populate the cuisine filter dropdown
 */
function populateCuisineFilter() {
    const cuisineSelect = document.getElementById('cuisine-select');
    if (!cuisineSelect) return;
    
    // Clear existing options except the first one
    while (cuisineSelect.options.length > 1) {
        cuisineSelect.remove(1);
    }
    
    // Sort cuisine types alphabetically
    const sortedCuisines = Array.from(cuisineTypes).sort();
    
    // Add cuisine options
    sortedCuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.value = cuisine;
        // Format the cuisine name (e.g., "japanese_restaurant" -> "Japanese Restaurant")
        option.textContent = cuisine
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        cuisineSelect.appendChild(option);
    });
}

/**
 * Add sort direction toggle to the sort select
 */
function addSortDirectionToggle() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;
    
    // Create sort direction toggle button
    const sortContainer = sortSelect.parentElement;
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-sm sort-direction';
    toggleBtn.innerHTML = '↓';
    toggleBtn.title = 'Toggle sort direction';
    toggleBtn.setAttribute('aria-label', 'Toggle sort direction');
    
    // Add click event to toggle sort direction
    toggleBtn.addEventListener('click', () => {
        activeFilters.sortDirection = activeFilters.sortDirection === 'asc' ? 'desc' : 'asc';
        toggleBtn.innerHTML = activeFilters.sortDirection === 'asc' ? '↓' : '↑';
        updateRestaurantDisplay();
    });
    
    // Append toggle button to sort container
    sortContainer.style.position = 'relative';
    sortContainer.appendChild(toggleBtn);
    
    // Style the toggle button
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.right = '5px';
    toggleBtn.style.top = '50%';
    toggleBtn.style.transform = 'translateY(-50%)';
    toggleBtn.style.padding = '2px 8px';
    toggleBtn.style.marginTop = '10px';
}

/**
 * Set up event listeners for filters
 */
function setupFilterListeners() {
    // Hotel filter
    const hotelSelect = document.getElementById('hotel-select');
    if (hotelSelect) {
        hotelSelect.addEventListener('change', (e) => {
            activeFilters.hotel = e.target.value;
            updateRestaurantDisplay();
            
            // Update map to show restaurants for selected hotel
            if (window.mapFunctions && e.target.value) {
                window.mapFunctions.showRestaurantsForHotel(e.target.value);
            }
        });
    }
    
    // Cuisine filter
    const cuisineSelect = document.getElementById('cuisine-select');
    if (cuisineSelect) {
        cuisineSelect.addEventListener('change', (e) => {
            activeFilters.cuisine = e.target.value;
            updateRestaurantDisplay();
        });
    }
    
    // Rating filter
    const ratingSelect = document.getElementById('rating-select');
    if (ratingSelect) {
        ratingSelect.addEventListener('change', (e) => {
            activeFilters.rating = parseFloat(e.target.value);
            updateRestaurantDisplay();
        });
    }
    
    // Sort filter
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            activeFilters.sort = e.target.value;
            updateRestaurantDisplay();
        });
    }
}

/**
 * Update the restaurant display based on current filters
 */
function updateRestaurantDisplay() {
    // Get filter values
    const hotelId = activeFilters.hotel;
    const cuisineType = activeFilters.cuisine;
    const minRating = activeFilters.rating;
    const sortBy = activeFilters.sort;
    const sortDirection = activeFilters.sortDirection;
    
    // Filter restaurants
    filteredRestaurants = filterRestaurants(hotelId, cuisineType, minRating);
    
    // Sort restaurants
    sortRestaurants(filteredRestaurants, sortBy, hotelId, sortDirection);
    
    // Display restaurants
    displayRestaurants(filteredRestaurants, hotelId);
    
    // Update filter results count
    updateFilterResultsCount(filteredRestaurants.length);
    
    // Update map markers based on filters
    updateMapMarkers(filteredRestaurants, hotelId);
}

/**
 * Update the count of filter results
 * @param {number} count - Number of restaurants matching filters
 */
function updateFilterResultsCount(count) {
    // Check if results count element exists, if not create it
    let resultsCount = document.querySelector('.filter-results-count');
    if (!resultsCount) {
        resultsCount = document.createElement('div');
        resultsCount.className = 'filter-results-count';
        
        // Insert after filters container
        const filtersContainer = document.querySelector('.filters-container');
        if (filtersContainer) {
            filtersContainer.parentNode.insertBefore(resultsCount, filtersContainer.nextSibling);
        }
    }
    
    // Update the count text
    resultsCount.textContent = `${count} restaurant${count !== 1 ? 's' : ''} found`;
}

/**
 * Update map markers based on filtered restaurants
 * @param {Array} restaurants - Filtered restaurants
 * @param {string} hotelId - Selected hotel ID
 */
function updateMapMarkers(restaurants, hotelId) {
    // This function would ideally interact with map.js to update markers
    // For now, we'll just ensure the right hotel's restaurants are shown
    
    if (window.mapFunctions && window.mapFunctions.getActiveHotelId() !== hotelId && hotelId) {
        window.mapFunctions.showRestaurantsForHotel(hotelId);
    }
    
    // TODO: Implement more sophisticated marker filtering based on cuisine and rating
    // This would require extending the map.js functionality
}

/**
 * Filter restaurants based on selected criteria
 * @param {string} hotelId - Selected hotel ID
 * @param {string} cuisineType - Selected cuisine type
 * @param {number} minRating - Minimum rating
 * @returns {Array} Filtered restaurants
 */
function filterRestaurants(hotelId, cuisineType, minRating) {
    let filtered = [];
    
    // If no hotel is selected, get all restaurants
    if (!hotelId) {
        Object.entries(allRestaurants).forEach(([id, restaurants]) => {
            // Add hotel ID to each restaurant for reference
            const hotelsWithId = restaurants.map(r => ({...r, hotel_id: id}));
            filtered = filtered.concat(hotelsWithId);
        });
    } else {
        // Get restaurants for the selected hotel
        const hotelRestaurants = allRestaurants[hotelId] || [];
        // Add hotel ID to each restaurant for reference
        filtered = hotelRestaurants.map(r => ({...r, hotel_id: hotelId}));
    }
    
    // Filter by cuisine type
    if (cuisineType) {
        filtered = filtered.filter(restaurant => 
            restaurant.types && restaurant.types.includes(cuisineType)
        );
    }
    
    // Filter by minimum rating
    if (minRating > 0) {
        filtered = filtered.filter(restaurant => 
            restaurant.rating && restaurant.rating >= minRating
        );
    }
    
    return filtered;
}

/**
 * Sort restaurants based on selected criteria
 * @param {Array} restaurants - Restaurants to sort
 * @param {string} sortBy - Sort criteria
 * @param {string} hotelId - Selected hotel ID
 * @param {string} direction - Sort direction ('asc' or 'desc')
 */
function sortRestaurants(restaurants, sortBy, hotelId, direction = 'asc') {
    // Get the selected hotel for distance calculation
    const selectedHotel = window.mapFunctions.getHotels().find(h => h.id === hotelId);
    const directionMultiplier = direction === 'asc' ? 1 : -1;
    
    switch (sortBy) {
        case 'rating':
            // Sort by rating
            restaurants.sort((a, b) => directionMultiplier * ((b.rating || 0) - (a.rating || 0)));
            break;
            
        case 'name':
            // Sort by name
            restaurants.sort((a, b) => directionMultiplier * a.name.localeCompare(b.name));
            break;
            
        case 'price':
            // Sort by price level
            restaurants.sort((a, b) => directionMultiplier * ((a.price_level || 0) - (b.price_level || 0)));
            break;
            
        case 'distance':
        default:
            // Sort by distance from hotel (if a hotel is selected)
            if (selectedHotel) {
                restaurants.sort((a, b) => {
                    const distA = calculateDistance(
                        selectedHotel.lat, selectedHotel.lng,
                        a.lat, a.lng
                    );
                    const distB = calculateDistance(
                        selectedHotel.lat, selectedHotel.lng,
                        b.lat, b.lng
                    );
                    return directionMultiplier * (distA - distB);
                });
            }
            break;
    }
}

/**
 * Display restaurants in the restaurant container
 * @param {Array} restaurants - Restaurants to display
 * @param {string} hotelId - Selected hotel ID
 */
function displayRestaurants(restaurants, hotelId) {
    const container = document.getElementById('restaurants-container');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // If no restaurants match the filters
    if (restaurants.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <p>No restaurants found matching your criteria.</p>
                <p>Try adjusting your filters.</p>
            </div>
        `;
        return;
    }
    
    // Get the selected hotel for distance calculation
    const hotels = window.mapFunctions.getHotels();
    
    // Create and append restaurant cards
    restaurants.forEach(restaurant => {
        // Get the associated hotel
        const hotel = hotels.find(h => h.id === (hotelId || restaurant.hotel_id));
        
        // Calculate distance from hotel
        let distance = 0;
        if (hotel) {
            distance = calculateDistance(
                hotel.lat, hotel.lng,
                restaurant.lat, restaurant.lng
            );
        }
        
        // Create restaurant card
        const card = createRestaurantCard(restaurant, hotel, distance);
        container.appendChild(card);
    });
    
    // Add lazy loading for images
    lazyLoadImages();
}

/**
 * Create a restaurant card element
 * @param {Object} restaurant - Restaurant data
 * @param {Object} hotel - Associated hotel
 * @param {number} distance - Distance from hotel in miles
 * @returns {HTMLElement} Restaurant card element
 */
function createRestaurantCard(restaurant, hotel, distance) {
    // Create card element
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.setAttribute('data-place-id', restaurant.place_id);
    
    // Create price level string
    let priceLevel = '';
    if (restaurant.price_level) {
        priceLevel = '¥'.repeat(restaurant.price_level);
    }
    
    // Create cuisine type string
    let cuisineTypes = '';
    if (restaurant.types && restaurant.types.length > 0) {
        // Filter out generic types
        const relevantTypes = restaurant.types.filter(type => 
            !['point_of_interest', 'establishment', 'food', 'lodging', 'cafe'].includes(type)
        );
        cuisineTypes = relevantTypes
            .map(type => type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '))
            .join(' • ');
    }
    
    // Create rating stars
    const stars = '★'.repeat(Math.floor(restaurant.rating || 0)) + 
                  '☆'.repeat(5 - Math.floor(restaurant.rating || 0));
    
    // Check for special features like Michelin stars (this would be in the data if available)
    const specialFeatures = restaurant.michelin_stars ? 
        `<div class="special-feature michelin">
            <span class="michelin-stars">Michelin ${restaurant.michelin_stars === 1 ? 'Star' : 'Stars'}</span>
        </div>` : '';
    
    // Set card HTML
    card.innerHTML = `
        <div class="restaurant-image-container">
            ${restaurant.photos && restaurant.photos.length > 0 ?
                `<img data-src="https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${restaurant.photos[0]}&key=AIzaSyC_dnnFGFE5JywDXFYXawG_CcFmgdFf_pc" alt="${restaurant.name}" class="restaurant-image lazy">
                <div class="image-placeholder"></div>` :
                `<div class="restaurant-image-placeholder"></div>`
            }
            ${specialFeatures}
        </div>
        <div class="restaurant-info">
            <h3 class="restaurant-name">${restaurant.name}</h3>
            <div class="restaurant-rating">
                <span class="stars">${stars}</span>
                <span class="rating-value">${restaurant.rating || 'N/A'}</span>
                ${restaurant.user_ratings_total ? 
                    `<span class="rating-count">(${restaurant.user_ratings_total})</span>` : 
                    ''}
            </div>
            ${cuisineTypes ? `<p class="restaurant-cuisine">${cuisineTypes}</p>` : ''}
            ${hotel ? `<p class="restaurant-distance">${distance.toFixed(1)} miles from ${hotel.name}</p>` : ''}
            ${priceLevel ? `<p class="restaurant-price">${priceLevel}</p>` : ''}
            <div class="restaurant-actions">
                <button class="btn btn-primary view-details" data-place-id="${restaurant.place_id}">View Details</button>
                ${hotel ? 
                    `<a href="https://www.google.com/maps/dir/?api=1&origin=${hotel.lat},${hotel.lng}&destination=${restaurant.lat},${restaurant.lng}&travelmode=walking" target="_blank" class="btn btn-secondary">Directions</a>` : 
                    ''}
            </div>
        </div>
    `;
    
    // Add event listener to "View Details" button
    const viewDetailsBtn = card.querySelector('.view-details');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => {
            showRestaurantDetails(restaurant, hotel, distance);
            highlightRestaurantOnMap(restaurant);
        });
    }
    
    return card;
}

/**
 * Show detailed information about a restaurant in a modal
 * @param {Object} restaurant - Restaurant data
 * @param {Object} hotel - Associated hotel
 * @param {number} distance - Distance from hotel in miles
 */
function showRestaurantDetails(restaurant, hotel, distance) {
    // Check if modal already exists, if not create it
    let modal = document.getElementById('restaurant-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'restaurant-details-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
        
        // Add modal styles if not already in CSS
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0,0,0,0.7);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .modal.show {
                opacity: 1;
            }
            .modal-content {
                background-color: white;
                margin: 10% auto;
                padding: 20px;
                border-radius: 8px;
                width: 80%;
                max-width: 600px;
                position: relative;
                transform: translateY(-20px);
                transition: transform 0.3s ease;
            }
            .modal.show .modal-content {
                transform: translateY(0);
            }
            .close-modal {
                position: absolute;
                right: 15px;
                top: 10px;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
            }
            .restaurant-details-image {
                width: 100%;
                height: 200px;
                object-fit: cover;
                border-radius: 4px;
                margin-bottom: 15px;
            }
            .restaurant-details-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 15px;
            }
            .restaurant-details-info {
                margin-bottom: 20px;
            }
            .restaurant-details-info p {
                margin: 5px 0;
            }
            .restaurant-details-hours {
                margin-bottom: 20px;
            }
            .restaurant-details-hours h4 {
                margin-bottom: 10px;
            }
            .restaurant-details-hours ul {
                list-style: none;
                padding: 0;
            }
            .restaurant-details-hours li {
                padding: 3px 0;
            }
            .restaurant-details-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create price level string
    let priceLevel = '';
    if (restaurant.price_level) {
        priceLevel = '¥'.repeat(restaurant.price_level);
    }
    
    // Create cuisine type string
    let cuisineTypes = '';
    if (restaurant.types && restaurant.types.length > 0) {
        // Filter out generic types
        const relevantTypes = restaurant.types.filter(type => 
            !['point_of_interest', 'establishment', 'food', 'lodging', 'cafe'].includes(type)
        );
        cuisineTypes = relevantTypes
            .map(type => type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '))
            .join(', ');
    }
    
    // Create rating stars
    const stars = '★'.repeat(Math.floor(restaurant.rating || 0)) + 
                  '☆'.repeat(5 - Math.floor(restaurant.rating || 0));
    
    // Format opening hours
    let openingHoursHtml = '';
    if (restaurant.opening_hours && restaurant.opening_hours.weekday_text) {
        openingHoursHtml = `
            <div class="restaurant-details-hours">
                <h4>Opening Hours</h4>
                <ul>
                    ${restaurant.opening_hours.weekday_text.map(day => `<li>${day}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            
            ${restaurant.photos && restaurant.photos.length > 0 ?
                `<img src="https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${restaurant.photos[0]}&key=AIzaSyC_dnnFGFE5JywDXFYXawG_CcFmgdFf_pc" alt="${restaurant.name}" class="restaurant-details-image">` :
                ''
            }
            
            <div class="restaurant-details-header">
                <h3>${restaurant.name}</h3>
                <div class="restaurant-rating">
                    <span class="stars">${stars}</span>
                    <span class="rating-value">${restaurant.rating || 'N/A'}</span>
                    ${restaurant.user_ratings_total ? 
                        `<span class="rating-count">(${restaurant.user_ratings_total} reviews)</span>` : 
                        ''}
                </div>
            </div>
            
            <div class="restaurant-details-info">
                ${cuisineTypes ? `<p><strong>Cuisine:</strong> ${cuisineTypes}</p>` : ''}
                ${priceLevel ? `<p><strong>Price Level:</strong> ${priceLevel}</p>` : ''}
                ${hotel ? `<p><strong>Distance:</strong> ${distance.toFixed(1)} miles from ${hotel.name}</p>` : ''}
                <p><strong>Address:</strong> ${restaurant.vicinity || restaurant.address || 'N/A'}</p>
                ${restaurant.phone ? `<p><strong>Phone:</strong> ${restaurant.phone}</p>` : ''}
            </div>
            
            ${openingHoursHtml}
            
            <div class="restaurant-details-actions">
                ${restaurant.website ? 
                    `<a href="${restaurant.website}" target="_blank" class="btn btn-primary">Visit Website</a>` : 
                    ''}
                ${hotel ? 
                    `<a href="https://www.google.com/maps/dir/?api=1&origin=${hotel.lat},${hotel.lng}&destination=${restaurant.lat},${restaurant.lng}&travelmode=walking" target="_blank" class="btn btn-secondary">Get Directions</a>` : 
                    ''}
            </div>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Add close functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
    
    // Close when clicking outside the modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    });
}

/**
 * Implement lazy loading for restaurant images
 */
function lazyLoadImages() {
    const lazyImages = document.querySelectorAll('img.lazy');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    img.parentElement.querySelector('.image-placeholder')?.remove();
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            img.parentElement.querySelector('.image-placeholder')?.remove();
        });
    }
}

/**
 * Highlight a restaurant on the map
 * @param {Object} restaurant - Restaurant to highlight
 */
function highlightRestaurantOnMap(restaurant) {
    // Center the map on the restaurant
    const map = window.google && window.google.maps && window.google.maps.Map ? 
        document.getElementById('map').__gm_map : null;
    
    if (map) {
        map.setCenter(new google.maps.LatLng(restaurant.lat, restaurant.lng));
        map.setZoom(17);
        
        // TODO: Find and click the marker for this restaurant
        // This would require keeping track of markers by place_id in map.js
    }
}

/**
 * Calculate distance between two points using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);