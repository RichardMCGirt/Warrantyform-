document.addEventListener('DOMContentLoaded', async function () {
    const airtableApiKey = window.env.AIRTABLE_API_KEY;
    const airtableBaseId = window.env.AIRTABLE_BASE_ID;
    const airtableTableName = window.env.AIRTABLE_TABLE_NAME;
    const billableOptions = ['Billable', 'Non Billable'];
    const reasonOptions = ['Another Trade Damaged Work', 'Homeowner Damage', 'Weather'];
    const homeownerbuilderOptions =['Homeowner','Builder', 'Subcontractor ']


    
    let dropboxAccessToken;
    let dropboxAppKey;
    let dropboxAppSecret;
    let dropboxRefreshToken;

    const calendarLinks = await fetchCalendarLinks();
    let isSubmitting = false;

    let confirmationShown = false; 

// Run fetch functions concurrently
Promise.all([
    fetchAirtableFields(),
    fetchDropboxCredentials(),
    checkDropboxTokenValidity()
]).then(() => {
    console.log("All fetch operations completed.");
}).catch(error => {
    console.error("An error occurred during one of the fetch operations:", error);
});

        // Function to check if Dropbox token is still valid
        async function checkDropboxTokenValidity() {      
            if (!dropboxAccessToken) {
                return;
            }
        
            const accountInfoUrl = 'https://api.dropboxapi.com/2/users/get_current_account';
        
            try {
                const response = await fetch(accountInfoUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${dropboxAccessToken.trim()}`,  // Ensure token is trimmed
                    }
                });
        
                let responseData;
                const contentType = response.headers.get('content-type');
        
                if (contentType && contentType.includes('application/json')) {
                    responseData = await response.json();  
                } else {
                    responseData = await response.text(); 
                }
        
                if (response.ok) {
                    console.log('Dropbox token is still valid.');
                } else if (response.status === 401) {
                    console.error('Dropbox token is expired or invalid.');
                    await refreshDropboxToken();  
                } else {
                    console.error(`Error while checking Dropbox token: ${response.status} ${response.statusText}`);
                    console.log('Response data:', responseData);  
                }
            } catch (error) {
                console.error('Error occurred while checking Dropbox token validity:', error);
            }
        }
                    
    const loadingLogo = document.querySelector('.loading-logo');
    const mainContent = document.getElementById('main-content');
    const secondaryContent = document.getElementById('secoundary-content');
    const toast = document.getElementById('toast');
    const headerTitle = document.querySelector('h1');
    const modal = document.getElementById("materials-modal");


    let updatedFields = {};
    let hasChanges = false;
    let activeRecordId = null;

    // Create the submit button dynamically and hide it initially
    const submitButton = document.createElement('button');
    submitButton.id = 'dynamic-submit-button';
    submitButton.textContent = 'Submit';
    submitButton.style.display = 'none';
    submitButton.style.position = 'fixed';
    submitButton.style.zIndex = '1000';
    submitButton.style.cursor = 'move';
    document.body.appendChild(submitButton);

    // Variables to track dragging
    let isDragging = false;
    let hasMoved = false; // Track if the button has been moved
    let dragStarted = false; // To track if dragging has started during this click
    let clickTimeout;
    let mouseDownTime = 0; // To track the time the mouse was held down
    
    // Mouse down event to start dragging or timing the hold duration
    submitButton.addEventListener('mousedown', function (event) {
        let shiftX = event.clientX - submitButton.getBoundingClientRect().left;
        let shiftY = event.clientY - submitButton.getBoundingClientRect().top;
        isDragging = true;
        hasMoved = false; // Reset move status when dragging starts
        dragStarted = true; // Set drag start status
        mouseDownTime = Date.now(); // Record the time when the mouse is pressed down
    
        function moveAt(pageX, pageY) {
            submitButton.style.left = pageX - shiftX + 'px';
            submitButton.style.top = pageY - shiftY + 'px';
            hasMoved = true; // Button has been moved
        }
    
        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }
    
        document.addEventListener('mousemove', onMouseMove);
    
        document.addEventListener('mouseup', function () {
            document.removeEventListener('mousemove', onMouseMove);
            isDragging = false; // Reset dragging state after mouse up
    
            const mouseUpTime = Date.now(); // Record the time when the mouse is released
            const heldDuration = mouseUpTime - mouseDownTime; // Calculate how long the mouse was held down
    
            if (heldDuration > 2000) {
                // If the mouse was held down for more than 2 seconds, prevent submission
                dragStarted = true;
                console.log('Submission prevented because the mouse was held down for more than 2 seconds.');
            }
    
            if (hasMoved) {
                // If the button has been moved, prevent any immediate submission
                dragStarted = true;
            }
    
            // Store the current position of the button in local storage
            localStorage.setItem('submitButtonTop', submitButton.style.top);
            localStorage.setItem('submitButtonLeft', submitButton.style.left);
    
            // Reset the drag status after a short delay
            clickTimeout = setTimeout(() => {
                dragStarted = false;
            }, 200); // Small delay to prevent click submission after dragging
    
        }, { once: true });
    });

    let originalValues = {};


    
    document.querySelectorAll('input[type="checkbox"], select, td[contenteditable="true"]').forEach(element => {
        // For checkboxes and dropdowns
        element.addEventListener('change', function () {
            const recordId = this.closest('tr').dataset.id;
            checkForChanges(recordId);  // Check for any changes
            if (hasChanges) {
                submitChanges();  // Submit immediately on change
            }
        });
    
        // For editable text cells, submit after each key stroke
        if (element.getAttribute('contenteditable') === 'true') {
            element.addEventListener('input', function () {
                const recordId = this.closest('tr').dataset.id;
                checkForChanges(recordId);  // Check for any changes
                if (hasChanges) {
                    submitChanges();  // Submit immediately after each key stroke
                }
            });
        }
    });
    
    
// Check if vibration API is supported
function vibrateDevice() {
    if (navigator.vibrate) {
        console.log("Vibration supported. Triggering vibration.");
        navigator.vibrate(200); // Vibrate for 200ms
    } else {
        console.log("Vibration not supported on this device.");
    }
}

// Event listener for dynamic submit button
submitButton.addEventListener('click', function () {
    submitChanges();
    
    // Trigger vibration on submit button click
    vibrateDevice();
});

// Event listener for the Enter key press
document.querySelectorAll('input, select, td[contenteditable="true"]').forEach(element => {
    element.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default Enter behavior
            submitChanges();
            
            // Trigger vibration on Enter key press
            vibrateDevice();
        }
    });
});

    // Event listener for dynamic submit button
    submitButton.addEventListener('click', function (event) {
        clearTimeout(clickTimeout); // Clear any pending timeout
    
        if (dragStarted || hasMoved) {
            // Prevent submission if the button was being dragged or held down too long
            event.preventDefault();
            hasMoved = false; // Reset movement tracking after preventing submission
            return;
        }
    
        // Only submit if no dragging occurred and the mouse wasn't held down for too long
        submitChanges();
    });

         
 // Function to show submit button if there are changes
 function showSubmitButton(recordId) {
    if (hasChanges) {
        const lastTop = localStorage.getItem('submitButtonTop') || '50%';
        const lastLeft = localStorage.getItem('submitButtonLeft') || '50%';
        submitButton.style.top = lastTop;
        submitButton.style.left = lastLeft;
        submitButton.style.display = 'block';
        activeRecordId = recordId;
    }
}

    
    // Event listeners to show the submit button when input is typed or value is changed
    document.querySelectorAll('input, select, td[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', () => showSubmitButton(activeRecordId));
        element.addEventListener('change', () => showSubmitButton(activeRecordId));
        element.addEventListener('keypress', () => showSubmitButton(activeRecordId)); // For detecting keystrokes
    });

    // Fetch Dropbox credentials from Airtable
    async function fetchDropboxCredentials() {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });


            if (!response.ok) {
                throw new Error(`Error fetching Dropbox credentials: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Reset Dropbox credentials before setting them
            dropboxAccessToken = undefined;
            dropboxAppKey = undefined;
            dropboxAppSecret = undefined;
            dropboxRefreshToken = undefined;

            for (const record of data.records) {
            
                if (record.fields) {
                    if (record.fields['Dropbox Token']) {
                        dropboxAccessToken = record.fields['Dropbox Token'];
                    }
                    if (record.fields['Dropbox App Key']) {
                        dropboxAppKey = record.fields['Dropbox App Key'];
                    }
                    if (record.fields['Dropbox App Secret']) {
                        dropboxAppSecret = record.fields['Dropbox App Secret'];
                    }
                    // Corrected lines below
                    if (record.fields['Dropbox Refresh Token']) {  // Correct this to match your field name
                        dropboxRefreshToken = record.fields['Dropbox Refresh Token'];  // Use the correct field name
                    }
                } else {
                    console.log('No fields found in this record:', record);
                }
            }      

            if (!dropboxAccessToken || !dropboxAppKey || !dropboxAppSecret || !dropboxRefreshToken) {
                console.error('One or more Dropbox credentials are missing after fetching.');
            } else {
            }
        } catch (error) {
            console.error('Error occurred during fetchDropboxCredentials:', error);
        }
    }

    async function fetchCalendarLinks() {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching calendar links: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
    
            // Ensure correct fields are mapped (e.g., 'name' and 'CalendarLink')
            return data.records.map(record => ({
                name: record.fields['name'],           // Airtable's display name
                link: record.fields['CalendarLink']    // Airtable's URL field
            }));
        } catch (error) {
            console.error('Error fetching calendar links from Airtable:', error);
            return [];
        }
    }
    
    async function refreshDropboxToken() {
        console.log('Attempting to refresh Dropbox token...');
        showToast('Refreshing Dropbox token...');  // Notify the user that the token is being refreshed
    
        if (!dropboxAppKey || !dropboxAppSecret || !dropboxRefreshToken) {
            console.error('Dropbox credentials are not available.');
            showToast('Dropbox credentials are missing. Token refresh failed.');
            return;
        }
    
        const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
    
        const headers = new Headers();
        headers.append('Authorization', 'Basic ' + btoa(`${dropboxAppKey}:${dropboxAppSecret}`));
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
    
        const body = new URLSearchParams();
        body.append('grant_type', 'refresh_token');
        body.append('refresh_token', dropboxRefreshToken);
    
        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: headers,
                body: body
            });
    
            if (!response.ok) {
                const errorResponse = await response.json();
                console.error(`Error refreshing Dropbox token: ${response.status} ${response.statusText}`, errorResponse);
                showToast('Error refreshing Dropbox token.');
                return;
            }
    
            const data = await response.json();
            dropboxAccessToken = data.access_token; // Update the access token with the new one
            console.log('Dropbox token refreshed successfully:', dropboxAccessToken);
            showToast('Dropbox token refreshed successfully.');
    
            // Update the new token in Airtable
            await updateDropboxTokenInAirtable(dropboxAccessToken);
        } catch (error) {
            console.error('Error refreshing Dropbox token:', error);
            showToast('Error refreshing Dropbox token.');
        }
    }
    

    async function fetchRecordsFromAirtable() {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching records: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
            
            // Log all fields for each record
            data.records.forEach(record => {
                console.log(`Record ID: ${record.id}`);
                console.log(record.fields); // Log all fields for the record
            });
    
            return data.records; // Return the records array
        } catch (error) {
            console.error('Error fetching records from Airtable:', error);
            return [];
        }
    }
    
    

    async function updateDropboxTokenInAirtable(token) {
        console.log('Updating Dropbox token in Airtable...');
        showToast('Updating Dropbox token in Airtable...');  // Notify the user that the token is being updated
    
        try {
            const allRecords = await fetchRecordsFromAirtable(); // Fetch all necessary records
            const updatePromises = allRecords.map(record => {
                const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
    
                return fetch(url, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${airtableApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        records: [
                            {
                                id: record.id, // Use the actual record ID
                                fields: {
                                    'Dropbox Token': token  // Update this field with the new token
                                }
                            }
                        ]
                    })
                });
            });
    
            const responses = await Promise.all(updatePromises);
            responses.forEach((response, index) => {
                if (!response.ok) {
                    console.error(`Error updating record ${allRecords[index].id}: ${response.status} ${response.statusText}`);
                } else {
                    console.log(`Record ${allRecords[index].id} updated successfully.`);
                }
            });
    
            showToast('Dropbox token updated in Airtable successfully.');
        } catch (error) {
            console.error('Error updating Dropbox token in Airtable:', error);
            showToast('Error updating Dropbox token in Airtable.');
        }
    }
    
   // Create file input dynamically
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.id = 'file-input';
fileInput.multiple = true;
fileInput.style.display = 'none';
document.body.appendChild(fileInput);


    fileInput.onchange = async (event) => {
        const files = event.target.files;
        const recordId = event.target.getAttribute('data-record-id');
        const targetField = event.target.getAttribute('data-target-field');

        if (files && files.length > 0 && recordId) {
            showToast('Uploading images...');
            disableAddPhotosButton(recordId, true);  // Disable button
            const filesArray = Array.from(files);
            await sendImagesToAirtableForRecord(filesArray, recordId, targetField);
            showToast('Images uploaded successfully!');
            disableAddPhotosButton(recordId, false); // Enable button
            showSubmitButton(recordId);
            fetchAllData();  // Refresh data after images are uploaded
        } else {
            console.error('No files selected or record ID is missing.');
        }
    };

    async function sendImagesToAirtableForRecord(files, recordId, targetField) {
        if (!Array.isArray(files)) files = [files];
    
        const uploadedUrls = [];
        console.log(`Starting upload process for record ID: ${recordId}, target field: ${targetField}.`);
    
        const currentImages = await fetchCurrentImagesFromAirtable(recordId, targetField);
        console.log(`Fetched current images from Airtable for record ID ${recordId}:`, currentImages);
    
        for (const file of files) {
            console.log(`Attempting to upload file "${file.name}" to Dropbox...`);
    
            try {
                let dropboxUrl = await uploadFileToDropbox(file);
    
                if (!dropboxUrl) {
                    console.warn(`Upload failed for "${file.name}". Dropbox token may be expired. Attempting token refresh...`);
                    await refreshDropboxToken();
    
                    console.log(`Retrying upload for file "${file.name}" after refreshing Dropbox token...`);
                    dropboxUrl = await uploadFileToDropbox(file);
                }
    
                if (dropboxUrl) {
                    const formattedLink = convertToDirectLink(dropboxUrl);
                    console.log(`Upload successful for "${file.name}". Formatted Dropbox URL: ${formattedLink}`);
                    uploadedUrls.push({ url: formattedLink });
    
                    // Detect file type
                    const fileExtension = file.name.split('.').pop().toLowerCase();
                    if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png' || fileExtension === 'gif') {
                        // If it's an image, display it in the UI
                        console.log(`Displaying image preview for: ${formattedLink}`);
                        document.getElementById('pdfPreview').src = formattedLink;
                    } else {
                        // Open other file types in a new tab
                        console.log(`Opening non-image file (${file.name}) in a new tab: ${formattedLink}`);
                        window.open(formattedLink, '_blank');
                    }
                } else {
                    console.error(`Upload failed for "${file.name}" even after refreshing the Dropbox token.`);
                }
            } catch (error) {
                console.error(`Error during file upload to Dropbox for file "${file.name}":`, error);
            }
        }
    
        const allImages = currentImages.concat(uploadedUrls);
    
        if (allImages.length > 0) {
            const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
            const body = JSON.stringify({ fields: { [targetField]: allImages } });
    
            try {
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${airtableApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: body
                });
    
                if (!response.ok) {
                    console.error(`Failed to update Airtable record.`);
                } else {
                    console.log('Successfully updated Airtable record.');
                }
            } catch (error) {
                console.error(`Error updating Airtable record:`, error);
            }
        }
    }
    
    

    async function fetchAirtableFields() {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?maxRecords=1`;
    
        console.log("Starting to fetch Airtable fields...");
        console.log("Request URL:", url);
    
        // Avoid logging sensitive information in production
        if (process.env.NODE_ENV === 'development') {
            console.log("API Key (Development only):", airtableApiKey);
        }
    
        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`,
                },
            });
    
            console.log("Response received. Status:", response.status);
    
            // Check if the response was successful
            if (!response.ok) {
                const errorDetails = await response.text();
                throw new Error(`Failed to fetch fields. Status: ${response.status}, Status Text: ${response.statusText}, Details: ${errorDetails}`);
            }
    
            const data = await response.json();
    
            // Check if records exist and log the fields
            const fields = data.records?.[0]?.fields;
            if (fields) {
                console.log("Fetched Fields Data:", fields);
            } else {
                console.warn("No fields found in the returned data.");
            }
    
            return fields || {}; // Return fields or an empty object if none found
        } catch (error) {
            console.error("Error occurred while fetching Airtable fields:", error);
            return {}; // Return an empty object in case of an error
        }
    }
    
    
    
    async function fetchCurrentImagesFromAirtable(recordId, targetField) {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });

            if (!response.ok) {
                console.error(`Error fetching record: ${response.status} ${response.statusText}`);
                return [];
            }

            const data = await response.json();
            return data.fields[targetField] ? data.fields[targetField] : [];
        } catch (error) {
            console.error('Error fetching current images from Airtable:', error);
            return [];
        }
    }

    async function uploadFileToDropbox(file) {
        console.log('Starting file upload to Dropbox...');
        
        if (!dropboxAccessToken) {
            console.error('Dropbox Access Token is not available.');
            return null;
        }
    
        const dropboxUploadUrl = 'https://content.dropboxapi.com/2/files/upload';
        const path = `/uploads/${encodeURIComponent(file.name)}`;
        console.log(`Uploading file to Dropbox: ${file.name} at path: ${path}`);
    
        try {
            const response = await fetch(dropboxUploadUrl, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${encodeURIComponent(dropboxAccessToken)}`, // Encode the token
                    "Dropbox-API-Arg": JSON.stringify({
                        path: path, // Encode file name to prevent errors
                        mode: 'add',
                        autorename: true,
                        mute: false
                    }),
                    "Content-Type": "application/octet-stream"
                },
                body: file
            });
    
            console.log(`Dropbox file upload response status: ${response.status}`);
    
            if (!response.ok) {
                const errorResponse = await response.json();
                console.error('Error uploading file to Dropbox:', errorResponse);
    
                if (errorResponse.error && errorResponse.error['.tag'] === 'expired_access_token') {
                    console.log('Access token expired. Attempting to refresh token...');
                    await refreshDropboxToken();
    
                    console.log('Retrying file upload after refreshing access token...');
                    return await uploadFileToDropbox(file);
                }
    
                return null;
            }
    
            const data = await response.json();
            console.log('File uploaded to Dropbox successfully:', data);
            console.log(`File path in Dropbox: ${data.path_lower}`);
    
            const sharedLink = await getDropboxSharedLink(data.path_lower);
            console.log(`Shared link for uploaded file: ${sharedLink}`);
            return sharedLink;
        } catch (error) {
            console.error('Error during file upload to Dropbox:', error);
            return null;
        }
    }
    
    async function getDropboxSharedLink(filePath) {
        if (!dropboxAccessToken) {
            console.error('Dropbox Access Token is not available.');
            return null;
        }
    
        const dropboxCreateSharedLinkUrl = 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings';
    
        try {
            const response = await fetch(dropboxCreateSharedLinkUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${dropboxAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: filePath,
                    settings: {
                        requested_visibility: 'public'
                    }
                })
            });
    
            if (!response.ok) {
                if (response.status === 409) {
                    console.warn('Shared link already exists, fetching existing link...');
                    return await getExistingDropboxLink(filePath);
                } else {
                    console.error(`Error creating shared link: ${response.status} ${response.statusText}`);
                    return null;
                }
            }
    
            const data = await response.json();
            return convertToDirectLink(data.url);
        } catch (error) {
            console.error('Error creating Dropbox shared link:', error);
            return null;
        }
    }
    
    async function getExistingDropboxLink(filePath) {
        if (!dropboxAccessToken) {
            console.error('Dropbox Access Token is not available.');
            return null;
        }

        const dropboxGetSharedLinkUrl = 'https://api.dropboxapi.com/2/sharing/list_shared_links';

        try {
            const response = await fetch(dropboxGetSharedLinkUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${dropboxAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: filePath,
                    direct_only: true
                })
            });

            if (!response.ok) {
                console.error(`Error fetching existing shared link: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            if (data.links && data.links.length > 0) {
                return convertToDirectLink(data.links[0].url);
            } else {
                console.error('No existing shared link found.');
                return null;
            }
        } catch (error) {
            console.error('Error fetching Dropbox existing shared link:', error);
            return null;
        }
    }

    function convertToDirectLink(sharedUrl) {
        if (sharedUrl.includes("dropbox.com")) {
            return sharedUrl.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("?dl=0", "?raw=1");
        }
        return sharedUrl;
    }
    
    

    async function fetchData(offset = null) {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?${offset ? `offset=${offset}` : ''}`;
    
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
    
            if (!response.ok) {
                return { records: [] }; // Return an empty array on error
            }
    
            return await response.json();
        } catch (error) {
            console.error('Error fetching data from Airtable:', error);
            return { records: [] }; // Return an empty array if an error occurs
        }
    }
    
    function adjustTableWidth() {
        const mainContent = document.querySelector('#airtable-data tbody');
        const secondaryContent = document.querySelector('#feild-data tbody');
    
        const hasPrimaryRecords = mainContent && mainContent.children.length > 0;
        const hasSecondaryRecords = secondaryContent && secondaryContent.children.length > 0;
    
        if (hasPrimaryRecords && !hasSecondaryRecords) {
            document.body.classList.add('single-table-view');
            makeTableScrollable('#airtable-data');
        } else if (!hasPrimaryRecords && hasSecondaryRecords) {
            document.body.classList.add('single-table-view');
            makeTableScrollable('#feild-data');
        } else {
            document.body.classList.remove('single-table-view');
            if (mainContent) resetTableScroll('#airtable-data');
            if (secondaryContent) resetTableScroll('#feild-data');
        }
    }
    
    
    // Adjust the table height to fill the available space dynamically
    function makeTableScrollable(tableSelector) {
        const table = document.querySelector(tableSelector);
    
        if (!table || !table.parentElement) {
            console.warn(`Table or parent element not found for selector: ${tableSelector}`);
            return;
        }
    
        const nav = document.querySelector('nav');
        const header = document.querySelector('.header');
        const searchContainer = document.querySelector('.search-container');
    
        const headerHeight = 
            (nav ? nav.offsetHeight : 0) +
            (header ? header.offsetHeight : 0) +
            (searchContainer ? searchContainer.offsetHeight : 0) +
            50; // Add some padding
    
        table.parentElement.style.maxHeight = `calc(100vh - ${headerHeight}px)`;
        table.parentElement.style.overflowY = 'auto';
    }
    
    
    
    // Reset scrollability for tables when both are visible
    function resetTableScroll(tableSelector) {
        const table = document.querySelector(tableSelector);
        if (table) {
            table.parentElement.style.maxHeight = '';
            table.parentElement.style.overflowY = '';
        }
    }
    
    // Call `adjustTableWidth` after data is loaded or when the table visibility changes
    fetchAllData().then(adjustTableWidth);
    
    function syncTableWidths() {
        const mainTable = document.querySelector('#airtable-data');
        const secondaryTable = document.querySelector('#feild-data');
    
        // Check if either table has rows (records)
        const mainTableHasRecords = mainTable && mainTable.querySelector('tbody tr') !== null;
        const secondaryTableHasRecords = secondaryTable && secondaryTable.querySelector('tbody tr') !== null;
    
        // If only one table has records, set its width to 80%
        if (mainTableHasRecords && !secondaryTableHasRecords) {
            mainTable.style.width = '80%';
            secondaryTable.style.width = '0'; // Hide or reduce the other table
        } else if (secondaryTableHasRecords && !mainTableHasRecords) {
            secondaryTable.style.width = '80%';
            mainTable.style.width = '0'; // Hide or reduce the other table
        } else if (mainTableHasRecords && secondaryTableHasRecords) {
            // If both have records, synchronize their widths
            const mainTableWidth = mainTable.offsetWidth;
            secondaryTable.style.width = `${mainTableWidth}px`;
        }
    }
    
    
    let vendorOptions = []; // Declare vendorOptions properly

    let subOptions = []; // Declare subOptions globally

    async function fetchAllData() {
        mainContent.style.display = 'none';
        secondaryContent.style.display = 'none';
    
        originalValues = { /* Populate this with fetched data */ };
    
        let loadProgress = 0;
        const loadInterval = setInterval(() => {
            loadProgress += (100 - loadProgress) * 0.1;
            const roundedProgress = Math.round(loadProgress);
    
            loadingLogo.style.maskImage = `linear-gradient(to right, black ${roundedProgress}%, transparent ${roundedProgress}%)`;
            loadingLogo.style.webkitMaskImage = `linear-gradient(to right, black ${roundedProgress}%, transparent ${roundedProgress}%)`;
    
            if (roundedProgress >= 99) {
                clearInterval(loadInterval);
                loadingLogo.classList.add('full-color');
            }
        }, 50);
    
        try {
            let allRecords = [];
            let offset = null;
    
            
            // Fetch sub options
            try {
                subOptions = await fetchAirtableSubOptionsFromDifferentTable() || [];
            } catch (error) {
                console.error('Error fetching sub options:', error);
                subOptions = []; // Continue with an empty subOptions array
            }
    
            // Fetch all records and store original values
            do {
                const data = await fetchData(offset);
    
                // Ensure data.records exists and is an array
                if (data && Array.isArray(data.records)) {
                    allRecords = allRecords.concat(data.records);
    
                    // Store original values for each record
                    data.records.forEach(record => {
                        originalValues[record.id] = { ...record.fields };
                    });
                } else {
                    console.error('Error: Invalid data structure or no records found.');
                    break; // Exit loop if no valid data is fetched
                }
                offset = data.offset;
            } while (offset);
    
            // Filter and sort records for primary and secondary views
            const primaryRecords = allRecords.filter(record =>
                record.fields['Status'] === 'Field Tech Review Needed' &&
                !record.fields['Field Tech Reviewed'] // Checks if the checkbox is not checked
            );
    
            const secondaryRecords = allRecords.filter(record =>
                record.fields['Status'] === 'Scheduled- Awaiting Field'  // Ensures 'Job Completed' is unchecked
            );
    
            // Sort primary records by StartDate and Vanir Branch
            primaryRecords.sort((a, b) => {
                const dateA = new Date(a.fields['StartDate']);
                const dateB = new Date(b.fields['StartDate']);
    
                if (dateA < dateB) return -1;
                if (dateA > dateB) return 1;
                return (a.fields['b'] || '').localeCompare(b.fields['b'] || '');
            });
    
            // Display the primary and secondary records in your tables with vendor options
            await displayData(primaryRecords, '#airtable-data', false, vendorOptions);
            await displayData(secondaryRecords, '#feild-data', true, subOptions);
    
            // Reveal content after loading
            mainContent.style.display = 'block';
            secondaryContent.style.display = 'block';
            headerTitle.classList.add('visible');
            setTimeout(() => {
                mainContent.style.opacity = '1';
                secondaryContent.style.opacity = '1';
            }, 10);
    
            // Adjust table width if only one table has records
            adjustTableWidth();
            syncTableWidths();
    
        } catch (error) {
            console.error('Error fetching all data:', error);
    
            // Fallback to ensure that the page still loads even if fetching data fails
            mainContent.style.display = 'block';
            secondaryContent.style.display = 'block';
            headerTitle.classList.add('visible');
            setTimeout(() => {
                mainContent.style.opacity = '1';
                secondaryContent.style.opacity = '1';
            }, 10);
    
            // Adjust table width if only one table has records
            adjustTableWidth();
            syncTableWidths();
        }
    }
    
    function checkForChanges(recordId) {
        console.log(`Checking for changes in record ID: ${recordId}`);
        const currentValues = updatedFields[recordId] || {};
        console.log("Current values:", currentValues);
    
        const fieldsHaveChanged = Object.keys(currentValues).some(field => {
            const currentValue = currentValues[field];
            const originalValue = originalValues[recordId] ? originalValues[recordId][field] : undefined;
            console.log(`Comparing field "${field}": current value = ${currentValue}, original value = ${originalValue}`);
            return currentValue !== originalValue;
        });
    
        hasChanges = fieldsHaveChanged;
        console.log(`Changes detected: ${hasChanges}`);
    
        if (hasChanges) {
            console.log(`Showing submit button for record ID: ${recordId}`);
            showSubmitButton(recordId);
        } else {
            console.log(`Hiding submit button for record ID: ${recordId}`);
            hideSubmitButton();
        }
    }

    // Function to hide the logo after 2 minutes
function hideLogoAfterDelay() {
    const logo = document.querySelector('.logo.loading-logo');
    if (logo) {
        setTimeout(() => {
            logo.style.display = 'none';
        }, 120000); // 120,000 milliseconds = 2 minutes
    }
}

// Call the function when the page loads
window.onload = hideLogoAfterDelay;

    
    function handleInputChange(event) {
        const recordId = this.closest('tr').dataset.id;
        const field = this.dataset.field;
        console.log(`Handling input change for record ID: ${recordId}, field: ${field}`);
    
        updatedFields[recordId] = updatedFields[recordId] || {};
        updatedFields[recordId][field] = this.value || this.textContent;
        console.log(`Updated fields for record ID ${recordId}:`, updatedFields[recordId]);
    
        checkForChanges(recordId);
    }
    
    document.querySelectorAll('input:not([type="radio"]), select, td[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', function () {
            const closestRow = this.closest('tr');
            if (!closestRow) {
                console.error("No valid parent <tr> found for element:", this);
                return;
            }
    
            const recordId = closestRow.dataset.id;
            console.log(`Input event detected for record ID: ${recordId}`);
            handleInputChange.call(this);
            checkForChanges(recordId);
        });
    
    
    
        element.addEventListener('change', function () {
            const recordId = this.closest('tr').dataset.id;
            console.log(`Change event detected for record ID: ${recordId}`);
            handleInputChange.call(this);
            checkForChanges(recordId);
        });
    
        element.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const recordId = element.closest('tr').dataset.id;
                console.log(`Enter key pressed for record ID: ${recordId}`);
                handleInputChange.call(element, event);
                checkForChanges(recordId);
                if (hasChanges) {
                    console.log(`Submitting changes for record ID: ${recordId}`);
                    submitChanges();
                }
            }
        });
    });
    
    // Resize observer to adjust the secondary table width when the main table resizes
    const mainTable = document.querySelector('#airtable-data');
    const resizeObserver = new ResizeObserver(() => {
        syncTableWidths();
    });

    if (mainTable) {
        resizeObserver.observe(mainTable); // Observe the main table for any size changes
    }

    // Fetch data and call syncTableWidths after DOM content is ready
    fetchAllData();

    async function fetchAirtableFields() {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?maxRecords=1`;
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
    
            const data = await response.json();
        } catch (error) {
            console.error('Error fetching fields from Airtable:', error);
        }
    }


    async function fetchDataAndInitializeFilter() {
        await fetchAllData(); // Ensure this function populates the tables
        console.log("Data loaded from Airtable.");
    
        const dropdown = document.querySelector('#filter-dropdown');
        if (dropdown) {
            console.log("Dropdown found. Adding change event listener.");
            dropdown.addEventListener('change', filterRecords); // Attach filter logic
        } else {
            console.error("Dropdown with ID #filter-dropdown not found.");
        }
    }
    
    // Call this function after DOMContentLoaded
    document.addEventListener('DOMContentLoaded', fetchDataAndInitializeFilter);
    

