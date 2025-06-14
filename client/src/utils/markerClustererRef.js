// This file is used to store the marker clusterer instance for the map.
// It helps to keep a reference for cleanup when markers change.
let markerClusterer = null;

export function setMarkerClusterer(clusterer) {
  markerClusterer = clusterer;
}

export function getMarkerClusterer() {
  return markerClusterer;
}

export function clearMarkerClusterer() {
  if (markerClusterer) {
    markerClusterer.clearMarkers();
    markerClusterer = null;
  }
}
