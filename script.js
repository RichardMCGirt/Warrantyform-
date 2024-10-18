document.addEventListener('DOMContentLoaded', async function () {
    const airtableApiKey = window.env.AIRTABLE_API_KEY;
    const airtableBaseId = window.env.AIRTABLE_BASE_ID;
    const airtableTableName = window.env.AIRTABLE_TABLE_NAME;
    let dropboxAccessToken;
    let dropboxAppKey;
    let dropboxAppSecret;
    let dropboxRefreshToken;
    let debounceTimeout = null; // Declare debounce timer in the global scope


    
    // Fetch Dropbox credentials from Airtable
 fetchDropboxCredentials();

    // Check Dropbox token validity on page startup
    checkDropboxTokenValidity();

        // Function to check if Dropbox token is still valid
        async function checkDropboxTokenValidity() {
            console.log('Checking if Dropbox token is still valid...');
        
            if (!dropboxAccessToken) {
                console.error('Dropbox access token is not available.');
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
                    responseData = await response.json();  // Capture the response data
                } else {
                    responseData = await response.text();  // If not JSON, capture as plain text
                }
        
                if (response.ok) {
                    console.log('Dropbox token is still valid.');
                } else if (response.status === 401) {
                    console.error('Dropbox token is expired or invalid.');
                    await refreshDropboxToken();  // Call your token refresh function
                } else {
                    console.error(`Error while checking Dropbox token: ${response.status} ${response.statusText}`);
                    console.log('Response data:', responseData);  // Log detailed error message
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
    

    

    // Function to show the submit button and keep it in the last position when a change is made
    function showSubmitButton(recordId) {
        if (hasChanges) {  // Only show the button if there are changes
            if (submitButton.style.display === 'none') {
                const lastTop = localStorage.getItem('submitButtonTop') || '50%';
                const lastLeft = localStorage.getItem('submitButtonLeft') || '50%';
                submitButton.style.top = lastTop;
                submitButton.style.left = lastLeft;
            }
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
        console.log('Starting fetchDropboxCredentials function');
        console.log('Airtable URL:', url);
        console.log('Fetching Dropbox credentials from Airtable...');

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });

            console.log(`Response received from Airtable with status: ${response.status}`);

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
                console.log('Processing record:', JSON.stringify(record, null, 2));
            
                if (record.fields) {
                    if (record.fields['Dropbox Token']) {
                        dropboxAccessToken = record.fields['Dropbox Token'];
                        console.log('Dropbox Token found:', dropboxAccessToken);
                    }
                    if (record.fields['Dropbox App Key']) {
                        dropboxAppKey = record.fields['Dropbox App Key'];
                        console.log('Dropbox App Key found:', dropboxAppKey);
                    }
                    if (record.fields['Dropbox App Secret']) {
                        dropboxAppSecret = record.fields['Dropbox App Secret'];
                        console.log('Dropbox App Secret found:', dropboxAppSecret);
                    }
                    // Corrected lines below
                    if (record.fields['Dropbox Refresh Token']) {  // Correct this to match your field name
                        dropboxRefreshToken = record.fields['Dropbox Refresh Token'];  // Use the correct field name
                        console.log('Dropbox Refresh Token found:', dropboxRefreshToken);
                    }
                } else {
                    console.log('No fields found in this record:', record);
                }
            }
            
            

            // Log the final state of credentials
            console.log('Final Dropbox Access Token:', dropboxAccessToken);
            console.log('Final Dropbox App Key:', dropboxAppKey);
            console.log('Final Dropbox App Secret:', dropboxAppSecret);
            console.log('Final Dropbox Refresh Token:', dropboxRefreshToken);

            if (!dropboxAccessToken || !dropboxAppKey || !dropboxAppSecret || !dropboxRefreshToken) {
                console.error('One or more Dropbox credentials are missing after fetching.');
            } else {
                console.log('All Dropbox credentials successfully fetched and set.');
            }
        } catch (error) {
            console.error('Error occurred during fetchDropboxCredentials:', error);
        }
    }

    async function refreshDropboxToken() {
        console.log('Attempting to refresh Dropbox token...');
        console.log(`Using App Key: ${dropboxAppKey}, App Secret: ${dropboxAppSecret}, Refresh Token: ${dropboxRefreshToken}`);

        if (!dropboxAppKey || !dropboxAppSecret || !dropboxRefreshToken) {
            console.error('Dropbox credentials are not available.');
            return;
        }

        const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';

        const headers = new Headers();
        headers.append('Authorization', 'Basic ' + btoa(`${dropboxAppKey}:${dropboxAppSecret}`));
        headers.append('Content-Type', 'application/x-www-form-urlencoded');

        const body = new URLSearchParams();
        body.append('grant_type', 'refresh_token');
        body.append('refresh_token', dropboxRefreshToken);

        console.log('Sending request to Dropbox for token refresh...');
        console.log(`Request Body: ${body.toString()}`);

        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: headers,
                body: body
            });

            console.log(`Dropbox token refresh response status: ${response.status}`);

            if (!response.ok) {
                const errorResponse = await response.json();
                console.error(`Error refreshing Dropbox token: ${response.status} ${response.statusText}`, errorResponse);
                return;
            }

            const data = await response.json();
            dropboxAccessToken = data.access_token; // Update the access token with the new one
            console.log('Dropbox token refreshed successfully:', dropboxAccessToken);

            // Update the new token in Airtable
            await updateDropboxTokenInAirtable(dropboxAccessToken);
            console.log('Dropbox token refreshed and updated in Airtable.');
        } catch (error) {
            console.error('Error refreshing Dropbox token:', error);
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

        try {
            const allRecords = await fetchRecordsFromAirtable(); // Make sure this fetches all necessary records
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

        } catch (error) {
            console.error('Error updating Dropbox token in Airtable:', error);
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
        const currentImages = await fetchCurrentImagesFromAirtable(recordId, targetField);

        for (const file of files) {
            let dropboxUrl = await uploadFileToDropbox(file);
            if (!dropboxUrl) {
                // Refresh token if upload fails due to token expiration
                await refreshDropboxToken();
                dropboxUrl = await uploadFileToDropbox(file);
            }

            if (dropboxUrl) {
                const formattedLink = dropboxUrl.replace('?dl=0', '?raw=1');
                uploadedUrls.push({ url: formattedLink });
            } else {
                console.error('Error uploading file to Dropbox:', file.name);
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
                    const errorResponse = await response.json();
                    console.error(`Error updating record: ${response.status} ${response.statusText}`, errorResponse);
                } else {
                    console.log('Successfully updated record in Airtable:', await response.json());
                }
            } catch (error) {
                console.error('Error updating Airtable:', error);
            }
        } else {
            console.error('No files were uploaded to Dropbox, skipping Airtable update.');
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
        if (!dropboxAccessToken) {
            console.error('Dropbox Access Token is not available.');
            return null;
        }

        const dropboxUploadUrl = 'https://content.dropboxapi.com/2/files/upload';
        const path = `/${file.name}`;
        console.log(`Uploading file to Dropbox: ${file.name}`);

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

                // Check for expired access token error
                if (errorResponse.error && errorResponse.error['.tag'] === 'expired_access_token') {
                    console.log('Access token expired. Refreshing token...');
                    await refreshDropboxToken();

                    // Retry the upload after refreshing the token
                    return await uploadFileToDropbox(file);
                }

                return null;
            }

            const data = await response.json();
            console.log('File uploaded to Dropbox successfully:', data);

            return await getDropboxSharedLink(data.path_lower);
        } catch (error) {
            console.error('Error uploading file to Dropbox:', error);
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
                return { records: [] };
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching data from Airtable:', error);
            return { records: [] };
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
    
    
    let subOptions = []; // Declare subOptions globally

    async function fetchAllData() {
        mainContent.style.display = 'none';
        secondaryContent.style.display = 'none';
    
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
    
            // Fetch sub options (assuming it's fetched from another Airtable table or source)
            try {
                subOptions = await fetchAirtableSubOptionsFromDifferentTable() || [];
            } catch (error) {
                console.error('Error fetching sub options:', error);
                subOptions = []; // Continue with an empty subOptions array
            }
    
            do {
                const data = await fetchData(offset);
                if (data.records.length === 0 && !offset) break;
                allRecords = allRecords.concat(data.records);
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
    
       
    
            // Display the primary and secondary records in your tables
            await displayData(primaryRecords, '#airtable-data', false, subOptions);
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
        const currentValues = updatedFields[recordId] || {};
    
        // Check if there are any changes compared to the original values
        const fieldsHaveChanged = Object.keys(currentValues).some(field => {
            const currentValue = currentValues[field];
            const originalValue = originalValues[recordId] ? originalValues[recordId][field] : undefined;
    
            return currentValue !== originalValue; // True if the current value differs from the original
        });
    
        hasChanges = fieldsHaveChanged; // Update hasChanges flag based on the comparison
        if (!hasChanges) {
            hideSubmitButton();  // Hide the button if no changes detected
        }
    }
    

    
    // Event listeners to detect changes
    document.querySelectorAll('input, select, td[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', function () {
            const recordId = this.closest('tr').dataset.id;
            checkForChanges(recordId); // Check if changes exist
        });
    
        element.addEventListener('change', function () {
            const recordId = this.closest('tr').dataset.id;
            checkForChanges(recordId); // Check if changes exist
        });
    
        element.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                submitChanges(); // Call submitChanges on Enter key press
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
                console.error(`Error fetching subcontractor options: ${response.status} ${response.statusText}`);
                break;
            }
    
            const data = await response.json();
            records = records.concat(data.records);  // Append new records
            offset = data.offset;  // Airtable pagination: set offset for next batch
        } while (offset);
    
        // Add logging for detailed inspection of records
        console.log('Fetched subcontractor records:', records);
    
        // Extract subcontractor options
        const subOptions = Array.from(new Set(records.map(record => {
            // Log the exact structure of each record's fields to troubleshoot the branch issue
            console.log('Inspecting record fields:', record.fields);
    
            return {
                name: record.fields['Subcontractor Company Name'] || 'Unnamed Subcontractor',
                vanirOffice: record.fields['Vanir Branch'] || 'Unknown Branch'  // Log and handle missing branches
            };
        }).filter(Boolean)));
    
        console.log('Final subcontractor options with branches:', subOptions);  // Log the final options
    
        return subOptions;  // Return the subcontractor options array
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
                { field: 'Completed Pictures', value: fields['Completed Pictures'] || [], image: true, imageField: 'Completed Pictures' },
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
                { field: 'Billable/ Non Billable', value: fields['Billable/ Non Billable'] || '', dropdown: true, options: ['Billable', 'Non Billable'] },
                { field: 'Billable Reason (If Billable)', value: fields['Billable Reason (If Billable)'] || '', dropdown: true, options: ['Another Trade Damaged Work', 'Homeowner Damage', 'Weather'] },
                { field: 'Field Tech Reviewed', value: fields['Field Tech Reviewed'] || false, checkbox: true },
                { field: 'sub', value: fields['sub'] || '', dropdown: true, options: subOptions },
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
            
                    // Only filter subcontractor options based on Vanir Branch for the 'sub' field
                    let filteredOptions = [];
                    if (field === 'sub') {
                        const vanirBranchValue = fields['b'];  // Get Vanir Branch value for filtering
                        console.log(`[Record ID: ${record.id}] Vanir Branch: ${vanirBranchValue}`);
                        
                        filteredOptions = subOptions.filter(sub => sub.vanirOffice === vanirBranchValue);
            
                        if (filteredOptions.length === 0) {
                            console.warn(`[Record ID: ${record.id}] No subcontractors found for Vanir Branch: "${vanirBranchValue}".`);
                        }
                    } else {
                        // For non-'sub' fields, use the provided hardcoded options
                        filteredOptions = options;
                    }
            
                    console.log(`Filtered Options for Field "${field}" (Vanir Branch: ${fields['b']}):`, filteredOptions);
            
        // Custom placeholder for each field
        let placeholderText = 'Select an Option...'; // Default placeholder
        if (field === 'sub') {
            placeholderText = 'Select a Subcontractor...';
        } else if (field === 'Billable/ Non Billable') {
            placeholderText = 'Select Billable Status...';
        } else if (field === 'Billable Reason (If Billable)') {
            placeholderText = 'Select a Reason...';
        }
                   
        // Ensure the first option is always a placeholder (empty)
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = placeholderText;
        select.appendChild(emptyOption);

            
                    // Sort the filtered options alphabetically
                    filteredOptions.sort((a, b) => {
                        const nameA = a.name ? a.name.toLowerCase() : a.toLowerCase();  // Ensure valid comparison for both cases
                        const nameB = b.name ? b.name.toLowerCase() : b.toLowerCase();
                        return nameA.localeCompare(nameB);
                    });
            
                    // Add the filtered and sorted options to the dropdown
                    filteredOptions.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.name || option;  // Ensure compatibility with both hardcoded and dynamic options
                        optionElement.textContent = option.name || option;
            
                        // Pre-select if it matches the current value
                        if (option.name === value || option === value) {
                            optionElement.selected = true;
                        }
            
                        select.appendChild(optionElement);
                    });
            
                    // Append the select element to the cell
                    cell.appendChild(select); 
            
                    // Detect changes and handle state updates
                    select.addEventListener('change', () => {
                        const newValue = select.value;
                        updatedFields[record.id] = updatedFields[record.id] || {};
                        updatedFields[record.id][field] = newValue;
                        hasChanges = true;
            
                        showSubmitButton(record.id);
            
                        const fieldReviewCheckbox = row.querySelector('input[type="checkbox"]');
                        if (fieldReviewCheckbox) {
                            fieldReviewCheckbox.disabled = (newValue === "");
                            fieldReviewCheckbox.checked = false;
                        }
                    });
    
                      // Initially disable checkbox if placeholder is selected
                const fieldReviewCheckbox = row.querySelector('input[type="checkbox"]');
                if (fieldReviewCheckbox && value === "") {
                    fieldReviewCheckbox.disabled = true;
                    fieldReviewCheckbox.checked = false;
                }

                cell.appendChild(select);
            }

    
                // Handle images
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
    
                        // Delete button for images
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
    
           // Handle checkboxes
