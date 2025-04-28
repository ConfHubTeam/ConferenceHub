import { useState } from "react";
import CloudinaryImage from "./CloudinaryImage";
import api from "../utils/api";

export default function PhotoUploader({ addedPhotos, setAddedPhotos }) {
  const [photoLink, setPhotoLink] = useState("");
  const [uploadError, setUploadError] = useState("");
  const MAX_PHOTOS = 4; // Set maximum number of photos to 4

  async function addPhotoByLink(event) {
    event.preventDefault();
    setUploadError("");
    
    // Check if maximum photos reached
    if (addedPhotos.length >= MAX_PHOTOS) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }

    try {
      const { data } = await api.post("/upload-by-link", {
        link: photoLink,
      });
      setAddedPhotos((prev) => {
        return [...prev, data];
      });
    } catch (e) {
      setUploadError("Upload failed, please try again later.");
    }
    setPhotoLink("");
  }

  async function uploadPhoto(event) {
    setUploadError("");
    const files = event.target.files;

    // Check if maximum photos reached
    if (addedPhotos.length + files.length > MAX_PHOTOS) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos allowed. You can add ${MAX_PHOTOS - addedPhotos.length} more.`);
      return;
    }

    const data = new FormData(); // to store upload files
    for (let i = 0; i < files.length; i++) {
      data.append("photos", files[i]);
    }
    
    try {
      const { data: uploadedFiles } = await api.post("/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setAddedPhotos((prev) => {
        return [...prev, ...uploadedFiles];
      });
    } catch (error) {
      setUploadError("Upload failed, please try again later.");
    }
  }

  function removePhoto(event, photo) {
    event.preventDefault(); // every button in a form should have this
    setAddedPhotos([...addedPhotos.filter((item) => item !== photo)]);
    setUploadError("");
  }

  function selectAsMainPhoto(event, photo) {
    event.preventDefault();
    const addedPhotosNotSelected = addedPhotos.filter(item => item !== photo);
    setAddedPhotos([photo, ...addedPhotosNotSelected]);
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 items-center">
        <input
          type="text"
          placeholder="Add using a link ....jpg"
          value={photoLink}
          onChange={(event) => setPhotoLink(event.target.value)}
          className="flex-grow"
        />
        <button
          onClick={addPhotoByLink}
          className="bg-primary text-white rounded-2xl w-full md:w-40 h-11"
        >
          Add photo
        </button>
      </div>
      
      {uploadError && (
        <div className="text-red-500 mt-2">{uploadError}</div>
      )}
      
      <div className="mt-2 mb-2 text-sm text-gray-600">
        <p>{addedPhotos.length}/{MAX_PHOTOS} photos uploaded. {MAX_PHOTOS - addedPhotos.length} remaining.</p>
      </div>

      <div className="gap-2 mt-2 grid grid-cols-2 md:grid-cols-4">
        {addedPhotos.length > 0 &&
          addedPhotos.map((photo, index) => (
            <div className="h-32 flex relative" key={index}>
              <CloudinaryImage 
                photo={photo}
                className="rounded-2xl w-full object-cover"
                alt="Uploaded photo"
              />
              <button
                onClick={(event) => {
                  removePhoto(event, photo);
                }}
                className="cursor-pointer absolute right-1 bottom-1 text-white p-2 bg-black bg-opacity-50 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
              <button 
                onClick={(event) => {
                  selectAsMainPhoto(event, photo);
                }}
                className="cursor-pointer absolute right-1 top-1 text-white p-2 bg-black bg-opacity-50 rounded-full"
              >
                {photo === addedPhotos[0] && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {photo !== addedPhotos[0] && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                )}
              </button>
            </div>
          ))}
        {/* Only show upload button if less than MAX_PHOTOS */}
        {addedPhotos.length < MAX_PHOTOS && (
          <label className="h-32 flex items-center gap-1 justify-center border rounded-xl p-8 text-xl text-gray-700 cursor-pointer">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={uploadPhoto}
              accept="image/*"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
            <span>Upload</span>
          </label>
        )}
      </div>
    </div>
  );
}
