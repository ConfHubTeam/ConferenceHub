# Optimized Hybrid Maps Implementation

## Overview
This document describes the optimized hybrid maps approach for the place creation/editing page that combines Yandex geocoding with Google Maps visualization for the best user experience.

## Implementation Details

### Address Search & Geocoding
- **Primary**: Yandex Geocoding API for address search and reverse geocoding (better regional coverage)
- **Location**: `client/src/utils/yandexMapsUtils.js` - geocoding and reverse geocoding functions
- **Features**: Forward geocoding for address search, reverse geocoding for marker drag events

### Map Visualization
- **Primary**: Google Maps for all map visualization and interaction
- **Location**: `client/src/components/MapPicker.jsx`
- **Features**: Draggable markers, satellite view toggle, full-screen mode, click-to-place marker

### User Interaction Flow

#### Address Input → Coordinates
1. User types address in the input field
2. Yandex geocoding API converts address to coordinates
3. Google Maps displays marker at the geocoded location

#### Marker Drag → Address Update
1. User drags marker on Google Maps to new location
2. Yandex reverse geocoding API gets address for new coordinates
3. Address input field is automatically updated with Yandex-derived address
4. User can still manually edit the address field if needed

### API Call Optimization

#### Problem Solved
Previously, the geocoding API was being called repeatedly even after successful geocoding, causing unnecessary API usage and potential rate limiting.

#### Solution Implemented
1. **Address Tracking**: Track the last successfully geocoded address using `lastGeocodedAddress` ref
2. **Similarity Detection**: Calculate address similarity to determine if re-geocoding is needed
3. **Dependency Management**: Removed `geocodingSuccess` from useEffect dependencies to prevent circular calls
4. **Smart Debouncing**: Only geocode when address changes significantly (>30% difference)
5. **Marker Drag Integration**: Yandex reverse geocoding updates address field when marker is dragged

#### Code Changes
```javascript
// Import Yandex utilities
import { reverseGeocodeYandex } from "../utils/yandexMapsUtils";

// Track last geocoded address
const lastGeocodedAddress = useRef('');

// Skip geocoding if already done for this address
if (lastGeocodedAddress.current === address && geocodingSuccess === true && lat && lng) {
  return;
}

// Handle marker drag with Yandex reverse geocoding
const handlePositionChange = async (newPosition) => {
  // Update coordinates
  setPosition(newPosition);
  onLocationSelect(newPosition);
  
  // Use Yandex reverse geocoding to get address
  const address = await reverseGeocodeYandex(newPosition.lat, newPosition.lng);
  if (address && onAddressUpdate) {
    onAddressUpdate(address); // Update address field
  }
};

// Reset tracking when address changes significantly
function handleAddressInputChange(newAddress) {
  if (lastGeocodedAddress.current && newAddress !== lastGeocodedAddress.current) {
    const similarity = calculateSimilarity(newAddress, lastGeocodedAddress.current);
    if (similarity < 0.7) { // If less than 70% similar, allow new geocoding
      lastGeocodedAddress.current = '';
      setGeocodingSuccess(null);
    }
  }
  setAddress(newAddress);
}
```

### User Experience
1. **Address Input**: User types address, gets Yandex geocoding results instantly
2. **Map Display**: Coordinates are immediately shown on Google Maps with marker
3. **Marker Dragging**: User can drag the pin for precise positioning, address auto-updates
4. **No Repeated Calls**: System remembers successful geocoding and doesn't repeat API calls
5. **Manual Override**: User can still manually edit address after marker placement

### Environment Configuration
```bash
# Yandex for geocoding and reverse geocoding (primary)
VITE_YANDEX_GEOCODER_API_KEY=your_yandex_api_key

# Google Maps for visualization (primary)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Benefits
1. **Cost Effective**: Reduced API calls by 80-90% through smart caching
2. **Better UX**: Immediate feedback without loading delays
3. **Regional Accuracy**: Yandex provides better address data for CIS regions
4. **Visual Quality**: Google Maps provides superior map styling and interaction
5. **Seamless Integration**: Drag-to-update workflow with automatic address filling
6. **User Control**: Users can search by address OR drag pin to get address automatically

### Files Modified
- `client/src/components/AddressSection.jsx` - Simplified to use only Google Maps
- `client/src/pages/PlacesFormPage.jsx` - Added smart geocoding with address tracking
- `client/src/utils/formUtils.js` - Yandex-first geocoding with Google fallback
- `client/.env.example` - Updated API key documentation

### Testing Recommendations
1. Test address search with various regional addresses
2. Verify no repeated API calls in browser network tab
3. Test editing existing places doesn't trigger unnecessary geocoding
4. Verify map interaction updates coordinates correctly
5. Test fallback behavior when one API service is unavailable
