/**
 * Tanner-San's Restaurant Map - Google Maps Integration
 * This file handles all Google Maps functionality for the restaurant map application.
 */

// Global variables
let map;
let markers = {
    hotels: [],
    restaurants: []
};
let infoWindows = [];
let bounds;
let hotels = [];
let restaurants = {};
let activeHotelId = null;

// Constants
const JAPAN_CENTER = { lat: 36.2048, lng: 138.2529 }; // Center of Japan
const DEFAULT_ZOOM = 5;
const HOTEL_ICON = {
    path: 'M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z',
    fillColor: '#1a237e',
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#ffffff',
    scale: 1.5,
    anchor: new google.maps.Point(12, 22)
};
const RESTAURANT_ICON = {
    path: 'M11,9H9V2H7v7H5V2H3v7c0,2.12,1.66,3.84,3.75,3.97V22h2.5v-9.03C11.34,12.84,13,11.12,13,9V2h-2V9z M16,6v8h2.5v8H21V2C18.24,2,16,4.24,16,6z',
    fillColor: '#e53935',
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#ffffff',
    scale: 1.2,
    anchor: new google.maps.Point(12, 22)
};
const API_KEY = 'AIzaSyC_dnnFGFE5JywDXFYXawG_CcFmgdFf_pc';

/**
 * Initialize the Google Maps API
 */
function initMap() {
    // Create a map centered on Japan
    map = new google.maps.Map(document.getElementById('map'), {
        center: JAPAN_CENTER,
        zoom: DEFAULT_ZOOM,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        styles: [
            {
                featureType: 'poi',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                elementType: 'labels.icon',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    bounds = new google.maps.LatLngBounds();
    
    // Load data and initialize markers
    loadData();
}

/**
 * Load hotel and restaurant data from JSON files
 */
async function loadData() {
    try {
        // Fetch hotels data
        const hotelsResponse = await fetch('../data/hotels.json');
        hotels = await hotelsResponse.json();
        
        // Fetch restaurants data
        const restaurantsResponse = await fetch('../data/restaurants.json');
        const restaurantsData = await restaurantsResponse.json();
        
        // Process restaurants data
        if (restaurantsData.hotels) {
            // Format where restaurants are grouped by hotel
            restaurantsData.hotels.forEach(hotel => {
                restaurants[hotel.id] = hotel.restaurants;
            });
        }
        
        // Initialize the map with hotels and restaurants
        initializeHotels();
        populateHotelSelect();
        
        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('map').innerHTML = 
            '<div class="error-message">Error loading map data. Please try again later.</div>';
    }
}

/**
 * Initialize hotel markers on the map
 */
function initializeHotels() {
    hotels.forEach(hotel => {
        addHotelMarker(hotel);
    });
    
    // Fit map to show all hotel markers
    if (markers.hotels.length > 0) {
        map.fitBounds(bounds);
        
        // If there's only one hotel, zoom out a bit
        if (markers.hotels.length === 1) {
            google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
                map.setZoom(Math.min(15, map.getZoom()));
            });
        }
    }
}

/**
 * Add a hotel marker to the map
 * @param {Object} hotel - Hotel data object
 */
function addHotelMarker(hotel) {
    const position = new google.maps.LatLng(hotel.lat, hotel.lng);
    
    // Create marker
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: hotel.name,
        icon: HOTEL_ICON,
        animation: google.maps.Animation.DROP,
        optimized: true,
        zIndex: 100
    });
    
    // Create info window content
    const content = `
        <div class="info-window hotel-info">
            <h3>${hotel.name}</h3>
            <p>${hotel.address}</p>
            <p class="info-description">${hotel.description}</p>
            <div class="info-actions">
                <a href="${hotel.website}" target="_blank" class="btn btn-sm">Visit Website</a>
                <button class="btn btn-sm btn-primary show-restaurants" data-hotel-id="${hotel.id}">
                    Show Nearby Restaurants
                </button>
            </div>
        </div>
    `;
    
    // Create info window
    const infoWindow = new google.maps.InfoWindow({
        content: content,
        maxWidth: 300
    });
    
    // Add click event to marker
    marker.addListener('click', () => {
        // Close all open info windows
        closeAllInfoWindows();
        
        // Open this info window
        infoWindow.open(map, marker);
        
        // Add event listener to "Show Nearby Restaurants" button
        setTimeout(() => {
            const showRestaurantsBtn = document.querySelector('.show-restaurants');
            if (showRestaurantsBtn) {
                showRestaurantsBtn.addEventListener('click', () => {
                    const hotelId = showRestaurantsBtn.getAttribute('data-hotel-id');
                    showRestaurantsForHotel(hotelId);
                    
                    // Update the hotel select dropdown
                    document.getElementById('hotel-select').value = hotelId;
                    
                    // Trigger the change event
                    const event = new Event('change');
                    document.getElementById('hotel-select').dispatchEvent(event);
                });
            }
        }, 300);
    });
    
    // Store marker and info window
    markers.hotels.push(marker);
    infoWindows.push(infoWindow);
    
    // Extend bounds to include this marker
    bounds.extend(position);
}

/**
 * Show restaurants for a specific hotel
 * @param {string} hotelId - ID of the hotel
 */
