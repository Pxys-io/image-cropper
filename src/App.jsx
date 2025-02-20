import React, { useState, useRef, useEffect } from 'react';
    import ReactCrop, {
      centerCrop,
      makeAspectCrop,
    } from 'react-image-crop';
    import 'react-image-crop/dist/ReactCrop.css';
    import './App.css';

    function App() {
      const [images, setImages] = useState([]);
      const [croppedImages, setCroppedImages] = useState({});
      const [crop, setCrop] = useState();
      const [completedCrop, setCompletedCrop] = useState();
      const [selectedImage, setSelectedImage] = useState(null);
      const [showModal, setShowModal] = useState(false);
      const imgRef = useRef(null);

      const aspect = 1; // 1:1 aspect ratio

      useEffect(() => {
        const storedCroppedImages = localStorage.getItem('croppedImages');
        if (storedCroppedImages) {
          setCroppedImages(JSON.parse(storedCroppedImages));
        }
      }, []);

      useEffect(() => {
        localStorage.setItem('croppedImages', JSON.stringify(croppedImages));
      }, [croppedImages]);

      const onSelectDirectory = (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const imageFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
          setImages(imageFiles);
          // Do not reset croppedImages here
        }
      };

      function onImageLoad(image) {
        imgRef.current = image;

        const { width, height } = image;
        const crop = centerCrop(
          makeAspectCrop(
            {
              unit: 'px',
              width: 2048,
              height: 2048,
            },
            aspect,
            width,
            height
          ),
          width,
          height
        );

        setCrop(crop);
        return false;
      }

      async function onCropImage() {
        if (!imgRef.current || !completedCrop) {
          return;
        }

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        ctx.drawImage(
          image,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          completedCrop.width,
          completedCrop.height
        );

        const base64Image = canvas.toDataURL('image/jpeg');
        const fileName = selectedImage.name;

        // Auto-download
        downloadImage(base64Image, fileName);

        // Update croppedImages
        setCroppedImages(prevCroppedImages => ({
          ...prevCroppedImages,
          [selectedImage.name]: base64Image,
        }));

        setShowModal(false);
        setSelectedImage(null);
      }

      function downloadImage(imageData, fileName) {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `cropped_${fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      const openCropModal = (image) => {
        setSelectedImage(image);
        setShowModal(true);
      };

      return (
        <div className="app-container">
          <h1>Image Cropping App</h1>
          <input type="file" webkitdirectory="" onChange={onSelectDirectory} />

          <div className="image-list">
            {images.map((imageFile) => (
              <div
                key={imageFile.name}
                className={`image-item ${croppedImages[imageFile.name] ? 'cropped' : ''}`}
                onClick={() => openCropModal(imageFile)}
              >
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt={imageFile.name}
                  className="thumbnail"
                />
                {croppedImages[imageFile.name] && <span className="checkmark">✓</span>}
              </div>
            ))}
          </div>

          {showModal && (
            <div className="modal">
              <div className="modal-content">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                >
                  <img
                    ref={imgRef}
                    src={URL.createObjectURL(selectedImage)}
                    alt="To Crop"
                    onLoad={(e) => onImageLoad(e.target)}
                    className="crop-image"
                  />
                </ReactCrop>
                {completedCrop && (
                  <button className="crop-button" onClick={onCropImage}>
                    Crop Image
                  </button>
                )}
                <button className="close-button" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    export default App;