else if (checkbox) {
    const checkboxElement = document.createElement('input');
    checkboxElement.type = 'checkbox';
    checkboxElement.checked = value;
    checkboxElement.classList.add('custom-checkbox');

    // Handle disabling based on the dropdown's value for specific fields
    if (field === 'Job Completed') {
        const dropdownField = row.querySelector('select[data-field="sub"]'); // Target the 'sub' field dropdown
        if (dropdownField && dropdownField.value === "") {
            checkboxElement.disabled = true; // Disable if no subcontractor is selected
            checkboxElement.checked = false;
        }
    }

    // For the "Subcontractor Not Needed" checkbox
    if (field === 'Subcontractor Not Needed') {
        const subcontractorDropdown = row.querySelector('select[data-field="sub"]'); // Target the 'sub' field dropdown
        if (subcontractorDropdown && subcontractorDropdown.value !== "Select a Subcontractor...") {
            checkboxElement.disabled = true; // Disable if a subcontractor other than "Select a Subcontractor..." is selected
            checkboxElement.checked = false; // Uncheck if a subcontractor is selected
        } else {
            checkboxElement.disabled = false; // Enable if "Select a Subcontractor..." is selected
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

    
                // Handle text and links
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
    
                // Handle editable text cells
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
    
        // Remove the image with the specific ID from the array
        const updatedImages = currentImages.filter(image => image.id !== imageId);
    
        // If no images are left, send an empty array to Airtable
        const body = JSON.stringify({ fields: { [imageField]: updatedImages.length > 0 ? updatedImages : [] } });
    
        // Add animation for the image deletion
        const imageElement = document.querySelector(`img[src="${currentImages.find(img => img.id === imageId)?.url}"]`);
        const trashCan = document.querySelector('.trash-can');
    
        if (!imageElement || !trashCan) {
            console.error('Image element or trash can element not found.');
            return;
        }
    
        // Get bounding rectangles for the image and trash can
        const imageRect = imageElement.getBoundingClientRect();
        const trashCanRect = trashCan.getBoundingClientRect();
    
        // Animate the image to the trash can
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
    
                    // Remove the image element after successful deletion
                    imageElement.remove();
    
                    // Refresh the data to reflect the changes
                    await fetchAllData();
                }
            } catch (error) {
                console.error('Error updating record in Airtable:', error);
            }
        }, 800); // Delay to match the animation duration
    }
    
    

    function animateImageToTrash(imgElement, trashCan, callback) {
        const imageRect = imgElement.getBoundingClientRect();
        const trashRect = trashCan.getBoundingClientRect();

        imgElement.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
        imgElement.style.transform = `translate(${trashRect.left - imageRect.left}px, ${trashRect.top - imageRect.top}px) scale(0)`;

        imgElement.addEventListener('transitionend', () => {
            callback(); // Execute the callback function after animation
        });
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
            modalImage.id = 'modal-image'; // Add an ID for easier reference
            imageViewerModal.appendChild(modalImage);
    
            const closeModalButton = document.createElement('button');
            closeModalButton.textContent = 'X';
            closeModalButton.classList.add('close-modal-button');
            closeModalButton.onclick = () => closeModal(); // Close modal when 'X' is clicked
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
    
     // Get the modal and image elements
const modalImage = document.getElementById('modalImage');

// Function to close the modal
function closeModal() {
    imageViewerModal.style.display = 'none';
    enablePageScrolling();
    document.removeEventListener('keydown', handleKeyNavigation); // Remove the keydown listener
}

// Function to close modal when clicking outside the image
imageViewerModal.addEventListener('click', function(event) {
    if (event.target === imageViewerModal) { // Check if clicked outside the image
        closeModal();
    }
});
       
    
        updateModalImage();
        imageViewerModal.style.display = 'flex'; // Ensure the modal is shown
    
        // Add keyboard navigation support
        function handleKeyNavigation(event) {
            if (event.key === 'ArrowLeft') {
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                updateModalImage();
            } else if (event.key === 'ArrowRight') {
                currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                updateModalImage();
            } else if (event.key === 'Escape') {
                closeModal(); // Close modal when 'Esc' is pressed
            }
        }
    
        // Listen for keydown events to navigate with arrow keys and close with Esc
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
    function hideSubmitButton() {
        const submitButton = document.getElementById('dynamic-submit-button');
        if (submitButton) {
            submitButton.style.display = 'none'; // Hide the submit button
        }
        activeRecordId = null;
        hasChanges = false; // Reset changes flag
    }
    
// Flag to prevent multiple submissions
let isSubmitting = false;

// Function to handle submission with single confirmation
async function submitChanges() {
    if (isSubmitting) {
        return;  // Prevent further submissions while one is in progress
    }

    if (!hasChanges || !activeRecordId) {
        showToast('No changes to submit.');
        hideSubmitButton();  // Hide the button if no changes detected
        return;
    }

    // Set flag to indicate that submission is in progress
    isSubmitting = true;

    // Show confirmation once before proceeding
    const userConfirmed = confirm("Are you sure you want to submit these changes?");
    if (!userConfirmed) {
        showToast('Submission canceled.');
        isSubmitting = false;  // Reset flag if user cancels
        return;  // Exit if user doesn't confirm
    }

    // Proceed with the submission
    try {
        mainContent.style.display = 'none';
        secondaryContent.style.display = 'none';

        // Submit the changes for the active record
        await updateRecord(activeRecordId, updatedFields[activeRecordId]);

        // Reset the state after submission
        updatedFields = {};
        hasChanges = false;
        activeRecordId = null;

        showToast('Changes submitted successfully!');
    } catch (error) {
        console.error('Error during submission:', error);
        showToast('Error submitting changes.');
    } finally {
        isSubmitting = false;  // Reset the flag after completion
        hideSubmitButton();
        mainContent.style.display = 'block';
        secondaryContent.style.display = 'block';
        fetchAllData();  // Optionally refresh the data after submission
    }
}

    // Event listener for dynamic submit button
submitButton.addEventListener('click', function () {
    // Ensure that submitChanges is called only once
    if (!isSubmitting) {
        submitChanges();
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
    
   // Global variables
let originalValues = {};  // Store the original values
let updatedFields = {};   // Track changes made by the user
let hasChanges = false;   // Track if there are any unsaved changes
let activeRecordId = null;  // Track the current active record

        
// Function to check if the current values are different from the original values
function checkForChanges(recordId) {
    const currentValues = updatedFields[recordId] || {};

    // Check if any fields have changed compared to the original values
    const fieldsHaveChanged = Object.keys(currentValues).some(field => {
        const currentValue = currentValues[field];
        const originalValue = originalValues[recordId] ? originalValues[recordId][field] : undefined;

        return currentValue !== originalValue; // True if the current value differs from the original
    });

    // Update hasChanges flag based on whether fields have changed
    hasChanges = fieldsHaveChanged;

    if (!hasChanges) {
        hideSubmitButton();  // Hide the button if no changes detected
    } else {
        showSubmitButton(recordId);  // Show the button if there are changes
    }
}
        
// Function to handle input or change events
function handleInputChange(event) {
    const recordId = this.closest('tr').dataset.id;
    const field = this.dataset.field;

    // Update the changed value in the updatedFields object
    updatedFields[recordId] = updatedFields[recordId] || {};
    updatedFields[recordId][field] = this.value || this.textContent;

    checkForChanges(recordId);  // Check if there are changes after the update
}

// Attach event listeners to input fields
document.querySelectorAll('input, select, td[contenteditable="true"]').forEach(element => {
    element.addEventListener('input', handleInputChange);  // For real-time input changes
    element.addEventListener('change', handleInputChange);  // For dropdowns and checkboxes
});
     
        
        // Function to show the submit button
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
           
       // Reset updatedFields and hide submit button if the user undoes all changes
function resetChanges(recordId) {
    delete updatedFields[recordId];
    checkForChanges(recordId);
}      

  // Adjust button size and position dynamically
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

// Add resize event listener
window.addEventListener('resize', () => {
    adjustImageSize();
    adjustButtonPosition();
});

// Call functions on initial load
adjustImageSize();
adjustButtonPosition();
});
    
    

document.querySelectorAll('input, select, td[contenteditable="true"]').forEach(element => {
    element.addEventListener('input', () => {
        if (hasChanges) {
            showSubmitButton(activeRecordId);
        } else {
            hideSubmitButton();
        }
    });

    element.addEventListener('change', () => {
        if (hasChanges) {
            showSubmitButton(activeRecordId);
        } else {
            hideSubmitButton();
        }
    });

    element.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default Enter behavior
            if (hasChanges) {
                showSubmitButton(activeRecordId);
            } else {
                hideSubmitButton();
            }
            submitChanges(); // Call submitChanges on Enter key press
        }
    });
});

