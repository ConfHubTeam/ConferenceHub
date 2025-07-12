const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_GEOCODER_API_KEY;

// Global state to track API loading
let isLoading = false;
let loadPromise = null;

/**
 * Geocode an address using Yandex Geocoding API
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if failed
 */
export async function geocodeAddressYandex(address) {
  try {
    if (!YANDEX_API_KEY) {
      console.warn("Yandex API key is missing. Please check your .env file and ensure VITE_YANDEX_GEOCODER_API_KEY is set.");
      return null;
    }

    // Encode the address to use in URL
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${encodedAddress}&format=json&results=1&lang=en_US`
    );
    
    const data = await response.json();
    
    if (data.response?.GeoObjectCollection?.featureMember?.length > 0) {
      const coordinates = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos;
      const [lng, lat] = coordinates.split(" ").map(Number);
      return { lat, lng };
    } else {
      console.warn("Yandex geocoding failed for address:", address);
      return null;
    }
  } catch (error) {
    console.error("Error geocoding address with Yandex:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates using Yandex Geocoding API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string | null>} - Formatted address or null if failed
 */
export async function reverseGeocodeYandex(lat, lng) {
  try {
    if (!YANDEX_API_KEY) {
      console.warn("Yandex API key is missing. Please check your .env file and ensure VITE_YANDEX_GEOCODER_API_KEY is set.");
      return null;
    }

    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${lng},${lat}&format=json&results=1&lang=en_US`
    );
    
    const data = await response.json();
    
    if (data.response?.GeoObjectCollection?.featureMember?.length > 0) {
      const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
      return geoObject.metaDataProperty.GeocoderMetaData.text;
    } else {
      console.warn("Yandex reverse geocoding failed for coordinates:", lat, lng);
      return null;
    }
  } catch (error) {
    console.error("Error reverse geocoding with Yandex:", error);
    return null;
  }
}

/**
 * Load Yandex Maps JavaScript API
 * @returns {Promise<boolean>} - True if loaded successfully, false otherwise
 */
export function loadYandexMapsApi() {
  // If already loaded and ready, resolve immediately
  if (window.ymaps && window.ymaps.ready) {
    return new Promise((resolve) => {
      window.ymaps.ready(() => {
        resolve(true);
      });
    });
  }

  // If currently loading, return the existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Create new loading promise
  loadPromise = new Promise((resolve, reject) => {
    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existingScript) {
      // Script exists, wait for ymaps to be ready
      const checkYmaps = () => {
        if (window.ymaps) {
          window.ymaps.ready(() => {
            isLoading = false;
            resolve(true);
          });
        } else {
          // Wait a bit more and check again
          setTimeout(checkYmaps, 100);
        }
      };
      checkYmaps();
      return;
    }

    // Mark as loading
    isLoading = true;

    // Create script element
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=en_US`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for ymaps.ready
      if (window.ymaps) {
        window.ymaps.ready(() => {
          isLoading = false;
          resolve(true);
        });
      } else {
        isLoading = false;
        reject(new Error("Yandex Maps API failed to load"));
      }
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error("Failed to load Yandex Maps API script"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
