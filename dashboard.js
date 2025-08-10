// dashboard.js - Updated for multi-step form with enhanced functionality

// Configuration
const N8N_WEBHOOK_URL = '/api/webhook.js'
const CLOUDINARY_UPLOAD_PRESET = 'n8n-ai-preset'; // Replace with your Cloudinary upload preset
const CLOUDINARY_CLOUD_NAME = 'vic-3e'; // Replace with your Cloudinary cloud name

// Global variables
let currentStep = 1;
let totalSteps = 4;
let uploadedFiles = {
    banner: null,
    logo: null
};
let stepValidation = {
    1: false,
    2: false,
    3: false,
    4: true // Social media is optional
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    setupEventListeners();
    initializeFormSteps();
    setupAutoSave();
    setupCharacterCounters();
    console.log('Multi-step dashboard initialized');
}

// Event Listeners Setup
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleTabClick);
    });

    // Form submission
    const storeForm = document.getElementById('store-form');
    if (storeForm) {
        storeForm.addEventListener('submit', handleFormSubmit);
    }

    // Auto-generate slug from store name
    const storeNameInput = document.getElementById('store_name');
    if (storeNameInput) {
        storeNameInput.addEventListener('input', generateSlug);
    }

    // File upload handlers
    setupFileUpload('banner');
    setupFileUpload('logo');

    // Form validation on input
    setupFormValidation();

    // Step navigation clicks
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', (e) => {
            const stepNumber = parseInt(step.dataset.step);
            if (stepNumber < currentStep || isStepAccessible(stepNumber)) {
                goToStep(stepNumber);
            }
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
}

// Tab Management
function handleTabClick(e) {
    e.preventDefault();
    const tabName = this.dataset.tab;
    switchTab(tabName);
}

function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Reset to step 1 when switching tabs
    if (tabName === 'add-store') {
        goToStep(1, false);
    }
}

// Form Steps Management
function initializeFormSteps() {
    showStep(1);
    updateStepIndicator();
    updateProgress();
}

function showStep(step, animate = true) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach((stepElement, index) => {
        stepElement.classList.remove('active');
        
        if (animate) {
            if (index + 1 === currentStep) {
                stepElement.classList.add(step > currentStep ? 'slide-out-left' : 'slide-out-right');
            }
        }
    });

    // Show current step
    setTimeout(() => {
        const currentStepElement = document.getElementById(`step-${step}`);
        if (currentStepElement) {
            // Remove animation classes
            document.querySelectorAll('.form-step').forEach(stepElement => {
                stepElement.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
            });

            if (animate && currentStep !== step) {
                currentStepElement.classList.add(step > currentStep ? 'slide-in-right' : 'slide-in-left');
            }
            
            currentStepElement.classList.add('active');
            currentStep = step;
            updateStepIndicator();
            updateProgress();
            
            // Focus first input in the step
            const firstInput = currentStepElement.querySelector('input, select, textarea');
            if (firstInput && !firstInput.disabled) {
                setTimeout(() => firstInput.focus(), 300);
            }
        }
    }, animate ? 150 : 0);
}

