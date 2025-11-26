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
        // Show OCR tips when events view loads
        this.view.showOCRTips();
    }

    async handleStartCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment', // Prefer rear camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            this.view.showCameraPreview(this.stream);
        } catch (err) {
            console.error('Error accessing camera:', err);
            let errorMessage = 'Cannot access camera. ';
            if (err.name === 'NotAllowedError') {
                errorMessage += 'Please check camera permissions.';
            } else if (err.name === 'NotFoundError') {
                errorMessage += 'No camera found.';
            } else {
                errorMessage += 'Please try again.';
            }
            this.view.showNotification(errorMessage, 'error');
        }
    }

    handleStopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    async handleCaptureImage() {
        if (!this.stream) {
            this.view.showNotification('Please start camera first', 'error');
            return;
        }

        this.capturedImage = this.view.captureImageFromCamera();
        
        // Check image quality
        const quality = await this.checkImageQuality(this.capturedImage);
        
        if (!quality.isBright || !quality.hasContrast) {
            this.view.showNotification('Image might be too dark/blurry. Try again with better lighting.', 'warning');
        }
        
        this.view.showExtractTextButton();
        this.view.showNotification('Image captured! Click "Extract Text" to process.');
    }

    // Image Pre-processing
    preprocessImage(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                // Set canvas size
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Apply image processing
                ctx.drawImage(img, 0, 0);
                
                // Get image data for processing
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Enhance contrast and reduce noise
                for (let i = 0; i < data.length; i += 4) {
                    // Convert to grayscale
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = data[i + 1] = data[i + 2] = avg;
                    
                    // Enhance contrast
                    data[i] = data[i] < 128 ? 0 : 255;     // Black/white threshold
                    data[i + 1] = data[i + 1] < 128 ? 0 : 255;
                    data[i + 2] = data[i + 2] < 128 ? 0 : 255;
                }
                
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            
            img.src = imageData;
        });
    }

    // Image Quality Detection
    checkImageQuality(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                let contrastScore = 0;
                let brightnessScore = 0;
                
                // Simple quality metrics
                for (let i = 0; i < data.length; i += 4) {
                    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    brightnessScore += brightness;
                    
                    // Check contrast with neighboring pixels (simplified)
                    if (i > 4) {
                        const prevBrightness = (data[i-4] + data[i-3] + data[i-2]) / 3;
                        contrastScore += Math.abs(brightness - prevBrightness);
                    }
                }
                
                const quality = {
                    isBright: brightnessScore / (data.length / 4) > 128,
                    hasContrast: contrastScore / (data.length / 4) > 30,
                    resolution: img.width * img.height
                };
                
                resolve(quality);
            };
            img.src = imageData;
        });
    }

    //Enhanced OCR with Multiple Languages
    async handleExtractText() {
        if (!this.capturedImage) {
            this.view.showNotification('Please capture an image first', 'error');
            return;
        }

        try {
            this.view.showOCRProgress(true);
            
            // PRE-PROCESS THE IMAGE FIRST
            const processedImage = await this.preprocessImage(this.capturedImage);
            
            // Try multiple language combinations for better accuracy
            const languages = ['eng', 'eng+fra', 'eng+spa']; // English, French, Spanish
            
            let bestResult = { data: { text: '' } };
            
            for (const lang of languages) {
                try {
                    const result = await Tesseract.recognize(processedImage, lang, {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                console.log(`${lang}: Progress: ${Math.round(m.progress * 100)}%`);
                            }
                        },
                        // OCR optimization settings
                        tessedit_pageseg_mode: 6, // Uniform block of text
                        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?@:-/()',
                        preserve_interword_spaces: 1
                    });
                    
                    // Keep the result with most text (usually most accurate)
                    if (result.data.text.length > bestResult.data.text.length) {
                        bestResult = result;
                    }
                } catch (err) {
                    console.warn(`OCR failed for ${lang}:`, err);
                }
            }
            
            this.extractedText = bestResult.data.text;
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
        const patterns = [
            // ISO format (2024-01-15T14:30)
            /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\b/,
            
            // MM/DD/YYYY or MM-DD-YYYY with optional time
            /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](\d{4})(?:\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?)?\b/i,
            
            // DD/MM/YYYY or DD-MM-YYYY with optional time  
            /\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](\d{4})(?:\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?)?\b/i,
            
            // YYYY/MM/DD or YYYY-MM-DD with optional time
            /\b(\d{4})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])(?:\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?)?\b/i,
            
            // Full month names with time
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})(?:\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?)?\b/i,
            
            // Abbreviated months
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})(?:\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?)?\b/i,
            
            // Time-only patterns (assume today/tomorrow with time)
            /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
            
            // Relative dates with optional time
            /\b(today|tomorrow|next week|\d+\s+days?)\s*(at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?)?\b/i,
        ];

        // Handle relative dates first
        const relativeDates = {
            'today': 0,
            'tomorrow': 1,
            'next week': 7,
            'in 1 day': 1,
            'in 2 days': 2,
            'in 3 days': 3
        };

        const lowerText = text.toLowerCase();
        
        // Check for relative dates
        for (const [key, daysToAdd] of Object.entries(relativeDates)) {
            if (lowerText.includes(key)) {
                let date = new Date();
                date.setDate(date.getDate() + daysToAdd);
                
                // Try to extract time for relative dates
                const timeMatch = lowerText.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/);
                if (timeMatch) {
                    date = this.parseTime(date, timeMatch);
                } else {
                    // Default to current time + 1 hour if no time specified
                    date.setHours(date.getHours() + 1);
                }
                
                if (!isNaN(date.getTime())) {
                    return date.toISOString().slice(0, 16);
                }
            }
        }

        // Check patterns for absolute dates
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                try {
                    let date;
                    
                    // Handle ISO format directly
                    if (pattern.toString().includes('T')) {
                        date = new Date(match[0]);
                    } 
                    // Handle time-only patterns
                    else if (pattern.toString().includes('time-only')) {
                        date = new Date();
                        const timeMatch = match[0].match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
                        if (timeMatch) {
                            date = this.parseTime(date, timeMatch);
                        }
                    }
                    // Handle other date patterns
                    else {
                        date = new Date(match[0]);
                        
                        // If basic parsing fails, try manual parsing
                        if (isNaN(date.getTime())) {
                            date = this.parseComplexDate(match[0]);
                        }
                    }
                    
                    if (!isNaN(date.getTime())) {
                        return date.toISOString().slice(0, 16);
                    }
                } catch (error) {
                    console.warn('Date parsing failed for:', match[0], error);
                    continue;
                }
            }
        }
        
        return null;
    }

    // Helper function to parse time from matches
    parseTime(baseDate, timeMatch) {
        const date = new Date(baseDate);
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3] ? timeMatch[3].toLowerCase() : '';
        
        // Handle 12-hour format
        if (period === 'pm' && hours < 12) {
            hours += 12;
        } else if (period === 'am' && hours === 12) {
            hours = 0;
        }
        
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    // Helper function for complex date parsing
    parseComplexDate(dateString) {
        const formats = [
            dateString,
            dateString.replace(/-/g, '/'),
            dateString.replace(/\//g, '-')
        ];
        
        for (const format of formats) {
            const date = new Date(format);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        return new Date(NaN); // Return invalid date
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
//google calendar
        const startTime = new Date(eventData.dateTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endTime = new Date(new Date(eventData.dateTime).getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(eventData.description || '')}`;
        
        // Open in new tab
        window.open(googleCalendarUrl, '_blank');
        
        this.view.showNotification('Google Calendar opened with your event!');
    }
}