import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { getCroppedImg } from '../../utils/cropImage';

export default function PhotoCropperModal({ isOpen, onClose, imageSrc, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (err) {
      console.error('Failed to crop image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crop Passport Photo (3:4 Ratio)" maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Drag and adjust the photo so your face is clearly centered.
        </p>

        {/* Cropper Container */}
        <div className="relative w-full h-72 bg-gray-900 rounded-lg overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
              onCropChange={onCropChange}
              onCropComplete={handleCropComplete}
              onZoomChange={onZoomChange}
            />
          )}
        </div>

        {/* Zoom Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600 font-medium">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-3 border-t">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Apply & Save Photo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