function updateStepIndicator() {
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

function updateProgress() {
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

// Step Navigation Functions
function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            goToStep(currentStep + 1);
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

function goToStep(step, animate = true) {
    if (step >= 1 && step <= totalSteps) {
        showStep(step, animate);
        
        // Update URL hash for better UX
        history.replaceState(null, null, `#step-${step}`);
    }
}

function isStepAccessible(step) {
    // Users can go to any previous step or the next step if current is valid
    return step <= currentStep || (step === currentStep + 1 && validateCurrentStep());
}

// Step Validation
function validateCurrentStep() {
    let isValid = true;
    let errors = [];

    switch (currentStep) {
        case 1: // Basic Information
            isValid = validateBasicInfo();
            break;
        case 2: // Images
            isValid = validateImages();
            break;
        case 3: // Contact
            isValid = validateContact();
            break;
        case 4: // Social Media (optional)
            isValid = true; // Social media is optional
            break;
    }

    stepValidation[currentStep] = isValid;
    
    if (!isValid) {
        showError('Please complete all required fields in this step before proceeding.');
    }

    return isValid;
}

function validateBasicInfo() {
    const requiredFields = ['store_name', 'store_slug', 'store_category'];
    let isValid = true;

    requiredFields.forEach(fieldId => {
        if (!validateField(fieldId)) {
            isValid = false;
        }
    });

    return isValid;
}

function validateImages() {
    let isValid = true;
    let errors = [];

    if (!uploadedFiles.banner) {
        errors.push('Store banner is required');
        isValid = false;
    }

    if (!uploadedFiles.logo) {
        errors.push('Store logo is required');
        isValid = false;
    }

    if (errors.length > 0) {
        showError('Missing required images: ' + errors.join(', '));
    }

    return isValid;
}

function validateContact() {
    const requiredFields = ['contact_email', 'address'];
    let isValid = true;

    requiredFields.forEach(fieldId => {
        if (!validateField(fieldId)) {
            isValid = false;
        }
    });

    return isValid;
}

// Auto-generate slug from store name
function generateSlug() {
    const storeName = document.getElementById('store_name').value;
    const slugInput = document.getElementById('store_slug');
    
    if (storeName && slugInput && !slugInput.dataset.manuallyEdited) {
        const slug = storeName
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        slugInput.value = slug;
        updateSlugPreview();
        validateField('store_slug');
    }
}

function updateSlugPreview() {
    const slug = document.getElementById('store_slug').value;
    let preview = document.getElementById('slug-preview');
    
    if (!preview) {
        preview = document.createElement('div');
        preview.id = 'slug-preview';
        preview.className = 'slug-preview';
        const slugInput = document.getElementById('store_slug');
        slugInput.parentNode.appendChild(preview);
    }
    
    if (slug) {
        const baseUrl = window.location.origin;
        preview.innerHTML = `
            <i class="fas fa-link"></i>
            <span>Store URL: <code>${baseUrl}/store/${slug}</code></span>
        `;
    } else {
        preview.innerHTML = '';
    }
}

// File Upload Setup
function setupFileUpload(type) {
    const uploadArea = document.getElementById(`${type}-upload`);
    const fileInput = document.getElementById(`store_${type}`);
    const preview = document.getElementById(`${type}-preview`);

    if (!uploadArea || !fileInput || !preview) return;

    // Click to browse
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0], type);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0], type);
        }
    });
}

// Handle File Selection
async function handleFileSelect(file, type) {
    if (!file) return;

    // Validate file
    const validation = validateFile(file, type);
    if (!validation.valid) {
        showError(validation.message);
        return;
    }

    try {
        // Show enhanced preview with dimensions
        await showFilePreviewEnhanced(file, type);
        
        // Store file for later upload
        uploadedFiles[type] = file;
        
        // Auto-save progress
        autoSave();
        
        showSuccess(`${type === 'banner' ? 'Banner' : 'Logo'} uploaded successfully!`);
        
    } catch (error) {
        showError(`Error processing ${type}: ${error.message}`);
    }
}

// File Validation
function validateFile(file, type) {
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    const maxSizeMB = 8;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            message: `Invalid file type for ${type}. Please upload PNG, JPG, JPEG, or WEBP files only.`
        };
    }

    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            message: `${type === 'banner' ? 'Banner' : 'Logo'} file size too large. Please upload files smaller than ${maxSizeMB}MB.`
        };
    }

    // Type-specific validations
    if (type === 'banner' && file.size < 50000) {
        return {
            valid: false,
            message: 'Banner image seems too small. Please upload a higher quality image (at least 50KB).'
        };
    }

    if (type === 'logo' && file.size < 10000) {
        return {
            valid: false,
            message: 'Logo image seems too small. Please upload a higher quality image (at least 10KB).'
        };
    }

    return { valid: true };
}