// Function to filter table rows based on selected branch
function filterRecords() {
    const dropdown = document.querySelector('#filter-dropdown');
    if (!dropdown) {
        console.error("Dropdown element not found");
        return;
    }

    const selectedBranch = dropdown.value;
    console.log(`Selected branch: "${selectedBranch}"`);

    const tables = ['#airtable-data', '#feild-data'];

    tables.forEach(tableSelector => {
        console.log(`Filtering table: ${tableSelector}`);
        const rows = document.querySelectorAll(`${tableSelector} tbody tr`);

        if (rows.length === 0) {
            console.warn(`No rows found in table: ${tableSelector}`);
            return;
        }

        rows.forEach((row, index) => {
            const branchCell = row.querySelector('td:first-child');
            if (branchCell) {
                const branch = branchCell.textContent.trim();
                console.log(`Row ${index + 1}: Branch = "${branch}"`);
                if (selectedBranch === '' || branch === selectedBranch) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            } else {
                console.warn(`Row ${index + 1}: Branch cell not found.`);
            }
        });
    });
}


// Attach event listener to dropdown
document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.querySelector('#filter-dropdown');
    if (dropdown) {
        console.log("Dropdown found. Adding change event listener."); // Debug log
        dropdown.addEventListener('change', filterRecords); // Filter on dropdown change
    } else {
        console.error("Dropdown with ID #filter-dropdown not found.");
    }
});
  
    async function fetchAirtableSubOptionsFromDifferentTable() {
        let records = [];
        let offset = null;
        const url = `https://api.airtable.com/v0/${window.env.AIRTABLE_BASE_ID}/${window.env.AIRTABLE_TABLE_NAME2}`;
        
        do {
            const response = await fetch(`${url}?fields[]=Subcontractor%20Company%20Name&fields[]=Vanir%20Branch${offset ? `&offset=${offset}` : ''}`, {
                headers: {
                    Authorization: `Bearer ${window.env.AIRTABLE_API_KEY}`
                }
            });
    
            if (!response.ok) {
                break;
            }
    
            const data = await response.json();
            records = records.concat(data.records);  
            offset = data.offset;  
        } while (offset);
    
        const subOptions = Array.from(new Set(records.map(record => {
    
            return {
                name: record.fields['Subcontractor Company Name'] || 'Unnamed Subcontractor',
                vanirOffice: record.fields['Vanir Branch'] || 'Unknown Branch'            };
        }).filter(Boolean)));
        
        return subOptions;  
    }

    async function displayData(records, tableSelector, isSecondary = false) {
        const tableElement = document.querySelector(tableSelector); // Select the entire table
        const tableContainer = tableElement.closest('.scrollable-div'); // Find the table's container
        const tbody = tableElement.querySelector('tbody'); // Select the table body
        const thead = tableElement.querySelector('thead'); // Select the table header
        const h2Element = tableContainer.previousElementSibling; // Select the corresponding h2
    
        // Clear the table body
        tbody.innerHTML = '';
    
        // Hide the entire table, header, and h2 if there are no records
        if (records.length === 0) {
            h2Element.style.display = 'none';            // Hide the h2
            tableElement.style.display = 'none';         // Hide the table
            thead.style.display = 'none';                // Hide the header
            return;
        } else {
            h2Element.style.display = 'block';           // Show the h2 if records are present
            tableElement.style.display = 'table';        // Show the table
            thead.style.display = 'table-header-group';  // Show the header
            tableContainer.style.width = '100%';         // Ensure table auto-adjusts to content width
        }

         // Sort records alphabetically by field 'b'
    records.sort((a, b) => {
        const valueA = a.fields['b'] ? a.fields['b'].toLowerCase() : '';
        const valueB = b.fields['b'] ? b.fields['b'].toLowerCase() : '';
        return valueA.localeCompare(valueB);
    });
        
        // Populate rows based on the provided configuration
        records.forEach(record => {
            const fields = record.fields;
            const row = document.createElement('tr');
            const matchingCalendar = calendarLinks.find(calendar => calendar.name === fields['name']);
            const url = matchingCalendar ? matchingCalendar.link : '#';
         

            const cell = document.createElement('td');
            cell.innerHTML = `<a href="${url}" target="_blank">${fields['b'] || 'N/A'}</a>`;
            row.appendChild(cell);
    
            const fieldConfigs = isSecondary ? [
                { field: 'b', value: fields['b'] || 'N/A', link: true },
                { field: 'Lot Number and Community/Neighborhood', value: fields['Lot Number and Community/Neighborhood'] || 'N/A' },
                { field: 'Homeowner Name', value: fields['Homeowner Name'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A', directions: true },
                { field: 'Description of Issue', value: fields['Description of Issue'] ? fields['Description of Issue'].replace(/<\/?[^>]+(>|$)/g, "") : '' },       
                { field: 'Contact Email', value: fields['Contact Email'] || 'N/A', email: true },
                { field: 'Completed  Pictures', value: fields['Completed  Pictures'] || [], image: true, imageField: 'Completed  Pictures' },
                { field: 'DOW to be Completed', value: fields['DOW to be Completed'] || '', editable: true },

                { field: 'Job Completed', value: fields['Job Completed'] || false, checkbox: true }
            ] : [
                { field: 'b', value: fields['b'] || 'N/A', link: true },  // Keep only this "Branch" entry
                { field: 'field tech', value: fields['field tech'] || '', editable: false },
                { field: 'Lot Number and Community/Neighborhood', value: fields['Lot Number and Community/Neighborhood'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A', directions: true },
                { field: 'Homeowner Name', value: fields['Homeowner Name'] || 'N/A' },
                { field: 'Contact Email', value: fields['Contact Email'] || 'N/A', email: true },
                { field: 'Description of Issue', value: fields['Description of Issue'] ? fields['Description of Issue'].replace(/<\/?[^>]+(>|$)/g, "") : '' },

                {
                    field: 'Picture(s) of Issue',
                    value: fields['Picture(s) of Issue'] || [],
                    image: true,
                    link: true,
                    imageField: 'Picture(s) of Issue'
                },
                                { field: 'DOW to be Completed', value: fields['DOW to be Completed'] || '', editable: true },
                { field: 'Materials Needed', value: fields['Materials Needed'] || '', editable: true },
                { field: 'Subcontractor', value: fields['Subcontractor'] || '', dropdown: true, options: subOptions },
                {
                    field: 'Subcontractor Payment',
                    value: typeof fields['Subcontractor Payment'] === 'number'
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fields['Subcontractor Payment'])
                        : '', // Default to $0.00 if not a valid number
                    editable: true
                },
                { field: 'Subcontractor Not Needed', value: fields['Subcontractor Not Needed'] || false, checkbox: true },

                { field: 'Subcontractor Not Needed', value: fields['Subcontractor Not Needed'] || false, checkbox: true },
                { 
                    field: 'Billable/ Non Billable', 
                    value: fields['Billable/ Non Billable'] || '', 
                    dropdown: true, 
                  },

                  { 
                    field: 'Homeowner Builder pay', 
                    value: fields['Homeowner Builder pay'] || '', 
                    dropdown: true, 
                  },
                  { 
                    field: 'Billable Reason (If Billable)', 
                    value: fields['Billable Reason (If Billable)'] || '', 
                    dropdown: true 
                  },

                               { field: 'Field Tech Reviewed', value: fields['Field Tech Reviewed'] || false, checkbox: true }
            ];


            fieldConfigs.forEach(config => {
                const { field, value, checkbox, editable, link, image, dropdown, options, email, directions, imageField } = config;
                const cell = document.createElement('td');
                cell.dataset.id = record.id;
                cell.dataset.field = field;
                cell.style.wordWrap = 'break-word';
                cell.style.maxWidth = '200px';
                cell.style.position = 'relative';
            
                if (dropdown || field === 'sub') {
                    const select = document.createElement('select');
                    select.classList.add('styled-select');
                    
                    // Define placeholder and options dynamically
                    let placeholderText = '';
                    let filteredOptions = [];
                    
                    // Customize dropdown content based on the field
                    switch (field) {
                        case 'Subcontractor':
                            placeholderText = 'Select a Subcontractor ...';
                            filteredOptions = subOptions.filter(option => option.vanirOffice === (fields['b'] || 'N/A'));
                            break;
                        case 'Billable/ Non Billable':
                            placeholderText = 'Select Billable Status ...';
                            filteredOptions = billableOptions; // Static list of billable statuses
                            break;
                       
                            case 'Homeowner Builder pay':
                                placeholderText = 'Select a Reason ...';
                                filteredOptions = homeownerbuilderOptions; // Static list of billable reasons
                                break;
                                case 'Billable Reason (If Billable)':
                                    placeholderText = 'Select an option ...';
                                    filteredOptions = reasonOptions; // Static list of billable reasons
                                    break;
                       
                        default:
                            placeholderText = 'Select an Option ...';
                            break;
                    }
                
if (field === 'Subcontractor') {
    placeholderText = 'Select a Subcontractor ...';
} else if (field === 'Billable/ Non Billable') {
    placeholderText = 'Select Billable Status ...';
} else if (field === 'Homeowner Builder pay') {
    placeholderText = 'Select an option ...';
} else if (field === 'Material Vendor') {
    placeholderText = 'Select a Vendor ...';
} else if (field === 'Material Vendor') {
    placeholderText = 'Select a Vendor ...';{
    }
}

const placeholderOption = document.createElement('option');
placeholderOption.value = '';
placeholderOption.textContent = placeholderText;
select.appendChild(placeholderOption);

// Sort and populate options
filteredOptions.sort((a, b) => {
    const nameA = a.name ? a.name.toLowerCase() : a.toLowerCase();
    const nameB = b.name ? b.name.toLowerCase() : b.toLowerCase();
    return nameA.localeCompare(nameB);
});

filteredOptions.forEach(option => {
    const optionElement = document.createElement('option');
    const optionValue = typeof option === 'object' ? option.name : option;
    const displayText = typeof option === 'object' && option.displayName ? option.displayName : optionValue;
    
    optionElement.value = optionValue;
    optionElement.textContent = displayText;
    
    // Mark as selected if it matches the field's value
    if (optionValue === value || optionValue === fields[field]) {
        optionElement.selected = true;
    }
    
    // Optional: Disable certain options
    if (option.disabled) {
        optionElement.disabled = true;
    }

    select.appendChild(optionElement);
});

// Append the dropdown to the cell
cell.appendChild(select);

select.addEventListener('change', () => {
    const newValue = select.value;
    updatedFields[record.id] = updatedFields[record.id] || {};
    updatedFields[record.id][field] = newValue; // Update the correct field
    
    // Log the details of the dropdown change
    console.log(`Dropdown changed. Record ID: ${record.id}, Field: ${field}, New Value: ${newValue}`);
    
    hasChanges = true;
    showSubmitButton(record.id); // Show the submit button for this record

    // Enable or disable the checkbox based on selection
    const fieldReviewCheckbox = row.querySelector('input[type="checkbox"]');
    if (fieldReviewCheckbox) {
        if (newValue === "") {
            // If no valid value is selected
            fieldReviewCheckbox.disabled = false; // Enable the checkbox
        } else {
            // If a valid value is selected
            fieldReviewCheckbox.disabled = true; // Disable the checkbox
            fieldReviewCheckbox.checked = false; // Ensure the checkbox is not checked
        }
    }
});
                    const fieldReviewCheckbox = row.querySelector('input[type="checkbox"]');
                if (fieldReviewCheckbox && value === "") {
                    fieldReviewCheckbox.disabled = true;
                    fieldReviewCheckbox.checked = false;
                }

                cell.appendChild(select);
            }
            else if (image) {
                const files = Array.isArray(fields[field]) ? fields[field] : [];
                const carouselDiv = document.createElement('div');
                carouselDiv.classList.add('image-carousel');
            
                if (files.length > 0) {
                    let currentIndex = 0;
                    const imgElement = document.createElement('img');
                    imgElement.style.maxWidth = '100%';
                    imgElement.style.maxHeight = '150px';
                    imgElement.style.height = 'auto';
                    imgElement.classList.add('carousel-image');
            
                    const imageCount = document.createElement('div');
                    imageCount.classList.add('image-count');
            
                    function updateCarousel(index) {
                        const file = files[index];
                        const fileName = file.filename || 'File';
                        const fileUrl = file.url;
                        const fileExtension = fileName.split('.').pop().toLowerCase();
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
                        const isPdf = fileExtension === 'pdf';
                    
                        // Clear previous content
                        carouselDiv.innerHTML = '';
                    
                        // Create a container to hold the content
                        const contentContainer = document.createElement('div');
                        contentContainer.style.textAlign = 'center';
                    
                        if (isImage) {
                            // Create image element
                            const imgElement = document.createElement('img');
                            imgElement.src = fileUrl;
                            imgElement.alt = fileName;
                            imgElement.style.maxWidth = '100%';
                            imgElement.style.maxHeight = '150px';
                            imgElement.style.height = 'auto';
                            imgElement.classList.add('carousel-image');
                            imgElement.onclick = () => openImageViewer(files, index);
                    
                            contentContainer.appendChild(imgElement);
                        } else if (isPdf) {
                            // Create PDF embed
                            const pdfEmbed = document.createElement('embed');
                            pdfEmbed.src = fileUrl;
                            pdfEmbed.type = 'application/pdf';
                            pdfEmbed.width = '100%';
                            pdfEmbed.height = '150px';
                    
                            const pdfLink = document.createElement('a');
                            pdfLink.href = fileUrl;
                            pdfLink.target = '_blank';
                            pdfLink.textContent = `(${fileName})`;
                            pdfLink.style.display = 'block';
                            pdfLink.style.color = 'blue';
                            pdfLink.style.textDecoration = 'underline';
                    
                            contentContainer.appendChild(pdfEmbed);
                            contentContainer.appendChild(pdfLink);
                        } else {
                            // Create generic file download link
                            const fileLink = document.createElement('a');
                            fileLink.href = fileUrl;
                            fileLink.target = '_blank';
                            fileLink.textContent = `📎 Download ${fileName}`;
                            fileLink.style.display = 'block';
                            fileLink.style.color = 'blue';
                            fileLink.style.textDecoration = 'underline';
                    
                            contentContainer.appendChild(fileLink);
                        }
                    
                        carouselDiv.appendChild(contentContainer);
                    
                        // Show file count
                        const imageCount = document.createElement('div');
                        imageCount.classList.add('image-count');
                        imageCount.textContent = `${index + 1} of ${files.length}`;
                        carouselDiv.appendChild(imageCount);
                    
                        // Add navigation buttons only if multiple files exist
                        if (files.length > 1) {
                            const prevButton = document.createElement('button');
                            prevButton.textContent = '<';
                            prevButton.classList.add('carousel-nav-button', 'prev');
                            prevButton.onclick = () => {
                                currentIndex = (currentIndex > 0) ? currentIndex - 1 : files.length - 1;
                                updateCarousel(currentIndex);
                            };
                    
                            const nextButton = document.createElement('button');
                            nextButton.textContent = '>';
                            nextButton.classList.add('carousel-nav-button', 'next');
                            nextButton.onclick = () => {
                                currentIndex = (currentIndex < files.length - 1) ? currentIndex + 1 : 0;
                                updateCarousel(currentIndex);
                            };
                    
                            carouselDiv.appendChild(prevButton);
                            carouselDiv.appendChild(nextButton);
                        }
                    }
                    
                    // Initialize the first file
                    currentIndex = 0;
                    updateCarousel(currentIndex);
                    
            
                    // 🔴 DELETE BUTTON
                    const deleteButton = document.createElement('button');
                    deleteButton.innerHTML = '🗑️';
                    deleteButton.classList.add('delete-button');
                    deleteButton.onclick = async () => {
                        const confirmed = confirm('Are you sure you want to delete this file?');
                        if (confirmed) {
                            await deleteImageFromAirtable(record.id, files[currentIndex].id, imageField);
                            files.splice(currentIndex, 1);
                            if (files.length > 0) {
                                currentIndex = currentIndex % files.length;
                                updateCarousel(currentIndex);
                            } else {
                                carouselDiv.innerHTML = '';
                                const addPhotoButton = document.createElement('button');
                                addPhotoButton.textContent = 'Add Photos';
                                addPhotoButton.onclick = () => {
                                    fileInput.setAttribute('data-record-id', record.id);
                                    fileInput.setAttribute('data-target-field', imageField);
                                    fileInput.click();
                                };
                                carouselDiv.appendChild(addPhotoButton);
                            }
                        }
                    };
                    carouselDiv.appendChild(deleteButton);
                }
            
                // 🔵 "ADD PHOTO" BUTTON
                const addPhotoButton = document.createElement('button');
                addPhotoButton.textContent = 'Add Photos';
                addPhotoButton.onclick = () => {
                    fileInput.setAttribute('data-record-id', record.id);
                    fileInput.setAttribute('data-target-field', imageField);
                    fileInput.click();
                };
                carouselDiv.appendChild(addPhotoButton);
                cell.appendChild(carouselDiv);
            }
            
                
    else if (checkbox) {
    const checkboxElement = document.createElement('input');
    checkboxElement.type = 'checkbox';
    checkboxElement.checked = value;
    checkboxElement.classList.add('custom-checkbox');

    if (field === 'Job Completed') {
        const dropdownField = row.querySelector('select[data-field="sub"]'); 
        if (dropdownField && dropdownField.value === "") {
            checkboxElement.disabled = true; 
            checkboxElement.checked = false;
        }
    }
    if (field === 'Subcontractor Not Needed') {
        const subcontractorDropdown = row.querySelector('select[data-field="Subcontractor"]');
        if (subcontractorDropdown) {
            checkboxElement.disabled = false; // Ensure the checkbox is always enabled
        }  
    }
     

    checkboxElement.addEventListener('change', function () {
        const newValue = checkboxElement.checked;
        updatedFields[record.id] = updatedFields[record.id] || {};
        updatedFields[record.id][field] = newValue;
        hasChanges = true;
        showSubmitButton(record.id);
    });

    cell.appendChild(checkboxElement);
}
                else if (link) {
                    const matchingCalendar = calendarLinks.find(calendar => calendar.name === value);
    if (matchingCalendar) {
        cell.innerHTML = `<a href="${matchingCalendar.link}" target="_blank">${value}</a>`;
    } else {
        cell.textContent = value;
    }
                } else if (email) {
                    cell.innerHTML = value ? `<a href="mailto:${value}">${value}</a>` : 'N/A';
                } else if (directions) {
                    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(value)}`;
                    cell.innerHTML = value ? `<a href="${googleMapsUrl}" target="_blank">${value}</a>` : 'N/A';
                } else {
                    cell.textContent = value;
                }
    
                if (editable && !dropdown && !image) {
                    cell.setAttribute('contenteditable', 'true');
                    cell.classList.add('editable-cell');
                    const originalContent = cell.textContent;
    
                    cell.addEventListener('blur', () => {
                        const newValue = cell.textContent;
                        if (newValue !== originalContent) {
                            updatedFields[record.id] = updatedFields[record.id] || {};
                            updatedFields[record.id][field] = newValue;
                            hasChanges = true;
                            showSubmitButton(record.id);
                        }
                    });
                }
    
                row.appendChild(cell);
            });
    
            tbody.appendChild(row);
        });
    }
    
    document.querySelectorAll('td[data-field="DOW to be Completed"]').forEach(cell => {
        cell.addEventListener('input', function () {
            const recordId = this.closest('tr').dataset.id;
            handleInputChange.call(this);
            checkForChanges(recordId);
        });
        cell.addEventListener('blur', function () {
            const recordId = this.closest('tr').dataset.id;
            handleInputChange.call(this);
            checkForChanges(recordId);
        });
    });

    document.querySelectorAll('td[data-field="DOW to be Completed"]').forEach(cell => {
        cell.addEventListener('input', function () {
            const recordId = this.closest('tr').dataset.id;
            handleInputChange.call(this);
            checkForChanges(recordId);
        });
        cell.addEventListener('blur', function () {
            const recordId = this.closest('tr').dataset.id;
            handleInputChange.call(this);
            checkForChanges(recordId);
        });
    });

    

    function createImageElement(url, fileName) {
        const fileExtension = fileName.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
    
        const imgElement = document.createElement('img');
        imgElement.src = url;
        imgElement.alt = fileName;
        imgElement.style.maxWidth = '100%';
        imgElement.style.maxHeight = '150px';
        imgElement.style.height = 'auto';
        imgElement.classList.add('carousel-image');
    
        if (!isImage) {
            // If the file is NOT an image, make it clickable to open in a new tab
            const fileLink = document.createElement('a');
            fileLink.href = url;
            fileLink.target = '_blank';
            fileLink.textContent = fileName;
            fileLink.style.display = 'block';
    
            return fileLink; // Return the link element for non-image files
        }
    
        return imgElement; // Return the image element for images
    }
    
    

    async function deleteImageFromAirtable(recordId, imageId, imageField) {
        const url = `https://api.airtable.com/v0/${window.env.AIRTABLE_BASE_ID}/${window.env.AIRTABLE_TABLE_NAME}/${recordId}`;
        const currentImages = await fetchCurrentImagesFromAirtable(recordId, imageField);
        const updatedImages = currentImages.filter(image => image.id !== imageId);
    
        const body = JSON.stringify({ fields: { [imageField]: updatedImages.length > 0 ? updatedImages : [] } });
        const imageElement = document.querySelector(`img[src="${currentImages.find(img => img.id === imageId)?.url}"]`);
        const trashCan = document.querySelector('.trash-can');
    
        if (!imageElement || !trashCan) {
            return;
        }
    
        // Define the white smoke "poof" effect
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes poofToWhiteSmoke {
                0% {
                    opacity: 1;
                    transform: scale(1) rotate(0deg);
                    filter: blur(0);
                }
                25% {
                    opacity: 0.8;
                    transform: scale(1.2) rotate(10deg);
                    filter: blur(2px);
                    background-color: rgba(255, 255, 255, 0.3);
                }
                50% {
                    opacity: 0.5;
                    transform: scale(1.5) rotate(20deg);
                    filter: blur(5px);
                    background-color: rgba(255, 255, 255, 0.6);
                }
                75% {
                    opacity: 0.3;
                    transform: scale(1.8) rotate(-15deg);
                    filter: blur(10px);
                    background-color: rgba(255, 255, 255, 0.8);
                }
                100% {
                    opacity: 0;
                    transform: scale(2) rotate(30deg);
                    filter: blur(12px);
                    background-color: rgba(255, 255, 255, 1);
                }
            }
        `;
        document.head.appendChild(style);
    
        // Apply the animation and remove the image after animation completes
        imageElement.style.animation = 'poofToWhiteSmoke 3s ease forwards'; // Set to 3s for visibility
    
        setTimeout(async () => {
            try {
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${window.env.AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: body
                });
    
                if (!response.ok) {
                    const errorDetails = await response.json();
                    console.error(`Error updating record: ${response.status} ${response.statusText}`, errorDetails);
                } else {
                    console.log('Image successfully deleted from Airtable:', await response.json());
                    imageElement.remove();
                }
            } catch (error) {
                console.error('Error updating record in Airtable:', error);
            }
        }, 3000); // Match the timeout to the animation duration
    }
       
    function openImageViewer(images, startIndex) {
        let imageViewerModal = document.getElementById('image-viewer-modal');
        if (!imageViewerModal) {
            imageViewerModal = document.createElement('div');
            imageViewerModal.id = 'image-viewer-modal';
            imageViewerModal.classList.add('image-viewer-modal');
            document.body.appendChild(imageViewerModal);
    
            const modalImage = document.createElement('img');
            modalImage.classList.add('modal-image');
            modalImage.id = 'modal-image'; 
            imageViewerModal.appendChild(modalImage);
    
            const closeModalButton = document.createElement('button');
            closeModalButton.textContent = 'X';
            closeModalButton.classList.add('close-modal-button');
            closeModalButton.onclick = () => closeModal(); 
            imageViewerModal.appendChild(closeModalButton);
    
            const prevButton = document.createElement('button');
            prevButton.textContent = '<';
            prevButton.classList.add('carousel-nav-button', 'prev');
            prevButton.onclick = () => {
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                updateModalImage();
            };
            imageViewerModal.appendChild(prevButton);
    
            const nextButton = document.createElement('button');
            nextButton.textContent = '>';
            nextButton.classList.add('carousel-nav-button', 'next');
            nextButton.onclick = () => {
                currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                updateModalImage();
            };
            imageViewerModal.appendChild(nextButton);
        }
    
        let currentIndex = startIndex;
    
        function updateModalImage() {
            const modalImage = document.getElementById('modal-image');
            if (images[currentIndex]) {
                modalImage.src = images[currentIndex].url;
            } else {
                console.error('Image not found at index:', currentIndex);
            }
        }
    
const modalImage = document.getElementById('modalImage');

function closeModal() {
    imageViewerModal.style.display = 'none';
    enablePageScrolling();
    document.removeEventListener('keydown', handleKeyNavigation); 
}

imageViewerModal.addEventListener('click', function(event) {
    if (event.target === imageViewerModal) { 
        closeModal();
    }
});
       
        updateModalImage();
        imageViewerModal.style.display = 'flex'; 
    
        function handleKeyNavigation(event) {
            if (event.key === 'ArrowLeft') {
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                updateModalImage();
            } else if (event.key === 'ArrowRight') {
                currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                updateModalImage();
            } else if (event.key === 'Escape') {
                closeModal(); 
            }
        }
    
        document.addEventListener('keydown', handleKeyNavigation);
    }   
       
    function enablePageScrolling() {
        document.body.style.overflow = '';
    }
    
    function showToast(message) {
        toast.textContent = message;
        toast.style.visibility = 'visible';
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.style.visibility = 'hidden';
            }, 500);
        }, 3000);
    }

    function disableAddPhotosButton(recordId, disable) {
        const addPhotoButton = document.querySelector(`td[data-id="${recordId}"] .image-carousel button`);
        if (addPhotoButton) {
            addPhotoButton.disabled = disable;
        }
    }
     // Function to hide the submit button
     function hideSubmitButton() {
        submitButton.style.display = 'none';
        hasChanges = false;
        activeRecordId = null;
        console.log('Submit button hidden. No changes detected.');
    }
    
// Function to submit changes
async function submitChanges() {
    if (!confirmationShown) {
        const userConfirmed = confirm("Are you sure you want to submit all changes?");
        if (!userConfirmed) {
            showToast('Submission canceled.');
            confirmationShown = false;
            return;
        }
        confirmationShown = true;
    }
    try {
        mainContent.style.display = 'none';
        secondaryContent.style.display = 'none';

        // Loop through all records
        for (const recordId in originalValues) {
            const fieldsToUpdate = updatedFields[recordId] || {};

            // Check Start Date and generate Calendar Link if it doesn't exist or needs updating
            const startDateField = originalValues[recordId]?.['Start Date'];
            const existingCalendarLink = originalValues[recordId]?.['Calendar Link'];
            
            if (startDateField && !existingCalendarLink) { // Add `!existingCalendarLink` if you only want to add the link if it's missing
                // Convert Start Date from 'MM/DD/YYYY HH:mm AM/PM' format to 'YYYYMMDD'
                const parsedDate = new Date(startDateField);
                
                if (!isNaN(parsedDate)) {
                    const formattedStartDate = parsedDate.toISOString().split('T')[0].replace(/-/g, '');
                    const calendarUrl = `https://calendar.google.com/calendar/embed?src=c_ebe1fcbce1be361c641591a6c389d4311df7a97961af0020c889686ae059d20a%40group.calendar.google.com&ctz=America%2FToronto&dates=${formattedStartDate}/${formattedStartDate}`;
                    
                    fieldsToUpdate['Calendar Link'] = calendarUrl;
                    console.log(`Generated Calendar Link for record ${recordId}:`, calendarUrl); // Log each Calendar Link
                } else {
                    console.error(`Invalid Start Date format for record ${recordId}, unable to generate Calendar Link.`);
                }
            }
            // Skip if there are no fields to update
            if (Object.keys(fieldsToUpdate).length === 0) continue;

            // Log the payload for this record before updating
            console.log(`Payload to update in Airtable for record ${recordId}:`, fieldsToUpdate);

            // Update record in Airtable
            await updateRecord(recordId, fieldsToUpdate);
        }

        showToast('All changes submitted successfully!');
        updatedFields = {};
        hasChanges = false;
        activeRecordId = null;
        confirmationShown = false;
        hideSubmitButton();

        await fetchAllData(); // Refresh data
    } catch (error) {
        console.error('Error during submission:', error);
        showToast('Error submitting changes.');
        confirmationShown = false;
    }
        finally {
        mainContent.style.display = 'block';
        secondaryContent.style.display = 'block';
        hideSubmitButton();
    }
}

submitButton.addEventListener('click', function () {
    console.log('Submit button clicked.');

    if (!isSubmitting && !confirmationShown) {
        console.log('No active submission and no confirmation shown yet.');
        
        isSubmitting = true;
        console.log('Submission in progress: ', isSubmitting);
        
        try {
            console.log('Calling submitChanges...');
            submitChanges();
            console.log('submitChanges function called successfully.');
        } catch (error) {
            console.error('Error during submitChanges execution: ', error);
        }
    } else {
        if (isSubmitting) {
            console.log('Submission already in progress, skipping duplicate submission.');
        }
        if (confirmationShown) {
            console.log('Confirmation already shown, skipping additional confirmation.');
        }
    }
});
    
    document.addEventListener('DOMContentLoaded', function () {
        function adjustImageSize() {
            const images = document.querySelectorAll('td:nth-child(9) .image-carousel img');
            images.forEach(img => {
                if (window.innerWidth < 576) {
                    img.style.maxWidth = '80px';
                    img.style.maxHeight = '80px';
                } else if (window.innerWidth < 768) {
                    img.style.maxWidth = '100px';
                    img.style.maxHeight = '100px';
                } else {
                    img.style.maxWidth = '150px';
                    img.style.maxHeight = '150px';
                }
            });
        }
    
let originalValues = {};  
let updatedFields = {};  
let hasChanges = false;  
        
    // Function to check for changes compared to original values
    function checkForChanges(recordId) {
        const currentValues = updatedFields[recordId] || {};
        
        const fieldsHaveChanged = Object.keys(currentValues).some(field => {
            const currentValue = currentValues[field];
            const originalValue = originalValues[recordId] ? originalValues[recordId][field] : undefined;
            console.log(`Comparing field "${field}": current value = ${currentValue}, original value = ${originalValue}`);
            return currentValue !== originalValue;
        });

        // If there are no changes, clear updatedFields for the record
        if (!fieldsHaveChanged) {
            delete updatedFields[recordId];
        }

        // Update hasChanges based on updatedFields status
        hasChanges = Object.keys(updatedFields).length > 0;

        if (hasChanges) {
            showSubmitButton(recordId);
        } else {
            hideSubmitButton();
        }
    }

 // Attach event listeners to track changes
 document.querySelectorAll('input, select, td[contenteditable="true"]').forEach(element => {
    element.addEventListener('input', function () {
        const recordId = this.closest('tr').dataset.id;
        console.log(`Input event detected for record ID: ${recordId}`);
        handleInputChange.call(this);
    });

    element.addEventListener('change', function () {
        const recordId = this.closest('tr').dataset.id;
        console.log(`Change event detected for record ID: ${recordId}`);
        handleInputChange.call(this);
    });

    element.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const recordId = element.closest('tr').dataset.id;
            console.log(`Enter key pressed for record ID: ${recordId}`);
            handleInputChange.call(element, event);
            if (hasChanges) {
                submitChanges();
            }
        }
    });
});
        
 // Function to handle input change and update values
 function handleInputChange(event) {
    const recordId = this.closest('tr').dataset.id;
    const field = this.dataset.field;
    updatedFields[recordId] = updatedFields[recordId] || {};
    updatedFields[recordId][field] = this.value || this.textContent;
    console.log(`Updated fields for record ID ${recordId}:`, updatedFields[recordId]);
    checkForChanges(recordId);
}

document.querySelectorAll('input, select, td[contenteditable="true"]').forEach(element => {
    element.addEventListener('input', handleInputChange); 
    element.addEventListener('change', handleInputChange); 
});
     
                function showSubmitButton(recordId) {
            if (hasChanges) {
                const lastTop = localStorage.getItem('submitButtonTop') || '50%';
                const lastLeft = localStorage.getItem('submitButtonLeft') || '50%';
                submitButton.style.top = lastTop;
                submitButton.style.left = lastLeft;
                submitButton.style.display = 'block';
                activeRecordId = recordId;
            }
        }
        

window.addEventListener('resize', () => {
    adjustImageSize();
    adjustButtonPosition();
});

adjustImageSize();
adjustButtonPosition();
}); 

