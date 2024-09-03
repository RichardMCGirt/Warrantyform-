document.addEventListener('DOMContentLoaded', function () {
    const airtableApiKey = window.env.AIRTABLE_API_KEY;
    const airtableBaseId = window.env.AIRTABLE_BASE_ID;
    const airtableTableName = window.env.AIRTABLE_TABLE_NAME;
    let dropboxAccessToken;
    let dropboxAppKey;
    let dropboxAppSecret;
    let dropboxRefreshToken;

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
    let offsetX, offsetY;

    // Mouse down event to start dragging
// Event listeners for dragging the submit button
submitButton.addEventListener('mousedown', function (event) {
    let shiftX = event.clientX - submitButton.getBoundingClientRect().left;
    let shiftY = event.clientY - submitButton.getBoundingClientRect().top;

    function moveAt(pageX, pageY) {
        submitButton.style.left = pageX - shiftX + 'px';
        submitButton.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
    }

    document.addEventListener('mousemove', onMouseMove);

    document.addEventListener('mouseup', function () {
        document.removeEventListener('mousemove', onMouseMove);

        // Store the current position of the button in local storage
        localStorage.setItem('submitButtonTop', submitButton.style.top);
        localStorage.setItem('submitButtonLeft', submitButton.style.left);
    }, { once: true });
});

  // Function to show the submit button and keep it in the last position when a change is made
function showSubmitButton(recordId) {
    if (submitButton.style.display === 'none') {
        // Only set the button to the last known position if it hasn't been displayed yet
        const lastTop = localStorage.getItem('submitButtonTop') || '50%';
        const lastLeft = localStorage.getItem('submitButtonLeft') || '50%';
        submitButton.style.top = lastTop;
        submitButton.style.left = lastLeft;
    }

    submitButton.style.display = 'block';
    activeRecordId = recordId;
}

// Call the showSubmitButton function when a change is made
document.querySelectorAll('input, select, td[contenteditable="true"]').forEach(element => {
    element.addEventListener('input', () => showSubmitButton(activeRecordId));
    element.addEventListener('change', () => showSubmitButton(activeRecordId));
});

    // Fetch Dropbox credentials from Airtable
    async function fetchDropboxCredentials() {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        console.log('Fetching Dropbox credentials from Airtable...');
    
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
    
            console.log(`Response status: ${response.status}`);
    
            if (!response.ok) {
                throw new Error(`Error fetching Dropbox credentials: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
            console.log('Fetched Dropbox credentials:', data);
    
            for (const record of data.records) {
                if (record.fields) {
                    if (record.fields['Token Token']) {
                        dropboxAccessToken = record.fields['Token Token'];
                    }
                    if (record.fields['Dropbox App Key']) {
                        dropboxAppKey = record.fields['Dropbox App Key'];
                    }
                    if (record.fields['Dropbox App Secret']) {
                        dropboxAppSecret = record.fields['Dropbox App Secret'];
                    }
                    if (record.fields['Dropbox Token']) {
                        dropboxRefreshToken = record.fields['Dropbox Token'];
                    }
                }
            }
    
            if (!dropboxAccessToken || !dropboxAppKey || !dropboxAppSecret || !dropboxAccessToken) {
                console.error('Dropbox credentials not found in Airtable.');
            } else {
                console.log('Dropbox credentials successfully fetched and set.');
            }
        } catch (error) {
            console.error('Error fetching Dropbox credentials from Airtable:', error);
        }
    }
    
    // Refresh Dropbox token
    async function refreshDropboxToken() {
        console.log('Attempting to refresh Dropbox token...');
        console.log(`Using App Key: ${dropboxAppKey}, App Secret: ${dropboxAppSecret}, Refresh Token: ${dropboxAccessToken}`);
    
        if (!dropboxAppKey || !dropboxAppSecret || !dropboxAccessToken) {
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
            dropboxRefreshToken = data.access_token; // Update the access token with the new one
            console.log('Dropbox token refreshed successfully:', dropboxRefreshToken);
    
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
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching records: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
            console.log('Fetched records:', data);
    
            // Log each record's ID and fields for reference
            data.records.forEach(record => {
                console.log(`Record ID: ${record.id}, Fields: ${JSON.stringify(record.fields)}`);
            });
    
        } catch (error) {
            console.error('Error fetching records from Airtable:', error);
        }
    }
    
    fetchRecordsFromAirtable();
    
    
    // Update Dropbox token in Airtable
    async function updateDropboxTokenInAirtable(token) {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        console.log('Updating Dropbox token in Airtable...');
    
        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    records: [
                        {
                            id: 'actual_record_id_here', // Replace with actual record ID where the token is stored
                            fields: {
                                'Token Token': token
                            }
                        }
                    ]
                })
            });
    
            console.log(`Airtable update response status: ${response.status}`);
    
            if (!response.ok) {
                console.error(`Error updating Dropbox token in Airtable: ${response.status} ${response.statusText}`);
            } else {
                console.log('Dropbox token updated successfully in Airtable.');
            }
        } catch (error) {
            console.error('Error updating Dropbox token in Airtable:', error);
        }
    }

    fetchDropboxCredentials(); // Execute

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

            do {
                const data = await fetchData(offset);
                if (data.records.length === 0 && !offset) break;
                allRecords = allRecords.concat(data.records);
                offset = data.offset;
            } while (offset);

            const primaryRecords = allRecords.filter(record => record.fields['Status'] === 'Field Tech Review Needed');
            const secondaryRecords = allRecords.filter(record => record.fields['Status'] === 'Scheduled- Awaiting Field');

            primaryRecords.sort((a, b) => {
                const dateA = new Date(a.fields['StartDate']);
                const dateB = new Date(b.fields['StartDate']);

                if (dateA < dateB) return -1;
                if (dateA > dateB) return 1;

                return (a.fields['b'] || '').localeCompare(b.fields['b'] || '');
            });

            await displayData(primaryRecords, '#airtable-data');
            await displayData(secondaryRecords, '#feild-data', true);

            mainContent.style.display = 'block';
            secondaryContent.style.display = 'block';
            headerTitle.classList.add('visible');
            setTimeout(() => {
                mainContent.style.opacity = '1';
                secondaryContent.style.opacity = '1';
            }, 10);
        } catch (error) {
            console.error('Error fetching all data:', error);
        }
    }

    async function displayData(records, tableSelector, isSecondary = false) {
        const tbody = document.querySelector(`${tableSelector} tbody`);
        tbody.innerHTML = '';

        if (records.length === 0) return;

        const formatDateTime = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
            const formattedTime = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            return `${formattedDate} ${formattedTime}`;
        };

        records.forEach(record => {
            const fields = record.fields;
            const row = document.createElement('tr');

            const fieldConfigs = isSecondary ? [
                { field: 'b', value: fields['b'] || 'N/A', link: true },
                { field: 'Builders', value: fields['Builders'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A', directions: true },
                { field: 'Homeowner Name', value: fields['Homeowner Name'] || 'N/A' },
                { field: 'Lot Number and Community/Neighborhood', value: fields['Lot Number and Community/Neighborhood'] || 'N/A' },
                { field: 'description', value: fields['description'] ? fields['description'].replace(/<\/?[^>]+(>|$)/g, "") : 'N/A' },
                { field: 'StartDate', value: fields['StartDate'] ? formatDateTime(fields['StartDate']) : 'N/A' },
                { field: 'EndDate', value: fields['EndDate'] ? formatDateTime(fields['EndDate']) : 'N/A' },
                { field: 'Contact Email', value: fields['Contact Email'] || 'N/A', email: true },
                { field: 'Completed  Pictures', value: fields['Completed  Pictures'] || [], image: true, imageField: 'Completed  Pictures' },
                { field: 'DOW to be Completed', value: fields['DOW to be Completed'] || 'N/A', editable: true },
                { field: 'Job Completed', value: fields['Job Completed'] || false, checkbox: true } 

            ] : [
                { field: 'b', value: fields['b'] || 'N/A', link: true },
                { field: 'Builders', value: fields['Builders'] || 'N/A' },
                { field: 'Lot Number and Community/Neighborhood', value: fields['Lot Number and Community/Neighborhood'] || 'N/A' },
                { field: 'Homeowner Name', value: fields['Homeowner Name'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A', directions: true },
                { field: 'description', value: fields['description'] ? fields['description'].replace(/<\/?[^>]+(>|$)/g, "") : 'N/A' },
                { field: 'StartDate', value: fields['StartDate'] ? formatDateTime(fields['StartDate']) : 'N/A' },
                { field: 'EndDate', value: fields['EndDate'] ? formatDateTime(fields['EndDate']) : 'N/A' },
                { field: 'Contact Email', value: fields['Contact Email'] || 'N/A', email: true },
                { field: 'Picture(s) of Issue', value: fields['Picture(s) of Issue'] || [], image: true, link: true, imageField: 'Picture(s) of Issue' },
                { field: 'Materials Needed', value: fields['Materials Needed'] || 'N/A', editable: true },
                { field: 'Billable/ Non Billable', value: fields['Billable/ Non Billable'] || '', dropdown: true, options: ['Billable', 'Non Billable', ''] },
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
            
                if (image) {
                    const images = Array.isArray(fields[field]) ? fields[field] : [];
                    const carouselDiv = document.createElement('div');
                    carouselDiv.classList.add('image-carousel');
            
                    if (images.length > 0) {
                        let currentIndex = 0; // Initialize currentIndex
                        const imgElement = document.createElement('img');
                        imgElement.src = images[0].url;
                        imgElement.alt = "Issue Picture";
                        imgElement.style.maxWidth = '100%';
                        imgElement.style.height = 'auto';
                        imgElement.classList.add('carousel-image');
                        imgElement.onclick = () => openImageViewer(images, 0); // Add click event to open modal
                        carouselDiv.appendChild(imgElement);
            
                        const imageCount = document.createElement('div');
                        imageCount.classList.add('image-count');
                        imageCount.textContent = `1 of ${images.length}`;
                        carouselDiv.appendChild(imageCount);
            
                        let prevButton, nextButton; // Initialize navigation buttons
            
                        if (images.length > 1) {
                            // Create Previous Button
                            prevButton = document.createElement('button');
                            prevButton.textContent = '<';
                            prevButton.classList.add('carousel-nav-button', 'prev');
                            prevButton.onclick = () => {
                                currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                                imgElement.src = images[currentIndex].url;
                                imageCount.textContent = `${currentIndex + 1} of ${images.length}`;
                            };
            
                            // Create Next Button
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
            
                        // Add Delete Button for images
                        const deleteButton = document.createElement('button');
                        deleteButton.innerHTML = '🗑️'; // Trash can icon
                        deleteButton.classList.add('delete-button');
                        deleteButton.onclick = async () => {
                            const confirmed = confirm('Are you sure you want to delete this image?');
                            if (confirmed) {
                                // Animate image to trash can
                                animateImageToTrash(imgElement, deleteButton, async () => {
                                    await deleteImageFromAirtable(record.id, images[currentIndex].id, imageField);
                                    images.splice(currentIndex, 1);
                                    if (images.length > 0) {
                                        currentIndex = currentIndex % images.length; // Adjust index if needed
                                        imgElement.src = images[currentIndex].url;
                                        imageCount.textContent = `${currentIndex + 1} of ${images.length}`;
                                    } else {
                                        // Show "Add Photos" button when all images are deleted
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
                                });
                            }
                        };
                        carouselDiv.appendChild(deleteButton);
                    }
            
                    // Ensure the "Add Photos" button is always displayed
                    const addPhotoButton = document.createElement('button');
                    addPhotoButton.textContent = 'Add Photos';
                    addPhotoButton.onclick = () => {
                        fileInput.setAttribute('data-record-id', record.id);
                        fileInput.setAttribute('data-target-field', imageField);
                        fileInput.click();
                    };
                    carouselDiv.appendChild(addPhotoButton);
                    cell.appendChild(carouselDiv);
            
                    // Add keyboard navigation support
                    carouselDiv.tabIndex = 0;  // Make div focusable
                    carouselDiv.addEventListener('keydown', (event) => {
                        if (event.key === 'ArrowLeft' && prevButton) {
                            prevButton.click();
                        } else if (event.key === 'ArrowRight' && nextButton) {
                            nextButton.click();
                        }
                    });
            
                } else if (checkbox) {
                    const checkboxElement = document.createElement('input');
                    checkboxElement.type = 'checkbox';
                    checkboxElement.checked = value;
                    checkboxElement.classList.add('custom-checkbox');
            
                    // Ensure "Job Completed" checkbox is never disabled
                    if (field === 'Job Completed') {
                        checkboxElement.disabled = false;
                    } else {
                        // Disable other checkboxes if "Billable/ Non Billable" has no value
                        const billableCell = row.querySelector('td[data-field="Billable/ Non Billable"] select');
                        checkboxElement.disabled = !billableCell || !billableCell.value;
                    }
            
                    checkboxElement.addEventListener('change', function () {
                        const newValue = checkboxElement.checked;
                        updatedFields[record.id] = updatedFields[record.id] || {};
                        updatedFields[record.id][field] = newValue;
                        hasChanges = true;
                        showSubmitButton(record.id);
                    });
            
                    cell.appendChild(checkboxElement);
                } else if (dropdown) {
                    const select = document.createElement('select');
                    select.classList.add('styled-select');
                    options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;
                        optionElement.textContent = option;
            
                        if (field === 'Billable/ Non Billable') {
                            if (option === 'Billable') {
                                optionElement.style.backgroundColor = '#ffeb3b';
                                optionElement.style.color = '#000';
                            } else if (option === 'Non Billable') {
                                optionElement.style.backgroundColor = '#03a9f4';
                                optionElement.style.color = '#fff';
                            }
                        }
            
                        if (option === value) optionElement.selected = true;
                        select.appendChild(optionElement);
                    });
            
                    select.addEventListener('change', () => {
                        const newValue = select.value;
                        updatedFields[record.id] = updatedFields[record.id] || {};
                        updatedFields[record.id][field] = newValue;
                        hasChanges = true;
                        showSubmitButton(record.id);
            
                        // Enable or disable the checkbox based on the select value
                        const fieldReviewCheckbox = row.querySelector('input[type="checkbox"]');
                        if (fieldReviewCheckbox) {
                            fieldReviewCheckbox.disabled = !newValue;  // Disable if no value is selected
                        }
                    });
            
                    cell.appendChild(select);
                } else if (email) {
                    cell.innerHTML = value ? `<a href="mailto:${value}">${value}</a>` : 'N/A';
                } else if (directions) {
                    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(value)}`;
                    cell.innerHTML = value ? `<a href="${googleMapsUrl}" target="_blank">${value}</a>` : 'N/A';
                } else if (link) {
                    const matchingCalendar = calendarLinks.find(calendar => calendar.name === value);
                    if (matchingCalendar) {
                        cell.innerHTML = `<a href="${matchingCalendar.id}" target="_blank">${value}</a>`;
                    } else {
                        cell.textContent = value;
                    }
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
                            cell.classList.add('edited');
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
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
        const currentImages = await fetchCurrentImagesFromAirtable(recordId, imageField);

        const updatedImages = currentImages.filter(image => image.id !== imageId);
        const body = JSON.stringify({ fields: { [imageField]: updatedImages } });

        // Find the image element that matches the imageId
        const imageElement = document.querySelector(`img[src="${currentImages.find(img => img.id === imageId)?.url}"]`);
        const trashCan = document.querySelector('.trash-can');

        if (!imageElement || !trashCan) {
            console.error('Image element or trash can element not found.');
            return;
        }

        // Get the bounding rectangles for the image and trash can
        const imageRect = imageElement.getBoundingClientRect();
        const trashCanRect = trashCan.getBoundingClientRect();

        // Add animation to the image
        imageElement.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
        imageElement.style.transform = `translate(${trashCanRect.left - imageRect.left}px, ${trashCanRect.top - imageRect.top}px) scale(0)`;
        imageElement.classList.add('image-moving');

        setTimeout(async () => {
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
                    console.error(`Error deleting image from Airtable: ${response.status} ${response.statusText}`);
                } else {
                    console.log('Image successfully deleted from Airtable:', await response.json());
                    imageElement.classList.add('image-deleted');
                    showToast('Image successfully deleted!');
                    imageElement.remove(); // Remove image element from DOM
                }
            } catch (error) {
                console.error('Error deleting image from Airtable:', error);
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
        // Create the modal if it doesn't exist
        let imageViewerModal = document.getElementById('image-viewer-modal');
        if (!imageViewerModal) {
            imageViewerModal = document.createElement('div');
            imageViewerModal.id = 'image-viewer-modal';
            imageViewerModal.classList.add('image-viewer-modal');
            document.body.appendChild(imageViewerModal);

            const modalImage = document.createElement('img');
            modalImage.classList.add('modal-image');

            const closeModalButton = document.createElement('button');
            closeModalButton.textContent = 'X';
            closeModalButton.classList.add('close-modal-button');
            closeModalButton.onclick = () => {
                imageViewerModal.style.display = 'none';
            };

            const prevButton = document.createElement('button');
            prevButton.textContent = '<';
            prevButton.classList.add('modal-nav-button', 'prev');

            const nextButton = document.createElement('button');
            nextButton.textContent = '>';
            nextButton.classList.add('modal-nav-button', 'next');

            imageViewerModal.appendChild(closeModalButton);
            imageViewerModal.appendChild(prevButton);
            imageViewerModal.appendChild(modalImage);
            imageViewerModal.appendChild(nextButton);

            prevButton.onclick = () => {
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                updateModalImage();
            };

            nextButton.onclick = () => {
                currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                updateModalImage();
            };
        }

        let currentIndex = startIndex;
        let currentImagesArray = images;

        function updateModalImage() {
            const modalImage = document.querySelector('.modal-image');
            modalImage.src = currentImagesArray[currentIndex].url;
        }

        // Close modal on click outside or ESC key
        function closeModalOnOutsideClick(event) {
            if (event.target === imageViewerModal) {
                imageViewerModal.style.display = 'none';
                document.removeEventListener('click', closeModalOnOutsideClick);
            }
        }

        function closeModalOnEsc(event) {
            if (event.key === 'Escape') {
                imageViewerModal.style.display = 'none';
                document.removeEventListener('keydown', closeModalOnEsc);
            }
        }

        document.addEventListener('click', closeModalOnOutsideClick);
        document.addEventListener('keydown', closeModalOnEsc);

        updateModalImage();
        imageViewerModal.style.display = 'block';
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

    async function submitChanges() {
        if (!hasChanges || !activeRecordId) {
            showToast('No changes to submit.');
            return;
        }

        mainContent.style.display = 'none';
        secondaryContent.style.display = 'none';

        await updateRecord(activeRecordId, updatedFields[activeRecordId]);

        updatedFields = {};
        hasChanges = false;
        activeRecordId = null;
        submitButton.style.display = 'none';
        mainContent.style.display = 'block';
        secondaryContent.style.display = 'block';

        showToast('Changes submitted successfully!');
        fetchAllData();  // Refresh data after form submission
    }

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