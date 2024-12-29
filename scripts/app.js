// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const analyzeButton = document.getElementById('analyzeButton');
const newUploadButton = document.getElementById('newUploadButton');
const imagePreview = document.getElementById('imagePreview');
const previewContainer = document.getElementById('previewContainer');
const resultContainer = document.getElementById('resultContainer');
const loader = document.getElementById('loader');
const resultsContent = document.getElementById('resultsContent');

// Event Listeners
uploadButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('drop', handleDrop);
analyzeButton.addEventListener('click', analyzeImage);
newUploadButton.addEventListener('click', resetUpload);

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPEG, PNG)');
            return;
        }
        displayPreview(file);
    }
}

// Handle drag and drop
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        displayPreview(file);
    }
}

// Display image preview
function displayPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.src = e.target.result;
        dropZone.style.display = 'none';
        previewContainer.hidden = false;
        
        // Log image details for debugging
        console.log('Image loaded:', {
            size: file.size,
            type: file.type,
            name: file.name
        });
    };
    reader.onerror = function(e) {
        console.error('FileReader error:', e);
        alert('Error reading the image file. Please try again.');
    };
    reader.readAsDataURL(file);
}

// Reset upload
function resetUpload() {
    fileInput.value = '';
    imagePreview.src = '';
    dropZone.style.display = 'block';
    previewContainer.hidden = true;
    resultContainer.hidden = true;
    resultsContent.innerHTML = '';
}

// Analyze image using Gemini API
async function analyzeImage() {
    try {
        // Show loader
        loader.hidden = false;
        resultContainer.hidden = false;
        resultsContent.innerHTML = '';

        // Convert image to base64
        const base64Image = imagePreview.src.split(',')[1];

        // Gemini API endpoint
        const API_KEY = 'AIzaSyCvKvITPAGT3agOdhEvDrm1FnbjI-TvJt0';
        const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

        // Prepare the request body
        const requestBody = {
            contents: [{
                parts: [{
                    text: "Analyze this image and provide detailed information about what you see. If it's a plant, animal, or bird, provide its characteristics and any interesting facts."
                }, {
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: base64Image
                    }
                }]
            }]
        };

        console.log('Sending request to Gemini API with URL:', API_URL);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const text = data.candidates[0].content.parts[0].text;
            displayResults({
                description: text || 'No description available'
            });
        } else {
            console.error('Invalid API response format:', data);
            throw new Error('Invalid response format from API');
        }
    } catch (error) {
        console.error('Detailed error:', error);
        resultsContent.innerHTML = `
            <div class="error-message">
                <h3>Error Analysis</h3>
                <p>${error.message}</p>
                <p>Troubleshooting steps:</p>
                <ul>
                    <li>Make sure the image is in JPEG or PNG format</li>
                    <li>Image size should be less than 4MB</li>
                    <li>Check your internet connection</li>
                    <li>Try with a different image</li>
                </ul>
            </div>
        `;
    } finally {
        loader.hidden = true;
    }
}

