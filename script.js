document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const newUploadButton = document.getElementById('newUploadButton');
    const analyzeButton = document.getElementById('analyzeButton');
    let currentFile = null;

    // Handle file selection
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPEG or PNG)');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            dropZone.hidden = true;
            previewContainer.hidden = false;
        };
        reader.readAsDataURL(file);
    }

    // File upload event handlers
    uploadButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });

    // New upload button handler
    newUploadButton.addEventListener('click', () => {
        dropZone.hidden = false;
        previewContainer.hidden = true;
        fileInput.value = '';
        imagePreview.src = '';
        currentFile = null;
        document.getElementById('resultContainer').hidden = true;
    });

    // Analyze button handler
    analyzeButton.addEventListener('click', async () => {
        if (!currentFile) return;

        const loader = document.getElementById('loader');
        const results = document.getElementById('results');
        const resultContainer = document.getElementById('resultContainer');
        const resultsContent = document.getElementById('resultsContent');

        loader.hidden = false;
        results.hidden = true;
        resultContainer.hidden = false;

        // Get image dimensions
        const img = new Image();
        img.src = imagePreview.src;
        await img.decode();

        // Simulate AI analysis (replace with actual API call)
        setTimeout(() => {
            loader.hidden = true;
            results.hidden = false;

            // Generate detailed analysis results
            const analysisResults = {
                basicInfo: {
                    fileName: currentFile.name,
                    fileType: currentFile.type,
                    fileSize: formatFileSize(currentFile.size),
                    dimensions: `${img.naturalWidth} × ${img.naturalHeight} pixels`,
                    aspectRatio: calculateAspectRatio(img.naturalWidth, img.naturalHeight)
                },
                imageAnalysis: {
                    dominantColors: ['#2196F3', '#4CAF50', '#FFC107'],
                    brightness: 'Medium',
                    contrast: 'High',
                    sharpness: '85%'
                },
                contentAnalysis: {
                    mainSubject: 'Nature/Landscape',
                    detectedObjects: ['Trees', 'Sky', 'Mountains', 'Clouds'],
                    suggestedTags: ['Outdoor', 'Scenic', 'Daytime', 'Natural'],
                    confidence: '92%'
                },
                technicalDetails: {
                    compression: 'JPEG Standard',
                    colorSpace: 'sRGB',
                    bitDepth: '24-bit',
                    dpi: '72'
                }
            };

            // Display results
            resultsContent.innerHTML = generateResultsHTML(analysisResults);

            // Add copy button functionality
            const copyButtons = document.querySelectorAll('.copy-btn');
            copyButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const textToCopy = btn.getAttribute('data-copy');
                    navigator.clipboard.writeText(textToCopy)
                        .then(() => {
                            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                            setTimeout(() => {
                                btn.innerHTML = '<i class="fas fa-copy"></i>';
                            }, 2000);
                        });
                });
            });
        }, 2000);
    });

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            
            // Update active states
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${tab}Tab`).classList.add('active');

            // Handle camera initialization
            if (tab === 'camera') {
                initCamera();
            } else {
                stopCamera();
            }
        });
    });

    // Camera functionality
    let stream = null;
    let currentFacingMode = 'environment'; // Start with back camera

    // Initialize camera
    async function initCamera() {
        const videoElement = document.getElementById('videoElement');
        const constraints = {
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };

        try {
            if (stream) {
                stopCamera();
            }

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = stream;
            
            // Show camera UI
            document.querySelector('.camera-preview-container').hidden = true;
            videoElement.hidden = false;
            document.getElementById('canvasElement').hidden = true;
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Unable to access camera. Please make sure you have granted camera permissions.');
        }
    }

    // Stop camera stream
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }

    // Switch camera
    document.getElementById('switchCameraBtn').addEventListener('click', () => {
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        initCamera();
    });

    // Capture photo
    document.getElementById('captureBtn').addEventListener('click', () => {
        const videoElement = document.getElementById('videoElement');
        const canvasElement = document.getElementById('canvasElement');
        const capturedImage = document.getElementById('capturedImage');
        
        // Set canvas dimensions to match video
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        
        // Draw video frame to canvas
        const context = canvasElement.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        // Convert to image
        capturedImage.src = canvasElement.toDataURL('image/jpeg');
        
        // Show preview
        videoElement.hidden = true;
        document.querySelector('.camera-preview-container').hidden = false;
    });

    // Retake photo
    document.getElementById('retakeBtn').addEventListener('click', () => {
        document.getElementById('videoElement').hidden = false;
        document.querySelector('.camera-preview-container').hidden = true;
    });

    // Use captured photo
    document.getElementById('usePhotoBtn').addEventListener('click', () => {
        const capturedImage = document.getElementById('capturedImage');
        const imagePreview = document.getElementById('imagePreview');
        
        // Update preview
        imagePreview.src = capturedImage.src;
        
        // Switch to preview mode
        document.getElementById('uploadTab').classList.add('active');
        document.getElementById('cameraTab').classList.remove('active');
        document.querySelector('[data-tab="upload"]').classList.add('active');
        document.querySelector('[data-tab="camera"]').classList.remove('active');
        
        // Show preview container
        document.getElementById('previewContainer').hidden = false;
        document.getElementById('dropZone').hidden = true;
        
        // Stop camera
        stopCamera();
    });

    // Clean up camera when leaving page
    window.addEventListener('beforeunload', stopCamera);

    // Utility functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function calculateAspectRatio(width, height) {
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        return `${width/divisor}:${height/divisor}`;
    }

    function generateResultsHTML(analysis) {
        return `
            <div class="results-section">
                <div class="result-card">
                    <h3><i class="fas fa-info-circle"></i> Basic Information</h3>
                    <div class="result-grid">
                        <div class="result-item">
                            <span class="label">File Name:</span>
                            <span class="value">${analysis.basicInfo.fileName}</span>
                            <button class="copy-btn" data-copy="${analysis.basicInfo.fileName}">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <div class="result-item">
                            <span class="label">File Type:</span>
                            <span class="value">${analysis.basicInfo.fileType}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">File Size:</span>
                            <span class="value">${analysis.basicInfo.fileSize}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Dimensions:</span>
                            <span class="value">${analysis.basicInfo.dimensions}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Aspect Ratio:</span>
                            <span class="value">${analysis.basicInfo.aspectRatio}</span>
                        </div>
                    </div>
                </div>

                <div class="result-card">
                    <h3><i class="fas fa-palette"></i> Image Analysis</h3>
                    <div class="result-grid">
                        <div class="result-item">
                            <span class="label">Dominant Colors:</span>
                            <div class="color-chips">
                                ${analysis.imageAnalysis.dominantColors.map(color => 
                                    `<div class="color-chip" style="background-color: ${color}" title="${color}"></div>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="result-item">
                            <span class="label">Brightness:</span>
                            <span class="value">${analysis.imageAnalysis.brightness}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Contrast:</span>
                            <span class="value">${analysis.imageAnalysis.contrast}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Sharpness:</span>
                            <span class="value">${analysis.imageAnalysis.sharpness}</span>
                        </div>
                    </div>
                </div>

                <div class="result-card">
                    <h3><i class="fas fa-eye"></i> Content Analysis</h3>
                    <div class="result-grid">
                        <div class="result-item">
                            <span class="label">Main Subject:</span>
                            <span class="value">${analysis.contentAnalysis.mainSubject}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Detected Objects:</span>
                            <div class="tag-list">
                                ${analysis.contentAnalysis.detectedObjects.map(obj => 
                                    `<span class="tag">${obj}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="result-item">
                            <span class="label">Suggested Tags:</span>
                            <div class="tag-list">
                                ${analysis.contentAnalysis.suggestedTags.map(tag => 
                                    `<span class="tag">${tag}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="result-item">
                            <span class="label">Confidence:</span>
                            <span class="value">${analysis.contentAnalysis.confidence}</span>
                        </div>
                    </div>
                </div>

                <div class="result-card">
                    <h3><i class="fas fa-cog"></i> Technical Details</h3>
                    <div class="result-grid">
                        <div class="result-item">
                            <span class="label">Compression:</span>
                            <span class="value">${analysis.technicalDetails.compression}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Color Space:</span>
                            <span class="value">${analysis.technicalDetails.colorSpace}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Bit Depth:</span>
                            <span class="value">${analysis.technicalDetails.bitDepth}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">DPI:</span>
                            <span class="value">${analysis.technicalDetails.dpi}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Intersection Observer for triggering animations
    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        const missionStats = document.querySelector('.mission-stats');
        if (missionStats) {
            observer.observe(missionStats);
        }
    });
});

// Page Transition
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const pageTransition = document.querySelector('.page-transition');

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            if (link.classList.contains('active')) return;
            
            e.preventDefault();
            const target = link.href;

            pageTransition.classList.add('active');
            
            setTimeout(() => {
                window.location.href = target;
            }, 600);
        });
    });
});