// Enhanced file preview with dimension validation
async function validateImageDimensions(file, type) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const width = this.width;
            const height = this.height;
            
            let recommendation = '';
            let isOptimal = true;
            let severity = 'info';
            
            if (type === 'banner') {
                if (width < 1000 || height < 300) {
                    recommendation = `Banner dimensions (${width}×${height}px) are smaller than recommended (1230×350px). It may appear blurry on larger screens.`;
                    isOptimal = false;
                    severity = 'warning';
                }
                if (width / height < 3 || width / height > 4) {
                    recommendation = 'Banner aspect ratio should be approximately 3.5:1 for optimal display across different screen sizes.';
                    isOptimal = false;
                }
            } else if (type === 'logo') {
                if (width < 100 || height < 100) {
                    recommendation = `Logo dimensions (${width}×${height}px) are smaller than recommended (140×140px). It may appear blurry.`;
                    isOptimal = false;
                    severity = 'warning';
                }
                const aspectRatio = Math.abs(width - height) / Math.min(width, height);
                if (aspectRatio > 0.2) {
                    recommendation = 'Logo should be square or nearly square for consistent display across the platform.';
                    isOptimal = false;
                }
            }
            
            resolve({ width, height, recommendation, isOptimal, severity });
        };
        
        img.onerror = () => {
            resolve({ width: 0, height: 0, recommendation: 'Could not read image dimensions', isOptimal: false, severity: 'warning' });
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Enhanced file preview
async function showFilePreviewEnhanced(file, type) {
    const preview = document.getElementById(`${type}-preview`);
    const uploadArea = document.getElementById(`${type}-upload`);
    
    if (!preview || !uploadArea) return;

    // Get image dimensions and validation
    const dimensions = await validateImageDimensions(file, type);

    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `
            <div class="file-preview-content">
                <img src="${e.target.result}" alt="${type} preview">
                <div class="file-info">
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            <span class="file-size">${formatFileSize(file.size)}</span>
                            <span class="file-dimensions">${dimensions.width}×${dimensions.height}px</span>
                        </div>
                        ${dimensions.recommendation ? 
                            `<div class="file-recommendation ${dimensions.severity}">
                                <i class="fas fa-${dimensions.severity === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                                ${dimensions.recommendation}
                            </div>` : 
                            `<div class="file-recommendation info">
                                <i class="fas fa-check-circle"></i>
                                Image dimensions look great!
                            </div>`
                        }
                    </div>
                    <button type="button" class="remove-file" onclick="removeFile('${type}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        preview.classList.add('show');
        
        // Hide upload placeholder
        const placeholder = uploadArea.querySelector('.upload-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    };
    
    reader.onerror = () => {
        showError(`Error reading ${type} file`);
    };
    
    reader.readAsDataURL(file);
}

// Remove File
function removeFile(type) {
    const preview = document.getElementById(`${type}-preview`);
    const uploadArea = document.getElementById(`${type}-upload`);
    const fileInput = document.getElementById(`store_${type}`);
    
    if (preview) {
        preview.classList.remove('show');
        preview.innerHTML = '';
    }
    
    if (fileInput) {
        fileInput.value = '';
    }
    
    if (uploadArea) {
        const placeholder = uploadArea.querySelector('.upload-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
    }
    
    uploadedFiles[type] = null;
    autoSave(); // Save the removal
    
    showInfo(`${type === 'banner' ? 'Banner' : 'Logo'} removed`);
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Form Validation Setup
function setupFormValidation() {
    const requiredFields = [
        'store_name',
        'store_slug', 
        'store_category',
        'contact_email',
        'address'
    ];

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => validateField(fieldId));
            field.addEventListener('input', () => {
                clearFieldError(fieldId);
                autoSave();
            });
        }
    });

    // Special handling for slug field
    const slugField = document.getElementById('store_slug');
    if (slugField) {
        slugField.addEventListener('input', () => {
            slugField.dataset.manuallyEdited = 'true';
            updateSlugPreview();
            autoSave();
        });
    }

    // Email validation
    const emailField = document.getElementById('contact_email');
    if (emailField) {
        emailField.addEventListener('blur', validateEmail);
    }

        // URL validation for social media and website
    const urlFields = [
        'contact_website',
        'media_facebook',
        'media_instagram', 
        'media_twitter',
        'media_youtube',
        'media_linkedin',
        'media_tiktok',
        'media_pinterest',
        'media_reddit'
    ];

    urlFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => validateURL(fieldId));
            field.addEventListener('input', () => autoSave());
        }
    });
}

// Field Validation
function validateField(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}_error`);
    
    if (!field) return true;

    let isValid = true;
    let errorMessage = '';

    const value = field.value.trim();

    // Check if required field is empty
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }

    // Specific validations
    switch (fieldId) {
        case 'store_name':
            if (value && value.length < 2) {
                isValid = false;
                errorMessage = 'Store name must be at least 2 characters long';
            } else if (value && value.length > 100) {
                isValid = false;
                errorMessage = 'Store name must be less than 100 characters';
            }
            break;
        
        case 'store_slug':
            if (value && !/^[a-z0-9-]+$/.test(value)) {
                isValid = false;
                errorMessage = 'Slug can only contain lowercase letters, numbers, and hyphens';
            } else if (value && value.length < 2) {
                isValid = false;
                errorMessage = 'Slug must be at least 2 characters long';
            }
            break;
        
        case 'contact_email':
            if (value && !isValidEmail(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
            
        case 'address':
            if (value && value.length < 10) {
                isValid = false;
                errorMessage = 'Please enter a complete address';
            }
            break;
    }

    // Show/hide error
    if (errorElement) {
        if (isValid) {
            errorElement.classList.remove('show');
            field.style.borderColor = '';
        } else {
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
            field.style.borderColor = 'var(--danger-color)';
        }
    }

    return isValid;
}

function validateEmail() {
    const field = document.getElementById('contact_email');
    const errorElement = document.getElementById('contact_email_error');
    
    if (!field) return true;

    const email = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !email) {
        isValid = false;
        errorMessage = 'Email address is required';
    } else if (email && !isValidEmail(email)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    }

    if (errorElement) {
        if (isValid) {
            errorElement.classList.remove('show');
            field.style.borderColor = '';
        } else {
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
            field.style.borderColor = 'var(--danger-color)';
        }
    }

    return isValid;
}

