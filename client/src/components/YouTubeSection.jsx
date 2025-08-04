import React from "react";
import { useTranslation } from "react-i18next";

// Helper function to validate and convert YouTube URL to embed format
function extractYouTubeVideoId(url) {
  if (!url || url.trim() === "") return "";
  
  // Regular expression patterns for different YouTube URL formats
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,     // Regular URL format: youtube.com/watch?v=ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/i,       // Embed URL format: youtube.com/embed/ID
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/i,                 // Shortened URL format: youtu.be/ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^/?]+)/i       // Shorts URL format: youtube.com/shorts/ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Return the URL in embed format
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return "";  // Return empty string if invalid YouTube URL
}

export default function YouTubeSection({ youtubeLink, setYoutubeLink, preInput }) {
  const { t } = useTranslation(['places']);

  return (
    <div id="youtube-section">
      {preInput("placeCreate.youtubeVideo", "placeCreate.youtubeVideoDescription")}
      <input
        type="text"
        placeholder={t('places:placeCreate.youtubeVideoPlaceholder')}
        value={youtubeLink}
        onChange={(event) => setYoutubeLink(event.target.value)}
        className="w-full border my-2 py-2 px-3 rounded-2xl"
      />
    </div>
  );
}

// Export the helper function so it can be used elsewhere if needed
export { extractYouTubeVideoId };
