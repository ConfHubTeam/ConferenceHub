import { useState } from "react";
import { useTranslation } from "react-i18next";
import CloudinaryImage from "./CloudinaryImage";
import api from "../utils/api";

export default function PhotoUploader({ addedPhotos, setAddedPhotos }) {
  const { t } = useTranslation(['places']);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const MAX_PHOTOS = 6; // Set maximum number of photos to 4

  async function uploadPhoto(event) {
    setUploadError("");
    setIsUploading(true);
    const files = event.target.files;

    // Check if maximum photos reached
    if (addedPhotos.length + files.length > MAX_PHOTOS) {
      setUploadError(t('places:placeCreate.photoUpload.maxPhotosError', {
        max: MAX_PHOTOS,
        remaining: MAX_PHOTOS - addedPhotos.length
      }));
      setIsUploading(false);
      return;
    }

    // Check file sizes - 10MB limit
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxFileSize) {
        setUploadError(t('places:placeCreate.photoUpload.fileSizeError', {
          filename: files[i].name,
          size: (files[i].size / 1024 / 1024).toFixed(1)
        }));
        setIsUploading(false);
        return;
      }
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
      setUploadError(t('places:placeCreate.photoUpload.uploadFailed'));
    } finally {
      setIsUploading(false);
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
      {uploadError && (
        <div className="text-red-500 mt-2">{uploadError}</div>
      )}
      
      <div className="mt-2 mb-2 text-sm text-gray-600">
        <p>{t('places:placeCreate.photoUpload.photosCount', {
          current: addedPhotos.length,
          max: MAX_PHOTOS,
          remaining: MAX_PHOTOS - addedPhotos.length
        })}</p>
        {isUploading}
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
          <label className={`h-32 flex items-center gap-1 justify-center border rounded-xl p-8 text-xl text-gray-700 ${
            isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'
          }`}>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={uploadPhoto}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,image/avif,image/svg+xml"
              disabled={isUploading}
            />
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                <span>{t('places:placeCreate.photoUpload.uploadProgress')}</span>
              </>
            ) : (
              <>
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
                <span>{t('places:placeCreate.photoUpload.uploadButton')}</span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Upload Instructions - Stacked layout */}
      <div className="mt-4 p-3 bg-white rounded-lg">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <div>
              <span className="font-medium text-gray-700">Formats: </span>
              <span>JPEG, PNG, GIF, BMP, WebP, AVIF, SVG</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div>
              <span className="font-medium text-gray-700">Max size: </span>
              <span>10MB per file</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
