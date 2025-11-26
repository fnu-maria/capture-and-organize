class EventView {
    constructor() {
        this.cameraPreview = document.getElementById('camera-preview');
        this.photoCanvas = document.getElementById('photo-canvas');
        this.startCameraBtn = document.getElementById('start-camera-btn');
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
        this.startCameraBtn.addEventListener('click', async () => {
            console.log('Start Camera button clicked');
            this.showNotification('Requesting camera access...');
            await handler();
        });
    }

    bindStopCamera(handler) {
        this.stopCameraHandler = handler;
    }

    bindCaptureImage(handler) {
        this.captureBtn.addEventListener('click', () => {
            console.log('Capture button clicked');
            handler();
        });
    }

    bindExtractText(handler) {
        this.extractTextBtn.addEventListener('click', () => {
            console.log('Extract Text button clicked');
            handler();
        });
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

    showCameraPreview(stream) {
        try {
            this.stream = stream;
            this.cameraPreview.srcObject = stream;
            
            // Show the camera preview and hide start button
            this.startCameraBtn.style.display = 'none';
            this.cameraPreview.style.display = 'block';
            this.captureBtn.style.display = 'inline-block';
            
            this.showNotification('Camera started successfully!');
            
        } catch (err) {
            console.error('Error showing camera preview:', err);
            this.showNotification('Error accessing camera: ' + err.message, 'error');
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
            
            this.showNotification('Photo captured! Click "Extract Text" to process.');
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
        this.extractTextBtn.textContent = show ? '⏳ Processing...' : '🔍 Extract Text from Photo';
    }

    resetEventForm() {
        this.eventTitleInput.value = '';
        this.eventDateTimeInput.value = '';
        this.eventDescription.value = '';
        this.extractTextBtn.style.display = 'none';
        this.extractedTextElement.textContent = 'Start camera and capture a photo to extract text.';
        
        // Reset camera UI
        this.startCameraBtn.style.display = 'inline-block';
        this.cameraPreview.style.display = 'none';
        this.captureBtn.style.display = 'none';
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    showOCRTips() {
        const existingTips = document.querySelector('.ocr-tips');
        if (existingTips) {
            existingTips.remove();
        }

        const tips = document.createElement('div');
        tips.className = 'ocr-tips';
        tips.innerHTML = `
            <h4>💡 Tips for Better OCR Results:</h4>
            <ul>
                <li>🔰 Click "Start Camera" to begin</li>
                <li>📸 Use good lighting</li>
                <li>📏 Hold camera straight</li>
                <li>📑 Ensure text is clear and focused</li>
                <li> 🔦Avoid glare and shadows</li>
            </ul>
        `;
        
        const cameraSection = document.querySelector('.camera-section');
        if (cameraSection) {
            cameraSection.appendChild(tips);
        }
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
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