function showRestaurantsForHotel(hotelId) {
    // Clear existing restaurant markers
    clearRestaurantMarkers();
    
    // Get the hotel
    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return;
    
    // Get restaurants for this hotel
    const hotelRestaurants = restaurants[hotelId];
    if (!hotelRestaurants || hotelRestaurants.length === 0) {
        console.warn(`No restaurants found for hotel: ${hotelId}`);
        return;
    }
    
    // Create new bounds to fit hotel and its restaurants
    const newBounds = new google.maps.LatLngBounds();
    
    // Add hotel position to bounds
    newBounds.extend(new google.maps.LatLng(hotel.lat, hotel.lng));
    
    // Add restaurant markers
    hotelRestaurants.forEach(restaurant => {
        addRestaurantMarker(restaurant, hotel);
        newBounds.extend(new google.maps.LatLng(restaurant.lat, restaurant.lng));
    });
    
    // Fit map to show hotel and its restaurants
    map.fitBounds(newBounds);
    
    // Set active hotel ID
    activeHotelId = hotelId;
}

/**
 * Add a restaurant marker to the map
 * @param {Object} restaurant - Restaurant data object
 * @param {Object} hotel - Associated hotel data object
 */
function addRestaurantMarker(restaurant, hotel) {
    const position = new google.maps.LatLng(restaurant.lat, restaurant.lng);
    
    // Calculate distance from hotel
    const distance = calculateDistance(
        hotel.lat, hotel.lng,
        restaurant.lat, restaurant.lng
    );
    
    // Create marker
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: restaurant.name,
        icon: RESTAURANT_ICON,
        animation: google.maps.Animation.DROP,
        optimized: true
    });
    
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
            !['point_of_interest', 'establishment', 'food'].includes(type)
        );
        cuisineTypes = relevantTypes
            .map(type => type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '))
            .join(', ');
    }
    
    // Create rating stars
    const stars = '★'.repeat(Math.floor(restaurant.rating || 0)) + 
                  '☆'.repeat(5 - Math.floor(restaurant.rating || 0));
    
    // Create info window content
    const content = `
        <div class="info-window restaurant-info">
            <h3>${restaurant.name}</h3>
            <div class="restaurant-rating">
                <span class="stars">${stars}</span>
                <span class="rating-value">${restaurant.rating || 'N/A'}</span>
                ${restaurant.user_ratings_total ? 
                    `<span class="rating-count">(${restaurant.user_ratings_total} reviews)</span>` : 
                    ''}
            </div>
            ${cuisineTypes ? `<p class="cuisine-types">${cuisineTypes}</p>` : ''}
            ${priceLevel ? `<p class="price-level">${priceLevel}</p>` : ''}
            <p class="distance">${distance.toFixed(1)} miles from ${hotel.name}</p>
            <p class="address">${restaurant.vicinity || restaurant.address || ''}</p>
            <div class="info-actions">
                ${restaurant.website ? 
                    `<a href="${restaurant.website}" target="_blank" class="btn btn-sm">Website</a>` : 
                    ''}
                <a href="https://www.google.com/maps/dir/?api=1&origin=${hotel.lat},${hotel.lng}&destination=${restaurant.lat},${restaurant.lng}&travelmode=walking" 
                   target="_blank" class="btn btn-sm btn-secondary">Directions</a>
            </div>
        </div>
    `;
    
    // Create info window
    const infoWindow = new google.maps.InfoWindow({
        content: content,
        maxWidth: 300
    });
    
    // Add click event to marker
    marker.addListener('click', () => {
        // Close all open info windows
        closeAllInfoWindows();
        
        // Open this info window
        infoWindow.open(map, marker);
    });
    
    // Store marker and info window
    markers.restaurants.push(marker);
    infoWindows.push(infoWindow);
}

/**
 * Clear all restaurant markers from the map
 */
function clearRestaurantMarkers() {
    markers.restaurants.forEach(marker => {
        marker.setMap(null);
    });
    markers.restaurants = [];
}

/**
 * Close all open info windows
 */
function closeAllInfoWindows() {
    infoWindows.forEach(infoWindow => {
        infoWindow.close();
    });
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

/**
 * Populate the hotel select dropdown
 */
function populateHotelSelect() {
    const hotelSelect = document.getElementById('hotel-select');
    if (!hotelSelect) return;
    
    // Clear existing options except the first one
    while (hotelSelect.options.length > 1) {
        hotelSelect.remove(1);
    }
    
    // Add hotel options
    hotels.forEach(hotel => {
        const option = document.createElement('option');
        option.value = hotel.id;
        option.textContent = hotel.name;
        hotelSelect.appendChild(option);
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Hotel select change event
    const hotelSelect = document.getElementById('hotel-select');
    if (hotelSelect) {
        hotelSelect.addEventListener('change', (event) => {
            const hotelId = event.target.value;
            
            if (hotelId) {
                // Show restaurants for selected hotel
                showRestaurantsForHotel(hotelId);
            } else {
                // Show all hotels, hide all restaurants
                clearRestaurantMarkers();
                map.fitBounds(bounds);
                activeHotelId = null;
            }
        });
    }
}

/**
 * Handle Google Maps API loading errors
 */
function handleMapError() {
    console.error('Google Maps failed to load');
    document.getElementById('map').innerHTML = 
        '<div class="error-message">Failed to load Google Maps. Please check your internet connection and try again.</div>';
}

// Load Google Maps API
function loadGoogleMapsAPI() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap`;
    script.defer = true;
    script.async = true;
    script.onerror = handleMapError;
    document.head.appendChild(script);
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', loadGoogleMapsAPI);

// Export functions for use in other scripts
window.mapFunctions = {
    showRestaurantsForHotel,
    getActiveHotelId: () => activeHotelId,
    getHotels: () => hotels,
    getRestaurants: () => restaurants
};