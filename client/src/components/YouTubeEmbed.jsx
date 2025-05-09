import React from 'react';

export default function YouTubeEmbed({ url, title = "YouTube video", className = "" }) {
  // Extract video ID from different YouTube URL formats
  const getYouTubeVideoId = (url) => {
    if (!url) return null;

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
        return match[1];
      }
    }

    return null;
  };

  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return <div className={`bg-gray-200 flex items-center justify-center ${className}`}>Invalid YouTube URL</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      ></iframe>
    </div>
  );
}