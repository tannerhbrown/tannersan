import json
import time
import math
import requests
from typing import Dict, List, Any

# API key provided in the task
API_KEY = "AIzaSyC_dnnFGFE5JywDXFYXawG_CcFmgdFf_pc"

# Constants
RADIUS_MILES = 5
RADIUS_METERS = int(RADIUS_MILES * 1609.34)  # Convert miles to meters
MAX_RESULTS_PER_HOTEL = 20  # Reduced to avoid timeout
MAX_DETAILS_PER_HOTEL = 10  # Limit detailed API calls per hotel

def load_hotels() -> List[Dict[str, Any]]:
    """Load hotel data from JSON file."""
    with open("hotels.json", "r", encoding="utf-8") as f:
        return json.load(f)

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in kilometers using Haversine formula."""
    # Earth's radius in kilometers
    R = 6371.0
    
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lng1_rad = math.radians(lng1)
    lat2_rad = math.radians(lat2)
    lng2_rad = math.radians(lng2)
    
    # Differences in coordinates
    dlat = lat2_rad - lat1_rad
    dlng = lng2_rad - lng1_rad
    
    # Haversine formula
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return round(distance, 2)

def get_nearby_restaurants(lat: float, lng: float) -> List[Dict[str, Any]]:
    """Get restaurants near a specific location using Google Places API."""
    restaurants = []
    next_page_token = None
    
    # Use a custom user agent to avoid blocking
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    # Make first API call
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": RADIUS_METERS,
        "type": "restaurant",
        "key": API_KEY
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        data = response.json()
        
        if data["status"] != "OK" and data["status"] != "ZERO_RESULTS":
            print(f"Error: {data['status']}")
            if "error_message" in data:
                print(f"Error message: {data['error_message']}")
            return restaurants
        
        # Process results
        if "results" in data:
            restaurants.extend(data["results"])
            print(f"Found {len(restaurants)} restaurants in first page")
            
            # We'll only use the first page to avoid timeout
            # next_page_token = data.get("next_page_token")
                
    except Exception as e:
        print(f"Error fetching nearby restaurants: {e}")
    
    return restaurants[:MAX_RESULTS_PER_HOTEL]  # Limit results

def get_place_details(place_id: str) -> Dict[str, Any]:
    """Get detailed information about a place using its place_id."""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    
    params = {
        "place_id": place_id,
        "fields": "name,formatted_address,geometry,rating,user_ratings_total,price_level,types,website,formatted_phone_number,opening_hours,vicinity",
        "key": API_KEY
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        data = response.json()
        
        if data["status"] == "OK" and "result" in data:
            return data["result"]
        else:
            print(f"Error getting place details: {data['status']}")
            return {}
            
    except Exception as e:
        print(f"Error fetching place details: {e}")
        return {}

def process_restaurant_data(restaurant: Dict[str, Any], hotel_lat: float, hotel_lng: float, get_details: bool = False) -> Dict[str, Any]:
    """Process raw restaurant data into the required format."""
    # Get place details for more comprehensive information if requested
    place_id = restaurant.get("place_id", "")
    details = {}
    if get_details:
        details = get_place_details(place_id)
    
    # Merge basic data with details
    restaurant_data = {**restaurant, **details} if details else restaurant
    
    # Extract coordinates
    lat = restaurant_data.get("geometry", {}).get("location", {}).get("lat")
    lng = restaurant_data.get("geometry", {}).get("location", {}).get("lng")
    
    # Calculate distance from hotel
    distance_km = calculate_distance(hotel_lat, hotel_lng, lat, lng) if lat and lng else None
    
    # Extract photo references (limit to 1 photo to reduce data size)
    photos = []
    if "photos" in restaurant_data and len(restaurant_data["photos"]) > 0:
        photo = restaurant_data["photos"][0]
        if "photo_reference" in photo:
            photos.append(photo["photo_reference"])
    
    # Format opening hours
    opening_hours = {}
    if "opening_hours" in restaurant_data and "weekday_text" in restaurant_data["opening_hours"]:
        opening_hours["weekday_text"] = restaurant_data["opening_hours"]["weekday_text"]
    
    # Create structured restaurant data
    structured_data = {
        "place_id": place_id,
        "name": restaurant_data.get("name", ""),
        "address": restaurant_data.get("formatted_address", ""),
        "vicinity": restaurant_data.get("vicinity", ""),
        "lat": lat,
        "lng": lng,
        "rating": restaurant_data.get("rating"),
        "user_ratings_total": restaurant_data.get("user_ratings_total"),
        "price_level": restaurant_data.get("price_level"),
        "types": restaurant_data.get("types", []),
        "photos": photos,
        "website": restaurant_data.get("website", ""),
        "phone": restaurant_data.get("formatted_phone_number", ""),
        "opening_hours": opening_hours,
        "hotel_distance_km": distance_km
    }
    
    return structured_data

def main():
    """Main function to collect restaurant data for each hotel."""
    hotels = load_hotels()
    result = {"hotels": []}
    
    for hotel in hotels:
        print(f"Processing hotel: {hotel['name']}")
        hotel_data = {
            "id": hotel["id"],
            "name": hotel["name"],
            "restaurants": []
        }
        
        # Get nearby restaurants
        restaurants = get_nearby_restaurants(hotel["lat"], hotel["lng"])
        
        # Process each restaurant
        for i, restaurant in enumerate(restaurants):
            # Only get detailed info for a limited number of restaurants
            get_details = i < MAX_DETAILS_PER_HOTEL
            processed_data = process_restaurant_data(restaurant, hotel["lat"], hotel["lng"], get_details)
            hotel_data["restaurants"].append(processed_data)
            
            # Print progress
            print(f"Processed restaurant {i+1}/{len(restaurants)}: {processed_data['name']}")
            
            # Add a small delay to avoid hitting API rate limits
            if get_details:
                time.sleep(0.2)
        
        result["hotels"].append(hotel_data)
        print(f"Added {len(hotel_data['restaurants'])} restaurants for {hotel['name']}")
        
        # Save intermediate results after each hotel
        with open(f"restaurants_partial_{hotel['id']}.json", "w", encoding="utf-8") as f:
            json.dump({"hotels": [hotel_data]}, f, ensure_ascii=False, indent=2)
        
        # Add a delay between hotels to respect API rate limits
        time.sleep(1)
    
    # Combine all partial results
    final_result = {"hotels": []}
    for hotel in hotels:
        try:
            with open(f"restaurants_partial_{hotel['id']}.json", "r", encoding="utf-8") as f:
                partial_data = json.load(f)
                if partial_data["hotels"] and len(partial_data["hotels"]) > 0:
                    final_result["hotels"].append(partial_data["hotels"][0])
        except Exception as e:
            print(f"Error loading partial data for {hotel['id']}: {e}")
    
    # Save the collected data to JSON file
    with open("restaurants.json", "w", encoding="utf-8") as f:
        json.dump(final_result, f, ensure_ascii=False, indent=2)
    
    print(f"Restaurant data collection complete. Data saved to restaurants.json")

if __name__ == "__main__":
    main()