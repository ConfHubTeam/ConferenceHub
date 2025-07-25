import React from "react";

// Helper function to validate and convert Matterport URL to embed format
function extractMatterportModelId(url) {
  if (!url || url.trim() === "") return "";
  
  // Regular expression patterns for different Matterport URL formats
  const patterns = [
    /(?:https?:\/\/)?(?:my\.)?matterport\.com\/show\/\?m=([a-zA-Z0-9]+)/i,  // Show URL format: my.matterport.com/show/?m=ID
    /(?:https?:\/\/)?(?:my\.)?matterport\.com\/models\/([a-zA-Z0-9]+)/i      // Models URL format: my.matterport.com/models/ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Return the URL in embed format
      return `https://my.matterport.com/show/?m=${match[1]}`;
    }
  }

  return "";  // Return empty string if invalid Matterport URL
}

export default function MatterportSection({ matterportLink, setMatterportLink, preInput }) {
  return (
    <div id="matterport-section">
      {preInput("3D Virtual Tour (Matterport)")}
      <input
        type="text"
        placeholder="https://my.matterport.com/show/?m=example"
        value={matterportLink}
        onChange={(event) => setMatterportLink(event.target.value)}
        className="w-full border my-2 py-2 px-3 rounded-2xl"
      />
      <p className="text-sm text-gray-500 mt-1 mb-4">
        Add a Matterport 3D virtual tour link to provide an immersive 360° view of your space.
      </p>
    </div>
  );
}

// Export the helper function so it can be used elsewhere if needed
export { extractMatterportModelId };