function validateURL(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return true;

    const url = field.value.trim();
    if (!url) return true; // Optional field

    let isValid = true;
    
    try {
        new URL(url);
        
        // Additional validation for social media URLs
        if (fieldId.startsWith('media_')) {
            const platform = fieldId.replace('media_', '');
            isValid = validateSocialMediaURL(url, platform);
        }
    } catch {
        isValid = false;
    }

    if (isValid) {
        field.style.borderColor = '';
    } else {
        field.style.borderColor = 'var(--danger-color)';
        
        // Show helpful hint for social media URLs
        if (fieldId.startsWith('media_')) {
            const platform = fieldId.replace('media_', '');
            showError(`Please enter a valid ${platform} URL`);
        }
    }

    return isValid;
}

function validateSocialMediaURL(url, platform) {
    const patterns = {
        facebook: /^https?:\/\/(www\.)?facebook\.com\/.+/,
        instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/,
        twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/,
        youtube: /^https?:\/\/(www\.)?youtube\.com\/.+/,
        linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.+/,
        tiktok: /^https?:\/\/(www\.)?tiktok\.com\/.+/,
        pinterest: /^https?:\/\/(www\.)?pinterest\.com\/.+/,
        reddit: /^https?:\/\/(www\.)?reddit\.com\/.+/
    };

    return patterns[platform] ? patterns[platform].test(url) : true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function clearFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}_error`);
    const field = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.classList.remove('show');
    }
    if (field) {
        field.style.borderColor = '';
    }
}

// Form Submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Final validation of all steps
    if (!validateAllSteps()) {
        showError('Please complete all required fields before submitting');
        return;
    }

    // Check for required files
    if (!uploadedFiles.banner || !uploadedFiles.logo) {
        showError('Please upload both store banner and logo images');
        goToStep(2); // Go to images step
        return;
    }

    try {
        showLoading('Preparing your store...');
        updateLoadingProgress(10);
        
        // Upload images to Cloudinary
        updateLoadingMessage('Uploading banner image...');
        const bannerUrl = await uploadToCloudinary(uploadedFiles.banner, 'banner');
        updateLoadingProgress(40);
        
        updateLoadingMessage('Uploading logo image...');
        const logoUrl = await uploadToCloudinary(uploadedFiles.logo, 'logo');
        updateLoadingProgress(70);
        
        updateLoadingMessage('Preparing store data...');
        
        // Prepare form data
        const storeData = collectFormData();
        storeData.store_banner.image_url = bannerUrl;
        storeData.store_logo.image_url = logoUrl;
        
        updateLoadingProgress(80);
        updateLoadingMessage('Submitting to marketplace...');
        
        // Send to n8n webhook
        await sendToWebhook(storeData);
        
        updateLoadingProgress(100);
        updateLoadingMessage('Store created successfully!');
        
        setTimeout(() => {
            hideLoading();
            showSuccessModal();
            clearDraft();
        }, 1000);
        
    } catch (error) {
        hideLoading();
        showError('Failed to create store: ' + error.message);
        console.error('Form submission error:', error);
    }
}

function validateAllSteps() {
    let allValid = true;
    
    // Validate each step
    for (let step = 1; step <= totalSteps; step++) {
        const originalStep = currentStep;
        currentStep = step;
        
        if (!validateCurrentStep()) {
            allValid = false;
            // Go to first invalid step
            if (currentStep === step) {
                goToStep(step);
                break;
            }
        }
        
        currentStep = originalStep;
    }
    
    return allValid;
}

// Upload to Cloudinary
async function uploadToCloudinary(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `clasima-stores/${type}`);
    formData.append('public_id', `${Date.now()}-${type}`);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to upload ${type} image: ${errorData}`);
    }

    const data = await response.json();
    return data.secure_url;
}