document.addEventListener('DOMContentLoaded', async function () {
    let debounceTimeout = null; // Declare debounce timer

    // Function to handle delayed submit
    function handleDelayedSubmit(recordId) {
        clearTimeout(debounceTimeout); // Clear previous timeout if exists
        debounceTimeout = setTimeout(() => {
            if (hasChanges) {
                submitChanges();  // Submit changes after the 3-second delay
            }
        }, 3000); // Delay of 3 seconds (3000 milliseconds)
    }

    // Modify the input event listener for text inputs to delay submission
    document.querySelectorAll('input[type="text"], td[contenteditable="true"]').forEach(element => {
        if (element.id !== 'search-input') {  // Exclude the search input box
            element.addEventListener('input', function () {
                const recordId = this.closest('tr').dataset.id;
                checkForChanges(recordId);  // Check for any changes
                if (hasChanges) {
                    showSubmitButton(recordId);  // Show the submit button
                    handleDelayedSubmit(recordId);  // Call the delayed submit handler
                } else {
                    hideSubmitButton();  // Hide the button if no changes
                }
            });
        }
    });

    // Existing change event listener for select, checkboxes, etc.
    document.querySelectorAll('input[type="checkbox"], select, td[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', function () {
            const closestRow = this.closest('tr'); // Save closest row to a variable
            if (closestRow) {  // Check if the closest <tr> exists
                const recordId = closestRow.dataset.id;
                checkForChanges(recordId);  // Check for any changes
            } else {
                console.warn('No parent <tr> found for the element', this);
            }
        });
    });
    

    // Existing enter key listener for immediate submission on pressing enter
    document.querySelectorAll('td[contenteditable="true"], input[type="text"]').forEach(element => {
        element.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && element.id !== 'search-input') {
                event.preventDefault();
                submitChanges();  // Submit immediately on enter key press
            }
        });
    });

    // Fetch all data or other existing logic here
    fetchAllData();
});



// Assuming dynamic buttons are added to a container
const dynamicButtonsContainer = document.createElement('div');
dynamicButtonsContainer.classList.add('dynamic-buttons-container'); // Add the class to the container

// Add the dynamically created submit button to this container
dynamicButtonsContainer.appendChild(submitButton);

// Add the container to the body or wherever it should be displayed
document.body.appendChild(dynamicButtonsContainer);


    // Event listener for dynamic submit button
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
                console.error(`Error updating record: ${response.status} ${response.statusText}`);
            } else {
                console.log('Record updated successfully:', await response.json());
            }
        } catch (error) {
            console.error('Error updating record in Airtable:', error);
        }
    }

    document.getElementById('search-input').addEventListener('input', function () {
        const searchValue = this.value.toLowerCase();

        // Search in both tables
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