document.querySelectorAll('table input, table select, table td[contenteditable="true"]').forEach(element => {
    element.addEventListener('input', function () {
        const closestRow = this.closest('tr');
        if (!closestRow || !closestRow.dataset.id) {
            console.error("No valid <tr> or 'dataset.id' found for element:", this);
            return;
        }
        const recordId = closestRow.dataset.id;
        console.log(`Input event detected for record ID: ${recordId}`);
        handleInputChange.call(this);
    });

    element.addEventListener('change', function () {
        const closestRow = this.closest('tr');
        if (!closestRow || !closestRow.dataset.id) {
            console.error("No valid <tr> or 'dataset.id' found for element:", this);
            return;
        }
        const recordId = closestRow.dataset.id;
        console.log(`Change event detected for record ID: ${recordId}`);
        handleInputChange.call(this);
    });



    element.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const recordId = element.closest('tr').dataset.id;
            console.log(`Enter key pressed for record ID: ${recordId}`);
            handleInputChange.call(element, event);
            if (hasChanges) {
                submitChanges();
            }
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed.');

    const radioButtons = document.querySelectorAll('input[name="branch"]');
    if (radioButtons.length === 0) {
        console.error('No radio buttons found. Ensure the DOM contains the inputs.');
        return;
    }

    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedBranch = document.querySelector('input[name="branch"]:checked').value || '';
            console.log(`Filtering records for branch: ${selectedBranch || 'All'}`);

            const tables = ['#airtable-data', '#feild-data'];
            tables.forEach(tableSelector => {
                const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
                rows.forEach(row => {
                    const branchCell = row.querySelector('td:first-child');
                    if (branchCell) {
                        const branchValue = branchCell.textContent.trim();
                        row.style.display = branchValue === selectedBranch || selectedBranch === '' ? '' : 'none';
                    }
                });
            });
        });
    });
});