// Collect Form Data
function collectFormData() {
    const formData = {
        store_banner: {
            image_url: "",
            recommended_size: "1230x350px",
            max_file_size_mb: 8,
            allowed_types: ["png", "jpg", "jpeg", "webp"]
        },
        store_logo: {
            image_url: "",
            recommended_size: "140x140px", 
            max_file_size_mb: 8,
            allowed_types: ["png", "jpg", "jpeg", "webp"]
        },
        opening_hours: {
            status: getValue('opening_hours')
        },
        store_name: getValue('store_name'),
        store_slug: getValue('store_slug'),
        slogan: getValue('slogan'),
        store_category: getValue('store_category'),
        contact: {
            email: getValue('contact_email'),
            phone: getValue('contact_phone'),
            whatsapp: getValue('contact_whatsapp'),
            website: getValue('contact_website')
        },
        address: getValue('address'),
        details: getValue('details'),
        media: {
            facebook: getValue('media_facebook'),
            twitter: getValue('media_twitter'),
            youtube: getValue('media_youtube'),
            instagram: getValue('media_instagram'),
            linkedin: getValue('media_linkedin'),
            pinterest: getValue('media_pinterest'),
            reddit: getValue('media_reddit'),
            tiktok: getValue('media_tiktok')
        },
        submission_timestamp: new Date().toISOString(),
        submission_source: 'clasima-dashboard',
        form_version: '1.0',
        current_step_completed: currentStep
    };

    return formData;
}

function getValue(fieldId) {
    const field = document.getElementById(fieldId);
    return field ? field.value.trim() : '';
}

// Send to n8n Webhook
async function sendToWebhook(data) {
    const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Webhook error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Loading and Progress Functions
function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const messageElement = document.getElementById('loading-message');
    
    if (overlay) {
        overlay.classList.add('show');
    }
    
    if (messageElement) {
        messageElement.textContent = message;
    }

    updateLoadingProgress(0);

    // Disable form
    const form = document.getElementById('store-form');
    if (form) {
        form.style.pointerEvents = 'none';
        form.style.opacity = '0.6';
    }
}