// Display results
function displayResults(data) {
    // Process the text to separate main points and subpoints
    const processedContent = processContent(data.description);

    // Create the HTML structure
    const html = `
        <div class="outline-container">
            <div class="outline-header">
                <h2><i class="fas fa-list-ol"></i> Analysis Results</h2>
            </div>
            <div class="outline-body">
                ${processedContent.map((section, index) => `
                    <div class="outline-box" style="--delay: ${index * 0.1}s">
                        <div class="point-number">${romanize(index + 1)}.</div>
                        <div class="point-content">
                            <h3 class="main-point">${section.mainPoint}</h3>
                            ${section.subPoints.map((subPoint, subIndex) => `
                                <div class="sub-point">
                                    <span class="sub-marker">${String.fromCharCode(65 + subIndex)}.</span>
                                    <p>${subPoint}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    resultsContent.innerHTML = html;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .outline-container {
            padding: 2rem;
            background: var(--surface-color);
            border-radius: var(--radius-lg);
            max-width: 1200px;
            margin: 0 auto;
        }

        .outline-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .outline-header h2 {
            font-family: 'Poppins', sans-serif;
            font-size: 2.5rem;
            color: var(--primary-color);
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
        }

        .outline-body {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        .outline-box {
            position: relative;
            background: white;
            border-radius: var(--radius-md);
            padding: 2rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            display: flex;
            gap: 1.5rem;
            animation: slideIn 0.5s ease-out forwards;
            animation-delay: var(--delay);
            opacity: 0;
            transform: translateY(20px);
            border-left: 4px solid var(--primary-color);
        }

        .point-number {
            font-family: 'Zen Dots', cursive;
            font-size: 2rem;
            color: var(--primary-color);
            min-width: 50px;
            display: flex;
            align-items: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .point-content {
            flex-grow: 1;
        }

        .main-point {
            font-family: 'Zen Dots', cursive;
            font-size: 1.4rem;
            color: var(--text-primary);
            margin: 0 0 1.5rem 0;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid var(--border-color);
            letter-spacing: 1px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            position: relative;
        }

        .main-point::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
        }

        .sub-point {
            display: flex;
            gap: 1rem;
            padding: 0.75rem;
            margin: 0.5rem 0;
            background: rgba(0, 0, 0, 0.02);
            border-radius: var(--radius-sm);
            transition: transform 0.2s ease;
        }

        .sub-point:hover {
            transform: translateX(10px);
            background: rgba(0, 0, 0, 0.04);
        }

        .sub-marker {
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            color: var(--secondary-color);
            min-width: 25px;
        }

        .sub-point p {
            margin: 0;
            font-size: 1rem;
            color: var(--text-secondary);
            line-height: 1.5;
        }

        @keyframes slideIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 768px) {
            .outline-container {
                padding: 1rem;
            }

            .outline-box {
                padding: 1.5rem;
            }

            .outline-header h2 {
                font-size: 2rem;
            }

            .point-number {
                font-size: 1.25rem;
            }

            .main-point {
                font-size: 1.1rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// Helper function to convert numbers to Roman numerals
function romanize(num) {
    const roman = {
        M: 1000, CM: 900, D: 500, CD: 400,
        C: 100, XC: 90, L: 50, XL: 40,
        X: 10, IX: 9, V: 5, IV: 4, I: 1
    };
    let str = '';
    for (let i of Object.keys(roman)) {
        let q = Math.floor(num / roman[i]);
        num -= q * roman[i];
        str += i.repeat(q);
    }
    return str;
}

// Process content to separate main points and subpoints
function processContent(text) {
    const sections = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentMainPoint = '';
    let currentSubPoints = [];

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (isMainPoint(trimmedLine)) {
            if (currentMainPoint) {
                sections.push({
                    mainPoint: currentMainPoint,
                    subPoints: currentSubPoints
                });
                currentSubPoints = [];
            }
            currentMainPoint = trimmedLine;
        } else if (trimmedLine && currentMainPoint) {
            currentSubPoints.push(trimmedLine);
        }
    });

    if (currentMainPoint) {
        sections.push({
            mainPoint: currentMainPoint,
            subPoints: currentSubPoints
        });
    }

    return sections;
}

// Helper function to determine if a line is a main point
function isMainPoint(line) {
    return line.match(/^[A-Z]/) && // Starts with capital letter
           (line.length < 100 || // Not too long
            line.includes(':') || // Contains a colon
            line.match(/^(The|A|An|What|How|Why|Where|When|Who|This|These|Those)/i)); // Starts with common beginning words
}

// Add some CSS for better error display
const style = document.createElement('style');
style.textContent = `
    .error-message {
        background: #fff3f3;
        border: 1px solid #ffcdd2;
        border-radius: 8px;
        padding: 20px;
        margin-top: 20px;
    }
    .error-message h3 {
        color: #d32f2f;
        margin-bottom: 10px;
    }
    .error-message ul {
        margin-top: 10px;
        padding-left: 20px;
    }
    .analysis-content p {
        margin-bottom: 10px;
        line-height: 1.6;
    }
`;
document.head.appendChild(style);