document.addEventListener('DOMContentLoaded', async function () {
    let debounceTimeout = null; 

    function handleDelayedSubmit(recordId) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            if (hasChanges) {
                submitChanges();  
            }
        }, 5000);
    }

    document.querySelectorAll('input[type="text"], td[contenteditable="true"]').forEach(element => {
        if (element.id !== 'search-input') {  
            element.addEventListener('input', function () {
                const recordId = this.closest('tr').dataset.id;
                checkForChanges(recordId);  
                if (hasChanges) {
                    showSubmitButton(recordId);  
                    handleDelayedSubmit(recordId);  
                } else {
                    hideSubmitButton();  
                }
            });
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM fully loaded and parsed.');
    
        // Fetch and populate table data
        fetchAllData().then(() => {
            console.log('Table data loaded.');
    
            // Add event listeners for branch radio buttons
            const radioButtons = document.querySelectorAll('input[name="branch"]');
            if (radioButtons.length === 0) {
                console.error('No radio buttons found. Ensure the DOM contains the inputs.');
                return;
            }
    
            radioButtons.forEach(radio => {
                radio.addEventListener('change', () => {
                    const selectedBranch = document.querySelector('input[name="branch"]:checked').value || '';
                    console.log(`Filtering records for branch: ${selectedBranch || 'All'}`);
    
                    const tables = ['#airtable-data', '#feild-data'];
                    tables.forEach(tableSelector => {
                        const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
                        rows.forEach(row => {
                            const branchCell = row.querySelector('td:first-child');
                            if (branchCell) {
                                const branchValue = branchCell.textContent.trim();
                                row.style.display = branchValue === selectedBranch || selectedBranch === '' ? '' : 'none';
                            } else {
                                console.warn('Branch cell not found for row:', row);
                            }
                        });
                    });
                });
            });
    
            console.log('Event listeners added to radio buttons.');
        });
    });
    

    document.addEventListener('DOMContentLoaded', () => {
        // Select all radio buttons for branch filtering
        const radioButtons = document.querySelectorAll('input[name="branch"]');
    
        // Attach a change event listener to each radio button
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (event) => {
                const selectedBranch = event.target.value;
                console.log(`User selected branch: ${selectedBranch || 'All'}`);
            });
        });
    });
    

    document.querySelectorAll('input, select, td[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', function () {
            const closestRow = this.closest('tr');
            
            if (!closestRow || !closestRow.dataset.id) {
                console.error("No valid parent <tr> or dataset 'id' found for element:", this);
                return;
            }
    
            const recordId = closestRow.dataset.id;
            console.log(`Handling input change for record ID: ${recordId}`);
            
            // Call the function to handle updates (if applicable)
            handleInputChange.call(this);
            checkForChanges(recordId);
        });
    });

    document.getElementById('subcontractorPaymentInput').addEventListener('input', function (event) {
        let value = event.target.value.trim();
    
        // Remove non-numeric characters except for decimals
        value = value.replace(/[^0-9.]/g, '');
    
        // Ensure there's at most one decimal point
        if ((value.match(/\./g) || []).length > 1) {
            showToast('Invalid input: Too many decimal points.');
            event.target.value = '';
            return;
        }
    
        event.target.value = value;
    });
    
    
    
    document.querySelectorAll('td[contenteditable="true"], input[type="text"]').forEach(element => {
        element.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && element.id !== 'search-input') {
                event.preventDefault();
                submitChanges();  
            }
        });
    });
    fetchAllData();
});