function updateLoadingMessage(message) {
    const messageElement = document.getElementById('loading-message');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

function updateLoadingProgress(percentage) {
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }

    // Re-enable form
    const form = document.getElementById('store-form');
    if (form) {
        form.style.pointerEvents = '';
        form.style.opacity = '';
    }
}

// Modal Functions
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    resetForm();
}

function createAnotherStore() {
    closeSuccessModal();
    // Form will be reset by closeSuccessModal
    showSuccess('Ready to create another store!');
}

// Notification Functions
function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showInfo(message) {
    showNotification(message, 'info');
}

function showWarning(message) {
    showNotification(message, 'warning');
}

function showNotification(message, type = 'info') {
    // Remove existing notifications of the same type
    document.querySelectorAll(`.notification.${type}`).forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type]}"></i>
        <span>${message}</span>
        <button class="close-notification" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    const timeout = setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    // Clear timeout on manual close
    notification.querySelector('.close-notification').addEventListener('click', () => {
        clearTimeout(timeout);
    });
}

// Auto-save functionality
let autoSaveTimeout;

function autoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        try {
            const formData = collectFormData();
            const draftData = {
                data: formData,
                currentStep: currentStep,
                uploadedFiles: {
                    banner: uploadedFiles.banner ? {
                        name: uploadedFiles.banner.name,
                        size: uploadedFiles.banner.size,
                        type: uploadedFiles.banner.type
                    } : null,
                    logo: uploadedFiles.logo ? {
                        name: uploadedFiles.logo.name,
                        size: uploadedFiles.logo.size,
                        type: uploadedFiles.logo.type
                    } : null
                },
                timestamp: Date.now()
            };
            
            localStorage.setItem('store-form-draft', JSON.stringify(draftData));
            console.log('Form auto-saved');
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }, 2000);
}

function loadDraft() {
    const draft = localStorage.getItem('store-form-draft');
    if (!draft) return;

    try {
        const { data, currentStep: savedStep, uploadedFiles: savedFiles, timestamp } = JSON.parse(draft);
        const age = Date.now() - timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (age > maxAge) {
            localStorage.removeItem('store-form-draft');
            return;
        }

        if (confirm(`Found a saved draft from ${new Date(timestamp).toLocaleString()}. Would you like to restore it?`)) {
            restoreFormData(data);
            
            // Restore current step
            if (savedStep && savedStep >= 1 && savedStep <= totalSteps) {
                goToStep(savedStep, false);
            }
            
            showSuccess('Draft restored successfully');
        }
    } catch (error) {
        console.error('Error loading draft:', error);
        localStorage.removeItem('store-form-draft');
    }
}

function restoreFormData(data) {
    // Restore basic fields
    setValue('store_name', data.store_name);
    setValue('store_slug', data.store_slug);
    setValue('slogan', data.slogan);
    setValue('store_category', data.store_category);
    setValue('opening_hours', data.opening_hours?.status);
    setValue('details', data.details);
    setValue('address', data.address);

    // Restore contact info
    if (data.contact) {
        setValue('contact_email', data.contact.email);
        setValue('contact_phone', data.contact.phone);
        setValue('contact_whatsapp', data.contact.whatsapp);
        setValue('contact_website', data.contact.website);
    }

    // Restore social media
    if (data.media) {
        Object.keys(data.media).forEach(platform => {
            setValue(`media_${platform}`, data.media[platform]);
        });
    }
    
    // Update slug preview
    updateSlugPreview();
}

function setValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field && value) {
        field.value = value;
        
        // Trigger validation for required fields
        if (field.hasAttribute('required')) {
            validateField(fieldId);
        }
    }
}

function clearDraft() {
    localStorage.removeItem('store-form-draft');
}

