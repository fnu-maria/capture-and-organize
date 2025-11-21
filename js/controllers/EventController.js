class EventController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        this.stream = null;
        this.capturedImage = null;
        this.extractedText = '';
        
        this.view.bindCaptureImage(this.handleCaptureImage.bind(this));
        this.view.bindExtractText(this.handleExtractText.bind(this));
        this.view.bindSaveLocalEvent(this.handleSaveLocalEvent.bind(this));
        this.view.bindExportGoogleEvent(this.handleExportGoogleEvent.bind(this));
        this.view.bindStartCamera(this.handleStartCamera.bind(this));
        this.view.bindStopCamera(this.handleStopCamera.bind(this));
    }

    async handleStartCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Prefer rear camera on mobile
                } 
            });
            this.view.showCameraPreview(this.stream);
        } catch (err) {
            console.error('Error accessing camera:', err);
            this.view.showNotification('Cannot access camera. Please check permissions.', 'error');
        }
    }

    handleStopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    handleCaptureImage() {
        if (!this.stream) {
            this.view.showNotification('Please start camera first', 'error');
            return;
        }

        this.capturedImage = this.view.captureImageFromCamera();
        this.view.showExtractTextButton();
        this.view.showNotification('Image captured! Click "Extract Text" to process.');
    }

    async handleExtractText() {
        if (!this.capturedImage) {
            this.view.showNotification('Please capture an image first', 'error');
            return;
        }

        try {
            this.view.showOCRProgress(true);
            
            const result = await Tesseract.recognize(
                this.capturedImage,
                'eng',
                { 
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                }
            );
            
            this.extractedText = result.data.text;
            this.view.displayExtractedText(this.extractedText);
            
            // Auto-populate form fields from extracted text
            this.autoFillEventForm(this.extractedText);
            
            this.view.showNotification('Text extracted successfully!');
            
        } catch (error) {
            console.error('OCR Error:', error);
            this.view.showNotification('Error processing image. Please enter details manually.', 'error');
        } finally {
            this.view.showOCRProgress(false);
        }
    }

    autoFillEventForm(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        // Extract event title (first meaningful line)
        if (lines.length > 0) {
            this.view.setEventTitle(lines[0].substring(0, 100)); // Limit length
        }
        
        // Extract description (remaining text)
        if (lines.length > 1) {
            const description = lines.slice(1).join('\n').substring(0, 500); // Limit length
            this.view.setEventDescription(description);
        }
        
        // Extract date/time with better parsing
        const dateTime = this.extractDateTime(text);
        if (dateTime) {
            this.view.setEventDateTime(dateTime);
        }
    }

    extractDateTime(text) {
        // Enhanced date parsing - handles multiple formats
        const patterns = [
            // MM/DD/YYYY or MM-DD-YYYY
            /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](\d{4})\b/,
            // DD/MM/YYYY or DD-MM-YYYY
            /\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](\d{4})\b/,
            // YYYY/MM/DD or YYYY-MM-DD
            /\b(\d{4})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])\b/,
            // Month names
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i,
            // Today, Tomorrow
            /\b(today|tomorrow)\b/i,
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                let date;
                
                // Handle relative dates
                if (match[0].toLowerCase() === 'today') {
                    date = new Date();
                } else if (match[0].toLowerCase() === 'tomorrow') {
                    date = new Date();
                    date.setDate(date.getDate() + 1);
                } else {
                    date = new Date(match[0]);
                }
                
                if (!isNaN(date.getTime())) {
                    // Set time to current time + 1 hour
                    date.setHours(date.getHours() + 1);
                    return date.toISOString().slice(0, 16);
                }
            }
        }
        return null;
    }

    handleSaveLocalEvent(title, dateTime, description) {
        if (!title.trim() || !dateTime) {
            this.view.showNotification('Please provide both title and date/time', 'error');
            return;
        }
        
        this.model.addEvent(title, dateTime, description, this.capturedImage, 'OCR');
        this.view.showNotification('Event saved to local calendar!');
        this.view.resetEventForm();
        this.capturedImage = null;
        this.extractedText = '';
    }

    handleExportGoogleEvent(eventData) {
        // FREE METHOD: Generate Google Calendar URL (no API needed!)
        const startTime = new Date(eventData.dateTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endTime = new Date(new Date(eventData.dateTime).getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(eventData.description || '')}`;
        
        // Open in new tab
        window.open(googleCalendarUrl, '_blank');
        
        this.view.showNotification('Google Calendar opened with your event!');
    }
}