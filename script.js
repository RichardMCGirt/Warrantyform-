document.addEventListener('DOMContentLoaded', async function () {
    const airtableApiKey = window.env.AIRTABLE_API_KEY;
    const airtableBaseId = window.env.AIRTABLE_BASE_ID;
    const airtableTableName = window.env.AIRTABLE_TABLE_NAME;
    let dropboxAccessToken;
    let dropboxAppKey;
    let dropboxAppSecret;
    let dropboxRefreshToken;

  fetchvendors();

    fetchAirtableFields();
    // Fetch Dropbox credentials from Airtable
 fetchDropboxCredentials();

    // Check Dropbox token validity on page startup
    checkDropboxTokenValidity();

    

        // Function to check if Dropbox token is still valid
        async function checkDropboxTokenValidity() {
            console.log('Checking if Dropbox token is still valid...');
        
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

    const calendarLinks = [
        { id: 'https://calendar.google.com/calendar/embed?src=c_d113e252e0e5c8cfbf17a13149707a30d3c0fbeeff1baaac7a46940c2cc448ca%40group.calendar.google.com&ctz=America%2FToronto', name: 'Charleston' },
        { id: 'https://calendar.google.com/calendar/ical/c_03867438b82e5dfd8d4d3b6096c8eb1c715425fa012054cc95f8dea7ef41c79b%40group.calendar.google.com/public/basic.ics', name: 'Greensboro' },
        { id: 'https://calendar.google.com/calendar/embed?src=c_ad562073f4db2c47279af5aa40e53fc2641b12ad2497ccd925feb220a0f1abee%40group.calendar.google.com&ctz=America%2FToronto', name: 'Myrtle Beach' },
        { id: 'https://calendar.google.com/calendar/embed?src=c_45db4e963c3363676038697855d7aacfd1075da441f9308e44714768d4a4f8de%40group.calendar.google.com&ctz=America%2FToronto', name: 'Wilmington' },
        { id: 'https://calendar.google.com/calendar/embed?src=c_0476130ac741b9c58b404c737a8068a8b1b06ba1de2a84cff08c5d15ced54edf%40group.calendar.google.com&ctz=America%2FToronto', name: 'Greenville' },
        { id: 'https://calendar.google.com/calendar/embed?src=c_df033dd6c81bb3cbb5c6fdfd58dd2931e145e061b8a04ea0c13c79963cb6d515%40group.calendar.google.com&ctz=America%2FToronto', name: 'Columbia' },
        { id: 'https://calendar.google.com/calendar/embed?src=c_ebe1fcbce1be361c641591a6c389d4311df7a97961af0020c889686ae059d20a%40group.calendar.google.com&ctz=America%2FToronto', name: 'Savannah' },
        { id: 'https://calendar.google.com/calendar/embed?src=warranty%40vanirinstalledsales.com&ctz=America%2FToronto', name: 'Raleigh' }
    ];

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
        console.log('Submit button shown for changes in record:', recordId);
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
        console.log('Starting fetchDropboxCredentials function');
        console.log('Airtable URL:', url);
        console.log('Fetching Dropbox credentials from Airtable...');

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
                console.log('All Dropbox credentials successfully fetched and set.');
            }
        } catch (error) {
            console.error('Error occurred during fetchDropboxCredentials:', error);
        }
    }

    async function fetchvendors() {
        const url = `https://api.airtable.com/v0/${window.env.AIRTABLE_BASE_ID3}/${window.env.AIRTABLE_TABLE_NAME3}`;
        
        console.log(`Starting to fetch vendors from: ${url}`);
    
        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${window.env.AIRTABLE_API_KEY}`
                }
            });
    
    
            if (!response.ok) {
                console.error(`Error fetching records: ${response.status} ${response.statusText}`);
                return [];
            }
    
            const data = await response.json();
    
            // Add log to inspect available fields
            data.records.forEach(record => {
            });
    
            // Check if 'Name' is the correct field name
            const vendors = data.records
                .filter(record => record.fields['Name'])  // Filter only records that have 'Name'
                .map(record => record.fields['Name']);    // Extract the vendor names
    
    
            return vendors;  // Return the list of vendor names
        } catch (error) {
            console.error('Error fetching vendor records:', error);
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
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`
                }
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching records: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
            return data.records; // Return the array of records
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
    fileInput.accept = 'image/*';
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
                    const formattedLink = dropboxUrl.replace('?dl=0', '?raw=1');
                    console.log(`Upload successful for "${file.name}". Dropbox URL (formatted): ${formattedLink}`);
                    uploadedUrls.push({ url: formattedLink });
                } else {
                    console.error(`Upload failed for "${file.name}" even after refreshing the Dropbox token.`);
                }
    
            } catch (error) {
                console.error(`Error during file upload to Dropbox for file "${file.name}":`, error);
    
                if (error.response) {
                    // Error received from Dropbox with status and response details
                    console.error('Dropbox API response error details:');
                    console.log(`Status Code: ${error.response.status}`);
                    console.log(`Status Text: ${error.response.statusText}`);
                    const errorData = await error.response.json();
                    console.log('Error Data:', JSON.stringify(errorData, null, 2));
                } else if (error.request) {
                    // Error related to the network or request, but no response from Dropbox
                    console.error('No response received from Dropbox. Network or request error:');
                    console.log('Request Details:', error.request);
                } else {
                    // Error occurred in setting up the request or due to unknown issues
                    console.error('Unknown error during Dropbox file upload:');
                    console.log('Error Message:', error.message);
                    console.log('Error Stack:', error.stack);
                }
    
                return null;
            }
        }
    
        // Log the final list of URLs to be updated in Airtable
        const allImages = currentImages.concat(uploadedUrls);
        console.log(`Total images (including existing and new) to update in Airtable for record ID ${recordId}:`, allImages);
    
        if (allImages.length > 0) {
            const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
            const body = JSON.stringify({ fields: { [targetField]: allImages } });
    
            console.log(`Sending PATCH request to Airtable for record ID ${recordId}, updating field "${targetField}"...`);
    
            try {
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${airtableApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: body
                });
    
                console.log(`Airtable PATCH request response status: ${response.status}`);
    
                if (!response.ok) {
                    const errorResponse = await response.json();
                    console.error(`Failed to update Airtable record. Status: ${response.status} - ${response.statusText}`, errorResponse);
                } else {
                    const successResponse = await response.json();
                    console.log('Successfully updated Airtable record:', successResponse);
                }
            } catch (error) {
                console.error(`Error during Airtable API PATCH request for record ID ${recordId}:`, error);
            }
        } else {
            console.warn('No files were uploaded to Dropbox, so Airtable update will be skipped.');
        }
    }

    async function fetchAirtableFields() {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?maxRecords=1`;
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
        
            const data = await response.json();
            console.log('Available fields in the first record:', data.records[0].fields);
        } catch (error) {
            console.error('Error fetching fields from Airtable:', error);
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
        const path = `/${file.name}`;
        console.log(`Uploading file to Dropbox: ${file.name} at path: ${path}`);
    
        try {
            const response = await fetch(dropboxUploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${dropboxAccessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: path,
                        mode: 'add',
                        autorename: true,
                        mute: false
                    })
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
                    // A shared link already exists, fetch the existing link
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

    function convertToDirectLink(url) {
        return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '?raw=1');
    }

    async function fetchData(offset = null) {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?${offset ? `offset=${offset}` : ''}`;
    
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
    
            if (!response.ok) {
                console.error(`Error fetching data: ${response.status} ${response.statusText}`);
                return { records: [] }; // Return an empty array on error
            }
    
            return await response.json();
        } catch (error) {
            console.error('Error fetching data from Airtable:', error);
            return { records: [] }; // Return an empty array if an error occurs
        }
    }
    

    function syncTableWidths() {
        const mainTable = document.querySelector('#airtable-data');
        const secondaryTable = document.querySelector('#feild-data');

        if (mainTable && secondaryTable) {
            // Get the computed width of the main table
            const mainTableWidth = mainTable.offsetWidth;
            
            // Apply the same width to the secondary table
            secondaryTable.style.width = `${mainTableWidth}px`;
        }
    }
    
    let vendorOptions = []; // Declare vendorOptions properly

    let subOptions = []; // Declare subOptions globally

    async function fetchAllData() {
        mainContent.style.display = 'none';
        secondaryContent.style.display = 'none';

        originalValues = { /* Populate this with fetched data */ };
        console.log('Original values loaded:', originalValues);
    
    
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
    
            // Fetch vendor options for 'Material Vendor' dropdown
            try {
                vendorOptions = await fetchvendors(); // Fetch vendor data and assign it to vendorOptions
            } catch (error) {
                console.error('Error fetching vendor options:', error);
                vendorOptions = []; // Continue with empty array if error occurs
            }
    
            // Fetch sub options (assuming it's fetched from another Airtable table or source)
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
                record.fields['Status'] === 'Scheduled- Awaiting Field' &&
                !record.fields['Job Completed'] // Ensures 'Job Completed' is unchecked
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
    
    function handleInputChange(event) {
        const recordId = this.closest('tr').dataset.id;
        const field = this.dataset.field;
        console.log(`Handling input change for record ID: ${recordId}, field: ${field}`);
    
        updatedFields[recordId] = updatedFields[recordId] || {};
        updatedFields[recordId][field] = this.value || this.textContent;
        console.log(`Updated fields for record ID ${recordId}:`, updatedFields[recordId]);
    
        checkForChanges(recordId);
    }
    
    document.querySelectorAll('input, select, td[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', function () {
            const recordId = this.closest('tr').dataset.id;
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
   
    async function fetchAirtableSubOptionsFromDifferentTable() {
        let records = [];
        let offset = null;
        const url = `https://api.airtable.com/v0/${window.env.AIRTABLE_BASE_ID}/${window.env.AIRTABLE_TABLE_NAME2}`;
        
        do {
            const response = await fetch(`${url}?fields[]=Subcontractor%20Company%20Name&fields[]=Vanir%20Branch&fields[]=Subcontractor%20Phone%20Number${offset ? `&offset=${offset}` : ''}`, {
                headers: {
                    Authorization: `Bearer ${window.env.AIRTABLE_API_KEY}`
                }
            });
    
            if (!response.ok) {
                console.error(`Error fetching subcontractor options: ${response.status} ${response.statusText}`);
                break;
            }
    
            const data = await response.json();
            records = records.concat(data.records);  
            offset = data.offset;  
        } while (offset);
    
        const subOptions = Array.from(new Set(records.map(record => ({
            name: record.fields['Subcontractor Company Name'] || 'Unnamed Subcontractor',
            vanirOffice: record.fields['Vanir Branch'] || 'Unknown Branch',
            phone: record.fields['Subcontractor Phone Number'] || 'N/A'  // Include the phone number
        })).filter(Boolean)));
        
        return subOptions;  
    }
    
    
    async function displayData(records, tableSelector, isSecondary = false) {
        const tbody = document.querySelector(`${tableSelector} tbody`);
        tbody.innerHTML = '';
    
        if (records.length === 0) return;
    
        records.forEach(record => {
            const fields = record.fields;
            const row = document.createElement('tr');
    
            const fieldConfigs = isSecondary ? [
                { field: 'b', value: fields['b'] || 'N/A', link: true },
                { field: 'Lot Number and Community/Neighborhood', value: fields['Lot Number and Community/Neighborhood'] || 'N/A' },
                { field: 'Homeowner Name', value: fields['Homeowner Name'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A', directions: true },
                { field: 'description', value: fields['description'] ? fields['description'].replace(/<\/?[^>]+(>|$)/g, "") : 'N/A' },       
                { field: 'Contact Email', value: fields['Contact Email'] || 'N/A', email: true },
                { field: 'Completed  Pictures', value: fields['Completed  Pictures'] || [], image: true, imageField: 'Completed  Pictures' },
                { field: 'DOW to be Completed', value: fields['DOW to be Completed'] || 'N/A', editable: true },
                { field: 'Job Completed', value: fields['Job Completed'] || false, checkbox: true }
            ] : [
                { field: 'b', value: fields['b'] || 'N/A', link: true },
                { field: 'Lot Number and Community/Neighborhood', value: fields['Lot Number and Community/Neighborhood'] || 'N/A' },
                { field: 'Homeowner Name', value: fields['Homeowner Name'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A', directions: true },
                { field: 'description', value: fields['description'] ? fields['description'].replace(/<\/?[^>]+(>|$)/g, "") : 'N/A' },
                { field: 'Contact Email', value: fields['Contact Email'] || 'N/A', email: true },
                { field: 'Picture(s) of Issue', value: fields['Picture(s) of Issue'] || [], image: true, link: true, imageField: 'Picture(s) of Issue' },
                { field: 'Materials Needed', value: fields['Materials Needed'] || 'N/A', editable: true },
                {
                    field: 'Material Vendor',
                    value: fields['Material Vendor'] || '',
                    dropdown: true,
                    options: vendorOptions  
                },
                { field: 'Billable/ Non Billable', value: fields['Billable/ Non Billable'] || '', dropdown: true, options: ['Billable', 'Non Billable'] },
                { field: 'Billable Reason (If Billable)', value: fields['Billable Reason (If Billable)'] || '', dropdown: true, options: ['Another Trade Damaged Work', 'Homeowner Damage', 'Weather'] },
                { field: 'Field Tech Reviewed', value: fields['Field Tech Reviewed'] || false, checkbox: true },
                { field: 'Subcontractor', value: fields['Subcontractor'] || '', dropdown: true, options: subOptions },
                { field: 'Subcontractor Not Needed', value: fields['Subcontractor Not Needed'] || false, checkbox: true }
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
                
                    let filteredOptions = [];
                    if (field === 'Subcontractor') {
                        const vanirBranchValue = fields['b'];  
                        
                        filteredOptions = subOptions.filter(sub => sub.vanirOffice === vanirBranchValue);
                
                        if (filteredOptions.length === 0) {
                        }
                    } else {
                        filteredOptions = options;
                    }
            
            
let placeholderText = 'Select a Vendor...'; // Default placeholder
if (field === 'Subcontractor') {
    placeholderText = 'Select a Subcontractor ...';
} else if (field === 'Billable/ Non Billable') {
    placeholderText = 'Select Billable Status ...';
} else if (field === 'Billable Reason (If Billable)') {
    placeholderText = 'Select a Reason ...';
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

filteredOptions.sort((a, b) => {
    const nameA = a.name ? a.name.toLowerCase() : a.toLowerCase();  // Ensure valid comparison for both cases
    const nameB = b.name ? b.name.toLowerCase() : b.toLowerCase();
    return nameA.localeCompare(nameB);
});

filteredOptions.forEach(option => {
    const optionElement = document.createElement('option');
    const optionValue = option.name || option; // Ensure compatibility with both hardcoded and dynamic options

    optionElement.value = optionValue;
    optionElement.textContent = optionValue;

    if (optionValue === value || optionValue === fields['Subcontractor']) {
        optionElement.selected = true;  // Mark this option as selected
    }

    select.appendChild(optionElement);
});

cell.appendChild(select);

 // Add change event listener for disabling checkbox
 select.addEventListener('change', () => {
    const selectedValue = select.value;
    const subcontractorNotNeededCheckbox = cell.closest('tr').querySelector('input[data-field="Subcontractor Not Needed"]');

    if (subcontractorNotNeededCheckbox) {
        subcontractorNotNeededCheckbox.disabled = selectedValue !== '';  // Disable if any option other than placeholder
        subcontractorNotNeededCheckbox.checked = false; // Reset checkbox
        console.log('Updated checkbox disabled state:', subcontractorNotNeededCheckbox.disabled);
    } else {
        console.warn("Checkbox 'Subcontractor Not Needed' not found in the row.");
    }
});

cell.appendChild(select);


  // Create phone number div for Subcontractor
  const phoneNumberDiv = document.createElement('div');
  phoneNumberDiv.classList.add('subcontractor-phone-number');
  phoneNumberDiv.style.marginBottom = '10px';
  cell.appendChild(phoneNumberDiv);

  if (value) {
      const subcontractorRecord = options.find(opt => opt.name === value);
      if (subcontractorRecord && subcontractorRecord.phone) {
          phoneNumberDiv.innerHTML = `<a href="tel:${subcontractorRecord.phone}" style="cursor: pointer; text-decoration: none; color: inherit;">Phone: ${subcontractorRecord.phone}</a>`;
          phoneNumberDiv.style.display = 'block';
      } else {
          phoneNumberDiv.style.display = 'none';
      }
  } else {
      phoneNumberDiv.style.display = 'none';
  }

  select.addEventListener('change', () => {
    const selectedSubcontractor = select.value;

    // Update the phone number display based on selected subcontractor
    const subcontractorRecord = options.find(opt => opt.name === selectedSubcontractor);
    if (subcontractorRecord && subcontractorRecord.phone) {
        phoneNumberDiv.innerHTML = `<a href="tel:${subcontractorRecord.phone}" style="cursor: pointer; text-decoration: none; color: inherit;">Phone: ${subcontractorRecord.phone}</a>`;
        phoneNumberDiv.style.display = 'block';
    } else {
        phoneNumberDiv.style.display = 'none';
    }

    // Locate the 'Subcontractor Not Needed' checkbox directly using its field name
    const subcontractorNotNeededCheckbox = cell.closest('tr').querySelector('input[data-field="Subcontractor Not Needed"]');
    
    if (subcontractorNotNeededCheckbox) {
        // Disable the checkbox if any option other than the placeholder is chosen
        const isPlaceholderSelected = (selectedSubcontractor === '');
        subcontractorNotNeededCheckbox.disabled = !isPlaceholderSelected;
        subcontractorNotNeededCheckbox.checked = false; // Reset checkbox if it's disabled
        console.log('Checkbox status updated:', !isPlaceholderSelected);
    } else {
        console.warn("Checkbox 'Subcontractor Not Needed' not found in the row.");
    }
});



// Track selection changes for updating Airtable records
select.addEventListener('change', () => {
    const newValue = select.value;
    updatedFields[record.id] = updatedFields[record.id] || {};
    updatedFields[record.id][field] = newValue;
    hasChanges = true;

    showSubmitButton(record.id);
  
    // Enable or disable the checkbox based on selection
    const fieldReviewCheckbox = row.querySelector('input[type="checkbox"]');
    if (fieldReviewCheckbox) {
        fieldReviewCheckbox.disabled = (newValue === "");
        fieldReviewCheckbox.checked = false;
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
                    const images = Array.isArray(fields[field]) ? fields[field] : [];
                    const carouselDiv = document.createElement('div');
                    carouselDiv.classList.add('image-carousel');
    
                    if (images.length > 0) {
                        let currentIndex = 0;
                        const imgElement = document.createElement('img');
                        imgElement.src = images[0].url;
                        imgElement.alt = "Issue Picture";
                        imgElement.style.maxWidth = '100%';
                        imgElement.style.height = 'auto';
                        imgElement.classList.add('carousel-image');
                        imgElement.onclick = () => openImageViewer(images, 0);
                        carouselDiv.appendChild(imgElement);
    
                        const imageCount = document.createElement('div');
                        imageCount.classList.add('image-count');
                        imageCount.textContent = `1 of ${images.length}`;
                        carouselDiv.appendChild(imageCount);
    
                        let prevButton, nextButton;
                        if (images.length > 1) {
                            prevButton = document.createElement('button');
                            prevButton.textContent = '<';
                            prevButton.classList.add('carousel-nav-button', 'prev');
                            prevButton.onclick = () => {
                                currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                                imgElement.src = images[currentIndex].url;
                                imageCount.textContent = `${currentIndex + 1} of ${images.length}`;
                            };
    
                            nextButton = document.createElement('button');
                            nextButton.textContent = '>';
                            nextButton.classList.add('carousel-nav-button', 'next');
                            nextButton.onclick = () => {
                                currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                                imgElement.src = images[currentIndex].url;
                                imageCount.textContent = `${currentIndex + 1} of ${images.length}`;
                            };
    
                            carouselDiv.appendChild(prevButton);
                            carouselDiv.appendChild(nextButton);
                        }
    
                        const deleteButton = document.createElement('button');
                        deleteButton.innerHTML = '🗑️';
                        deleteButton.classList.add('delete-button');
                        deleteButton.onclick = async () => {
                            const confirmed = confirm('Are you sure you want to delete this image?');
                            if (confirmed) {
                                await deleteImageFromAirtable(record.id, images[currentIndex].id, imageField);
                                images.splice(currentIndex, 1);
                                if (images.length > 0) {
                                    currentIndex = currentIndex % images.length;
                                    imgElement.src = images[currentIndex].url;
                                    imageCount.textContent = `${currentIndex + 1} of ${images.length}`;
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
        if (subcontractorDropdown && subcontractorDropdown.value !== "Select a Subcontractor...") {
            checkboxElement.disabled = true; 
            checkboxElement.checked = false; 
        } else {
            checkboxElement.disabled = false; 
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
                        cell.innerHTML = `<a href="${matchingCalendar.id}" target="_blank">${value}</a>`;
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



 

    async function deleteImageFromAirtable(recordId, imageId, imageField) {
        const url = `https://api.airtable.com/v0/${window.env.AIRTABLE_BASE_ID}/${window.env.AIRTABLE_TABLE_NAME}/${recordId}`;
        const currentImages = await fetchCurrentImagesFromAirtable(recordId, imageField);
    
        const updatedImages = currentImages.filter(image => image.id !== imageId);
    
        const body = JSON.stringify({ fields: { [imageField]: updatedImages.length > 0 ? updatedImages : [] } });
    
        const imageElement = document.querySelector(`img[src="${currentImages.find(img => img.id === imageId)?.url}"]`);
        const trashCan = document.querySelector('.trash-can');
    
        if (!imageElement || !trashCan) {
            console.error('Image element or trash can element not found.');
            return;
        }
    
        const imageRect = imageElement.getBoundingClientRect();
        const trashCanRect = trashCan.getBoundingClientRect();
    
        imageElement.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
        imageElement.style.transform = `translate(${trashCanRect.left - imageRect.left}px, ${trashCanRect.top - imageRect.top}px) scale(0)`;
    
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
    
                    await fetchAllData();
                }
            } catch (error) {
                console.error('Error updating record in Airtable:', error);
            }
        }, 1000); 
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
    
    let confirmationShown = false; 

    // Function to submit changes
async function submitChanges() {
    // Check for any unsaved changes and valid active record
    if (!hasChanges || !activeRecordId) {
        showToast('No changes to submit.');
        hideSubmitButton();
        return;
    }

    // Confirm submission if not already confirmed
    if (!confirmationShown) {
        const userConfirmed = confirm("Are you sure you want to submit these changes?");
        if (!userConfirmed) {
            showToast('Submission canceled.');
            confirmationShown = false;
            return;
        }
        confirmationShown = true;
    }

    try {
        console.log('Submitting changes...'); // Log the start of submission
        mainContent.style.display = 'none';
        secondaryContent.style.display = 'none';

        // Get fields to update for the active record
        const fieldsToUpdate = updatedFields[activeRecordId];

        // Handle specific updates, such as the 'sub' field, if present
        if (fieldsToUpdate['sub']) {
            await updateRecord(activeRecordId, { 'Subcontractor': fieldsToUpdate['sub'] });
        }

        // Remove the 'sub' field from updates and apply any remaining changes
        if (Object.keys(fieldsToUpdate).length > 0) {
            delete fieldsToUpdate['sub'];
            if (Object.keys(fieldsToUpdate).length > 0) {
                await updateRecord(activeRecordId, fieldsToUpdate);
            }
        }

        showToast('Changes submitted successfully!');
        console.log('Changes submitted successfully for record:', activeRecordId);

        // Reset tracking variables after successful submission
        updatedFields = {};
        hasChanges = false;
        activeRecordId = null;
        confirmationShown = false;
        hideSubmitButton();

        // Fetch updated data after submission
        await fetchAllData();
    } catch (error) {
        console.error('Error during submission:', error);
        showToast('Error submitting changes.');
        confirmationShown = false;
    } finally {
        // Re-display content and reset UI elements
        mainContent.style.display = 'block';
        secondaryContent.style.display = 'block';
        hideSubmitButton();
    }
}

    

let isSubmitting = false;

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
            const images = document.querySelectorAll('td:nth-child(7) .image-carousel img');
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
        
  function adjustButtonPosition() {
    const submitButton = document.getElementById('dynamic-submit-button');
    if (window.innerWidth < 576) {
        submitButton.style.fontSize = '14px';
        submitButton.style.padding = '10px';
    } else {
        submitButton.style.fontSize = '';
        submitButton.style.padding = '';
    }
}

window.addEventListener('resize', () => {
    adjustImageSize();
    adjustButtonPosition();
});

adjustImageSize();
adjustButtonPosition();
}); 

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

    document.querySelectorAll('input[type="checkbox"], select, td[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', function () {
            const closestRow = this.closest('tr'); 
            if (closestRow) { 
                const recordId = closestRow.dataset.id;
                checkForChanges(recordId);  
            } else {
                console.warn('No parent <tr> found for the element', this);
            }
        });
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
    const body = JSON.stringify({ fields });

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
            const errorData = await response.json();
            console.error(`Error updating record: ${response.status} ${response.statusText}`);
            console.error(`Error Details:`, errorData);
        } else {
            const successData = await response.json();
            console.log('Record updated successfully:', successData);
        }
    } catch (error) {
        console.error('Error occurred while updating record in Airtable:', error);
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