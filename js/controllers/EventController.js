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
                    facingMode: 'environment',
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
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = data[i + 1] = data[i + 2] = avg;
                    data[i] = data[i] < 128 ? 0 : 255;
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
                
                for (let i = 0; i < data.length; i += 4) {
                    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    brightnessScore += brightness;
                    
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

    // Enhanced OCR with Multiple Languages
    async handleExtractText() {
        if (!this.capturedImage) {
            this.view.showNotification('Please capture an image first', 'error');
            return;
        }

        try {
            this.view.showOCRProgress(true);
            
            const processedImage = await this.preprocessImage(this.capturedImage);
            const languages = ['eng', 'eng+fra', 'eng+spa'];
            
            let bestResult = { data: { text: '' } };
            
            for (const lang of languages) {
                try {
                    const result = await Tesseract.recognize(processedImage, lang, {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                console.log(`${lang}: Progress: ${Math.round(m.progress * 100)}%`);
                            }
                        },
                        tessedit_pageseg_mode: 6,
                        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?@:-/()',
                        preserve_interword_spaces: 1
                    });
                    
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
        console.log('Auto-filling form with text:', text);
        
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        // Extract event title (first meaningful line)
        if (lines.length > 0) {
            const title = lines[0].substring(0, 100);
            this.view.setEventTitle(title);
            console.log('Set title:', title);
        }
        
        // Extract date/time FIRST - this is the key fix!
        const dateTime = this.extractDateTime(text);
        if (dateTime) {
            console.log('Found date/time:', dateTime);
            this.view.setEventDateTime(dateTime);
        } else {
            console.log('No date/time found in text');
        }
        
        // Extract description (remaining text, excluding date lines)
        if (lines.length > 1) {
            const descriptionLines = lines.slice(1).filter(line => {
                // Filter out lines that look like dates/times
                const lowerLine = line.toLowerCase();
                return !this.looksLikeDateOrTime(lowerLine);
            });
            
            if (descriptionLines.length > 0) {
                const description = descriptionLines.join('\n').substring(0, 500);
                this.view.setEventDescription(description);
                console.log('Set description:', description);
            }
        }
    }

    looksLikeDateOrTime(text) {
        const dateTimePatterns = [
            /\b\d{1,2}[:\.]\d{2}\s*(am|pm)?\b/i,
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i,
            /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
            /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/,
            /\b(today|tomorrow|yesterday|tonight)\b/i,
            /\b(at|on)\s+\d/i
        ];
        
        return dateTimePatterns.some(pattern => pattern.test(text));
    }

    extractDateTime(text) {
        console.log('Extracting date from text:', text);
        
        // Try multiple date extraction methods in order of priority
        const extractedDate = 
            this.extractCompleteDateTime(text) ||
            this.extractDateWithTime(text) ||
            this.extractDateOnly(text) ||
            this.extractRelativeDate(text);
        
        console.log('Final extracted date:', extractedDate);
        return extractedDate;
    }

    extractCompleteDateTime(text) {
        // Patterns for complete date + time
        const patterns = [
            // ISO format: 2024-01-15T14:30
            /\b(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})\b/,
            
            // MM/DD/YYYY HH:MM or MM-DD-YYYY HH:MM
            /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
            
            // Month DD, YYYY at HH:MM
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
            
            // DD/MM/YYYY HH:MM
            /\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)?\b/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                console.log('Found complete date-time pattern:', match[0]);
                try {
                    let dateString = match[0];
                    
                    // Handle "at" in date strings
                    if (dateString.includes(' at ')) {
                        dateString = dateString.replace(' at ', ' ');
                    }
                    
                    const date = new Date(dateString);
                    if (!isNaN(date.getTime())) {
                        return date.toISOString().slice(0, 16);
                    }
                } catch (error) {
                    console.warn('Date parsing failed for complete date:', match[0], error);
                }
            }
        }
        return null;
    }

    extractDateWithTime(text) {
        // Separate date and time patterns that might be in different parts of text
        const datePatterns = [
            // MM/DD/YYYY or MM-DD-YYYY
            /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](\d{4})\b/,
            // DD/MM/YYYY or DD-MM-YYYY
            /\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](\d{4})\b/,
            // Month DD, YYYY
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i,
            // Mon DD, YYYY
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i
        ];

        const timePatterns = [
            // HH:MM with optional AM/PM
            /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
            // HH AM/PM
            /\b(\d{1,2})\s*(am|pm)\b/i
        ];

        // Find date first
        let foundDate = null;
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                console.log('Found date pattern:', match[0]);
                try {
                    foundDate = new Date(match[0]);
                    if (!isNaN(foundDate.getTime())) {
                        break;
                    }
                } catch (error) {
                    console.warn('Date parsing failed:', match[0], error);
                }
            }
        }

        if (!foundDate || isNaN(foundDate.getTime())) {
            return null;
        }

        // Find time and apply it to the date
        for (const pattern of timePatterns) {
            const match = text.match(pattern);
            if (match) {
                console.log('Found time pattern:', match[0]);
                const timeDate = this.applyTimeToDate(foundDate, match[0]);
                if (timeDate && !isNaN(timeDate.getTime())) {
                    return timeDate.toISOString().slice(0, 16);
                }
            }
        }

        // If no time found, use the date with default time (current time + 1 hour)
        foundDate.setHours(foundDate.getHours() + 1);
        return foundDate.toISOString().slice(0, 16);
    }

    extractDateOnly(text) {
        // Patterns for dates only
        const patterns = [
            /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](\d{4})\b/,
            /\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](\d{4})\b/,
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i,
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i,
            /\b(\d{4})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])\b/
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                console.log('Found date-only pattern:', match[0]);
                try {
                    const date = new Date(match[0]);
                    if (!isNaN(date.getTime())) {
                        // Add current time + 1 hour as default
                        date.setHours(new Date().getHours() + 1, 0, 0, 0);
                        return date.toISOString().slice(0, 16);
                    }
                } catch (error) {
                    console.warn('Date parsing failed for date-only:', match[0], error);
                }
            }
        }
        return null;
    }

    extractRelativeDate(text) {
        const relativeDates = {
            'today': 0,
            'tomorrow': 1,
            'day after tomorrow': 2,
            'next week': 7,
            'in 1 day': 1,
            'in 2 days': 2,
            'in 3 days': 3
        };

        const lowerText = text.toLowerCase();
        
        for (const [key, daysToAdd] of Object.entries(relativeDates)) {
            if (lowerText.includes(key)) {
                console.log('Found relative date:', key);
                let date = new Date();
                date.setDate(date.getDate() + daysToAdd);
                
                // Try to extract time for relative dates
                const timeMatch = lowerText.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/);
                if (timeMatch) {
                    date = this.applyTimeToDate(date, timeMatch[0]);
                } else {
                    // Default to current time + 1 hour if no time specified
                    date.setHours(date.getHours() + 1, 0, 0, 0);
                }
                
                if (!isNaN(date.getTime())) {
                    return date.toISOString().slice(0, 16);
                }
            }
        }
        return null;
    }

    applyTimeToDate(baseDate, timeString) {
        const date = new Date(baseDate);
        const timeMatch = timeString.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
        
        if (!timeMatch) return baseDate;
        
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
// Save event to local calendar
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
// Open Google Calendar with pre-filled event details
    handleExportGoogleEvent(eventData) {
        const startTime = new Date(eventData.dateTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endTime = new Date(new Date(eventData.dateTime).getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(eventData.description || '')}`;
        
        window.open(googleCalendarUrl, '_blank');
        this.view.showNotification('Google Calendar opened with your event!');
    }
}