// Reset Form
function resetForm() {
    if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
        // Reset form fields
        const form = document.getElementById('store-form');
        if (form) {
            form.reset();
        }

        // Clear file uploads
        removeFile('banner');
        removeFile('logo');
        uploadedFiles = { banner: null, logo: null };

        // Clear all errors
        document.querySelectorAll('.field-error').forEach(error => {
            error.classList.remove('show');
        });

        // Reset field styling
        document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
            field.style.borderColor = '';
        });

        // Reset slug and preview
        document.getElementById('store_slug').value = '';
        document.getElementById('store_slug').dataset.manuallyEdited = '';
        updateSlugPreview();

        // Reset to first step
        goToStep(1, false);

        // Clear draft
        clearDraft();

        showSuccess('Form has been reset');
    }
}

// Character Counter Setup
function setupCharacterCounters() {
    const fieldsWithLimits = [
        { id: 'store_name', limit: 100 },
        { id: 'slogan', limit: 150 },
        { id: 'details', limit: 1000 }
            ];

    fieldsWithLimits.forEach(({ id, limit }) => {
        const field = document.getElementById(id);
        if (field) {
            const counter = document.createElement('div');
            counter.className = 'character-counter';
            counter.id = `${id}-counter`;
            
            field.parentNode.appendChild(counter);
            
            function updateCounter() {
                const remaining = limit - field.value.length;
                const current = field.value.length;
                counter.textContent = `${current}/${limit} characters`;
                
                // Update counter styling based on remaining characters
                counter.classList.remove('warning', 'danger');
                if (remaining < 20) {
                    counter.classList.add('danger');
                } else if (remaining < 50) {
                    counter.classList.add('warning');
                }
                
                // Prevent typing beyond limit
                if (current >= limit) {
                    field.value = field.value.substring(0, limit);
                    counter.textContent = `${limit}/${limit} characters (maximum reached)`;
                }
            }
            
            field.addEventListener('input', updateCounter);
            field.addEventListener('paste', () => setTimeout(updateCounter, 0));
            updateCounter();
        }
    });
}

// Keyboard Navigation
function handleKeyboardNavigation(e) {
    // Ctrl/Cmd + Arrow Keys for step navigation
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                nextStep();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevStep();
                break;
        }
    }
    
    // Ctrl/Cmd + S to submit form (prevent browser save)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentStep === totalSteps) {
            const form = document.getElementById('store-form');
            if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true }));
            }
        } else {
            nextStep();
        }
    }

    // Ctrl/Cmd + R to reset form
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        resetForm();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        const modal = document.getElementById('success-modal');
        if (modal && modal.classList.contains('show')) {
            closeSuccessModal();
        }
    }
    
    // Enter key behavior
    if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement;
        
        // Don't interfere with textarea
        if (activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        // If in a form input, go to next step or submit
        if (activeElement.matches('.form-input, .form-select')) {
            e.preventDefault();
            if (currentStep < totalSteps) {
                nextStep();
            } else {
                const form = document.getElementById('store-form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
            }
        }
    }
}

// URL Hash Management
function handleHashChange() {
    const hash = window.location.hash;
    if (hash.startsWith('#step-')) {
        const stepNumber = parseInt(hash.replace('#step-', ''));
        if (stepNumber >= 1 && stepNumber <= totalSteps) {
            goToStep(stepNumber, false);
        }
    }
}

window.addEventListener('hashchange', handleHashChange);

// Form Analytics (optional - for tracking user behavior)
function trackFormAnalytics(action, data = {}) {
    // You can integrate with Google Analytics, Mixpanel, etc.
    console.log('Form Analytics:', action, data);
    
    // Example: Track step completions, abandonment points, etc.
    const analyticsData = {
        action: action,
        step: currentStep,
        timestamp: new Date().toISOString(),
        ...data
    };
    
    // Send to your analytics service
    // analytics.track('store_form_' + action, analyticsData);
}

// Enhanced Error Handling
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('cloudinary')) {
        userMessage = 'Image upload failed. Please try uploading a different image.';
    } else if (error.message.includes('webhook')) {
        userMessage = 'Submission failed. Please try again or contact support.';
    }
    
    showError(userMessage);
    
    // Track errors for debugging
    trackFormAnalytics('error', {
        error_message: error.message,
        context: context,
        stack: error.stack
    });
}

