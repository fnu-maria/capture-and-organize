class EventView {
    constructor() {
        this.cameraPreview = document.getElementById('camera-preview');
        this.photoCanvas = document.getElementById('photo-canvas');
        this.captureBtn = document.getElementById('capture-btn');
        this.extractTextBtn = document.getElementById('extract-text-btn');
        this.eventTitleInput = document.getElementById('event-title');
        this.eventDateTimeInput = document.getElementById('event-datetime');
        this.eventDescription = document.getElementById('event-description');
        this.saveLocalBtn = document.getElementById('save-local-btn');
        this.exportGoogleBtn = document.getElementById('export-google-btn');
        this.extractedTextElement = document.getElementById('extracted-text');
        
        this.canvasContext = this.photoCanvas.getContext('2d');
        this.stream = null;
    }

    bindStartCamera(handler) {
        // This will be called when events view is shown
        this.startCameraHandler = handler;
    }

    bindStopCamera(handler) {
        // This will be called when events view is hidden
        this.stopCameraHandler = handler;
    }

    bindCaptureImage(handler) {
        this.captureBtn.addEventListener('click', handler);
    }

    bindExtractText(handler) {
        this.extractTextBtn.addEventListener('click', handler);
    }

    bindSaveLocalEvent(handler) {
        this.saveLocalBtn.addEventListener('click', () => {
            const title = this.eventTitleInput.value;
            const dateTime = this.eventDateTimeInput.value;
            const description = this.eventDescription.value;
            handler(title, dateTime, description);
        });
    }

    bindExportGoogleEvent(handler) {
        this.exportGoogleBtn.addEventListener('click', () => {
            const title = this.eventTitleInput.value;
            const dateTime = this.eventDateTimeInput.value;
            const description = this.eventDescription.value;
            
            if (!title.trim() || !dateTime) {
                this.showNotification('Please provide both title and date/time before exporting', 'error');
                return;
            }
            
            handler({ title, dateTime, description });
        });
    }

    // FIXED: Properly handle camera stream
    async showCameraPreview(stream) {
        try {
            this.stream = stream;
            this.cameraPreview.srcObject = stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.cameraPreview.onloadedmetadata = () => {
                    resolve();
                };
            });
            
            this.cameraPreview.play();
        } catch (err) {
            console.error('Error showing camera preview:', err);
            this.showNotification('Error accessing camera', 'error');
        }
    }

    captureImageFromCamera() {
        if (!this.stream) {
            this.showNotification('Camera not available', 'error');
            return null;
        }

        try {
            this.photoCanvas.width = this.cameraPreview.videoWidth;
            this.photoCanvas.height = this.cameraPreview.videoHeight;
            
            this.canvasContext.drawImage(
                this.cameraPreview, 
                0, 0, 
                this.photoCanvas.width, 
                this.photoCanvas.height
            );
            
            return this.photoCanvas.toDataURL('image/png');
        } catch (err) {
            console.error('Error capturing image:', err);
            this.showNotification('Error capturing image', 'error');
            return null;
        }
    }

    showExtractTextButton() {
        this.extractTextBtn.style.display = 'inline-block';
    }

    displayExtractedText(text) {
        this.extractedTextElement.textContent = text || 'No text could be extracted from the image.';
    }

    setEventTitle(title) {
        this.eventTitleInput.value = title;
    }

    setEventDescription(description) {
        this.eventDescription.value = description;
    }

    setEventDateTime(dateTime) {
        this.eventDateTimeInput.value = dateTime;
    }

    showOCRProgress(show) {
        this.extractTextBtn.disabled = show;
        this.extractTextBtn.textContent = show ? 'Processing...' : 'Extract Text from Photo';
    }

    resetEventForm() {
        this.eventTitleInput.value = '';
        this.eventDateTimeInput.value = '';
        this.eventDescription.value = '';
        this.extractTextBtn.style.display = 'none';
        this.extractedTextElement.textContent = 'No image captured yet.';
    }

    showOCRTips() {
        // Remove existing tips if any
        const existingTips = document.querySelector('.ocr-tips');
        if (existingTips) {
            existingTips.remove();
        }

        const tips = document.createElement('div');
        tips.className = 'ocr-tips';
        tips.innerHTML = `
            <h4>💡 Tips for Better OCR Results:</h4>
            <ul>
                <li>🔦 Use good lighting</li>
                <li>📏 Hold camera straight</li>
                <li>🗨️ Ensure text is clear and focused</li>
                <li>📸 Avoid glare and shadows</li>
                <li>⏳ Wait for camera permission popup</li>
            </ul>
        `;
        
        const cameraSection = document.querySelector('.camera-section');
        if (cameraSection) {
            cameraSection.appendChild(tips);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
}