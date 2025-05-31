# Tanner-San's Restaurant Map

## Project Overview and Purpose

Tanner-San's Restaurant Map is an interactive web application designed to help travelers find quality dining options near selected hotels in Japan. The application displays restaurants within a 5-mile radius of chosen hotels, providing essential information such as cuisine type, ratings, price levels, and distance. With its minimalist Japanese-influenced design, the application offers an intuitive and aesthetically pleasing user experience.

## Features and Functionality

### Core Features
1. **Interactive Google Maps Integration**
   - Dynamic map displaying hotels and nearby restaurants
   - Custom markers for hotels (blue) and restaurants (red)
   - Interactive info windows with key information
   - Automatic map centering and bounds adjustment

2. **Advanced Filtering System**
   - Filter by hotel proximity
   - Filter by cuisine type (automatically populated from available data)
   - Filter by minimum rating (3+, 4+, or 4.5+ stars)
   - Results count display

3. **Flexible Sorting Options**
   - Sort by distance from hotel
   - Sort by rating
   - Sort by restaurant name
   - Sort by price level
   - Toggle ascending/descending order

4. **Detailed Restaurant Information**
   - Restaurant name, rating, and review count
   - Cuisine types
   - Distance from selected hotel
   - Price level indicator
   - Operating hours
   - Contact information
   - Links to website and directions

5. **Responsive Design**
   - Optimized for desktop, tablet, and mobile devices
   - Adaptive layout based on screen size
   - Touch-friendly controls for mobile users

### User Interaction Flow
1. User selects a hotel from the dropdown menu
2. Map centers on the selected hotel and displays nearby restaurants
3. User can filter restaurants by cuisine type and rating
4. User can sort restaurants by various criteria
5. User can click on restaurant markers or cards for more information
6. User can get directions to restaurants from the selected hotel

## Technical Architecture

### Front-End Components
- **HTML5**: Semantic structure for content organization
- **CSS3**: Styling with responsive design principles
- **JavaScript**: Dynamic functionality and user interactions
- **Google Maps API**: Map display and geolocation features

### Data Structure
- **hotels.json**: Contains information about featured hotels
- **restaurants.json**: Contains restaurant data organized by hotel

### Key JavaScript Modules
- **app.js**: Main application logic, handling filtering, sorting, and UI updates
- **map.js**: Google Maps integration, marker management, and geolocation functions

### API Integration
- **Google Maps JavaScript API**: For map display and interaction
- **Google Places API**: For restaurant photos and details

## Directory Structure

```
project/
├── final/                       # Final web application
│   ├── index.html               # Main HTML file
│   ├── css/                     # Stylesheets
│   │   ├── style.css            # Main CSS file
│   │   └── additional-styles.css # Additional styling
│   ├── js/                      # JavaScript files
│   │   ├── map.js               # Google Maps integration
│   │   └── app.js               # Main application logic
│   └── images/                  # Images for UI elements
├── data/                        # Data files
│   ├── hotels.json              # Hotel information
│   └── restaurants.json         # Restaurant data
├── assets/                      # Raw assets
│   └── images/                  # Images for restaurants and UI
└── docs/                        # Documentation
    └── README.md                # Project documentation
```

## Installation and Setup Instructions

### Prerequisites
- Web server (Apache, Nginx, or similar) or local development server
- Google Maps API key (already configured in the application)

### Setup Steps
1. Clone or download the project repository
2. Place the entire project directory on your web server
3. Ensure the server has proper permissions to read all files
4. Access the application through a web browser by navigating to the index.html file

### Local Development Setup
For local development, you can use Python's built-in HTTP server:
```
cd /path/to/project/final
python -m http.server 8000
```
Then access the application at http://localhost:8000

## Usage Instructions

### Selecting a Hotel
1. Use the "Select Hotel" dropdown at the top of the page to choose a hotel
2. The map will automatically center on the selected hotel and display nearby restaurants
3. Restaurant cards will update to show restaurants near the selected hotel

### Filtering Restaurants
1. Use the "Cuisine Type" dropdown to filter by specific cuisine
2. Use the "Minimum Rating" dropdown to filter by restaurant rating
3. The restaurant count will update to show how many restaurants match your filters

### Sorting Restaurants
1. Use the "Sort By" dropdown to choose sorting criteria (distance, rating, name, or price)
2. Click the arrow button next to the dropdown to toggle between ascending and descending order