const dynamicButtonsContainer = document.createElement('div');
dynamicButtonsContainer.classList.add('dynamic-buttons-container'); 
dynamicButtonsContainer.appendChild(submitButton);
document.body.appendChild(dynamicButtonsContainer);

    submitButton.addEventListener('click', function () {
        submitChanges();
    });

    async function updateRecord(recordId, fields) {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
    
        // Ensure Subcontractor Payment is a valid number
        if (fields['Subcontractor Payment'] !== undefined) {
            fields['Subcontractor Payment'] = Number(fields['Subcontractor Payment']);
            if (isNaN(fields['Subcontractor Payment'])) {
                console.error('Invalid Subcontractor Payment value:', fields['Subcontractor Payment']);
                return; // Exit if invalid
            }
        }
    
        const body = JSON.stringify({ fields });
    
        console.log(`Attempting to update record with ID: ${recordId}`);
        console.log(`Request URL: ${url}`);
        console.log(`Request Body:`, body);
    
        
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${airtableApiKey}`,
                'Content-Type': 'application/json',
            },
            body,
        });

        if (!response.ok) {
            const error = await response.json();
            console.error(`Failed to update record ${recordId}:`, error);
        } else {
            const success = await response.json();
            console.log(`Record ${recordId} updated successfully:`, success);
        }
    } catch (error) {
        console.error(`Error updating record ${recordId}:`, error);
    }
}
    
    document.getElementById('search-input').addEventListener('input', function () {
        const searchValue = this.value.toLowerCase();

        ['#airtable-data', '#feild-data'].forEach(tableSelector => {
            const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const match = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(searchValue));
                row.style.display = match ? '' : 'none';
            });
        });
    });

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = "none", 300);
        }
    };

    fetchAllData();
});