// Form Completion Helpers
function getFormCompletionPercentage() {
    const requiredFields = [
        'store_name', 'store_slug', 'store_category',
        'contact_email', 'address'
    ];
    
    let completedFields = 0;
    let totalFields = requiredFields.length + 2; // +2 for images
    
    // Check text fields
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && field.value.trim()) {
            completedFields++;
        }
    });
    
    // Check images
    if (uploadedFiles.banner) completedFields++;
    if (uploadedFiles.logo) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
}

function showFormCompletionStatus() {
    const percentage = getFormCompletionPercentage();
    const message = `Form is ${percentage}% complete`;
    
    if (percentage < 50) {
        showInfo(message);
    } else if (percentage < 100) {
        showWarning(message + '. Please complete all required fields.');
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function generateUniqueId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Enhanced Auto-save with better UX
const debouncedAutoSave = debounce(autoSave, 2000);

function setupAutoSave() {
    const form = document.getElementById('store-form');
    if (form) {
        // Auto-save on form changes
        form.addEventListener('input', debouncedAutoSave);
        form.addEventListener('change', debouncedAutoSave);
        
        // Auto-save when switching steps
        const originalNextStep = nextStep;
        const originalPrevStep = prevStep;
        
        window.nextStep = function() {
            debouncedAutoSave();
            originalNextStep();
            trackFormAnalytics('step_forward', { from_step: currentStep - 1, to_step: currentStep });
        };
        
        window.prevStep = function() {
            debouncedAutoSave();
            originalPrevStep();
            trackFormAnalytics('step_backward', { from_step: currentStep + 1, to_step: currentStep });
        };
    }
}

// Initialize enhanced features
function initializeEnhancedFeatures() {
    // Load draft after initialization
    setTimeout(loadDraft, 500);
    
    // Handle URL hash on load
    handleHashChange();
    
    // Show form completion status periodically
    setInterval(showFormCompletionStatus, 30000); // Every 30 seconds
    
    // Track form start
    trackFormAnalytics('form_started');
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            debouncedAutoSave();
            trackFormAnalytics('page_hidden');
        } else {
            trackFormAnalytics('page_visible');
        }
    });
    
    // Track form abandonment
    window.addEventListener('beforeunload', function(e) {
        const completion = getFormCompletionPercentage();
        if (completion > 0 && completion < 100) {
            debouncedAutoSave();
            trackFormAnalytics('form_abandoned', { completion_percentage: completion });
            
            // Optional: Show warning for unsaved changes
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
}

// Make functions globally available
window.nextStep = nextStep;
window.prevStep = prevStep;
window.goToStep = goToStep;
window.removeFile = removeFile;
window.resetForm = resetForm;
window.closeSuccessModal = closeSuccessModal;
window.createAnotherStore = createAnotherStore;

// Export for testing/debugging
if (typeof window !== 'undefined') {
    window.ClassimaDashboard = {
        currentStep,
        totalSteps,
        uploadedFiles,
        collectFormData,
        validateAllSteps,
        resetForm,
        loadDraft,
        clearDraft,
        uploadToCloudinary,
        sendToWebhook,
        getFormCompletionPercentage,
        trackFormAnalytics
    };
}

// Enhanced initialization
function initializeDashboard() {
    setupEventListeners();
    initializeFormSteps();
    setupAutoSave();
    setupCharacterCounters();
    initializeEnhancedFeatures();
    
    console.log('Multi-step Clasima Dashboard initialized successfully');
    
    // Show welcome message
    setTimeout(() => {
        showInfo('Welcome! Use Ctrl+→/← to navigate between steps, or click the step indicators above.');
    }, 1000);
}

// Final error handling wrapper
window.addEventListener('error', function(e) {
    handleError(e.error, 'global_error_handler');
});

window.addEventListener('unhandledrejection', function(e) {
    handleError(e.reason, 'unhandled_promise_rejection');
    e.preventDefault(); // Prevent the default browser error handling
});

console.log('Clasima Multi-Step Dashboard JavaScript loaded successfully');