### Viewing Restaurant Details
1. Click on a restaurant card or map marker to view detailed information
2. In the detailed view, you can:
   - See photos (if available)
   - View ratings and reviews
   - Check opening hours
   - Visit the restaurant's website
   - Get directions from the selected hotel

### Mobile Usage
1. On mobile devices, the map and restaurant list will stack vertically
2. Use the filter controls at the top to refine your search
3. Tap restaurant cards to expand and view more details

## Design Philosophy

The application follows key Japanese design principles:

### Visual Design Elements
- **Color Palette**:
  - Deep Indigo Blue (#002147): Primary color, representing depth and tradition
  - Vermilion Red (#D9381E): Accent color, adding visual interest
  - Warm White (#F5F5F5): Background color, creating a clean, spacious feel
  - Soft Gray (#D3D3D3): Secondary color for subtle elements
  - Pale Gold (#C0B283): Accent color for ratings and special elements

- **Typography**:
  - Noto Sans JP: Clean, modern sans-serif for body text and UI elements
  - Noto Serif JP: Elegant serif typeface for headings and titles

- **Design Principles**:
  - **Kanso (簡素)**: Simplicity and elimination of clutter
  - **Ma (間)**: Appreciation of negative space
  - **Wabi-sabi (侘寂)**: Embracing subtle imperfection and natural aesthetics

## Future Maintenance Guidelines

### Updating Restaurant Data
To update the restaurant data:
1. Modify the `restaurants.json` file in the `data` directory
2. Follow the existing JSON structure:
   ```json
   {
     "hotels": [
       {
         "id": "hotel-id",
         "name": "Hotel Name",
         "restaurants": [
           {
             "place_id": "unique-place-id",
             "name": "Restaurant Name",
             "address": "Full Address",
             "vicinity": "Short Address",
             "lat": 35.1234,
             "lng": 135.1234,
             "rating": 4.5,
             "user_ratings_total": 100,
             "price_level": 2,
             "types": ["cuisine_type", "restaurant", "food"],
             "photos": ["photo_reference_id"],
             "website": "https://restaurant-website.com",
             "phone": "123-456-7890",
             "opening_hours": {
               "weekday_text": ["Monday: 9:00 AM - 10:00 PM", ...]
             }
           }
         ]
       }
     ]
   }
   ```

### Adding New Hotels
To add a new hotel:
1. Add the hotel information to `hotels.json`:
   ```json
   {
     "id": "new-hotel-id",
     "name": "New Hotel Name",
     "address": "Hotel Address",
     "lat": 35.1234,
     "lng": 135.1234,
     "description": "Hotel description",
     "website": "https://hotel-website.com"
   }
   ```
2. Create a corresponding entry in `restaurants.json` with nearby restaurants

### Modifying the Google Maps API Key
If you need to update the Google Maps API key:
1. Open `map.js` in the `js` directory
2. Locate the `API_KEY` constant near the top of the file
3. Replace the existing key with your new key

### Adding New Features
When adding new features:
1. Follow the existing code structure and naming conventions
2. Add new CSS in `additional-styles.css` to avoid modifying the core styling
3. Document any new functions or components
4. Test thoroughly across different browsers and devices

## Known Limitations and Issues

1. **API Usage Limits**: The Google Maps API has usage limits. If the application receives high traffic, you may need to upgrade the API plan.

2. **Restaurant Data Freshness**: Restaurant information is stored statically and may become outdated over time. Consider implementing a periodic data refresh mechanism.

3. **Browser Compatibility**: The application is optimized for modern browsers. Some features may not work in older browsers like Internet Explorer.

4. **Mobile Performance**: On some lower-end mobile devices, the map may experience performance issues when displaying many restaurant markers simultaneously.

## Credits and Acknowledgments

- **Google Maps API**: For mapping and location services
- **Noto Fonts**: Provided by Google Fonts
- **Restaurant Data**: Sourced from Google Places API
- **Design Inspiration**: Traditional Japanese design principles

## Troubleshooting

### Common Issues and Solutions

1. **Map Not Loading**
   - Check internet connection
   - Verify the Google Maps API key is valid
   - Clear browser cache and reload

2. **Restaurant Images Not Displaying**
   - Ensure the photo references in the data are valid
   - Check if the Google Places API photo service is working

3. **Filtering Not Working**
   - Check browser console for JavaScript errors
   - Verify the data structure in restaurants.json is correct

4. **Responsive Layout Issues**
   - Test on different devices and browsers
   - Use browser developer tools to identify CSS conflicts