document.addEventListener('DOMContentLoaded', function () {
    const airtableApiKey = window.env.AIRTABLE_API_KEY;
    const airtableBaseId = window.env.AIRTABLE_BASE_ID;
    const airtableTableName = window.env.AIRTABLE_TABLE_NAME;
    let dropboxAccessToken;

    console.log('Airtable Base ID:', airtableBaseId);
    console.log('Airtable Table Name:', airtableTableName);

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
    submitButton.style.position = 'absolute';
    submitButton.style.zIndex = '1000';
    document.body.appendChild(submitButton);

    // Function to fetch Dropbox token from Airtable
    async function fetchDropboxToken() {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;

        console.log(`Fetching Dropbox token from Airtable...`);
        console.log(`URL: ${url}`);
        console.log(`Authorization: Bearer ${airtableApiKey.substring(0, 5)}...`);

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });

            console.log(`Response Status: ${response.status}`);
            console.log(`Response Status Text: ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`Error fetching Dropbox token: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response Data:', data);

            for (const record of data.records) {
                console.log('Record ID:', record.id);
                console.log('Fields:', record.fields);

                if (record.fields && record.fields['Token Token']) {
                    dropboxAccessToken = record.fields['Token Token'];
                    console.log('Dropbox Access Token retrieved successfully:', dropboxAccessToken);
                    break;
                }
            }

            if (!dropboxAccessToken) {
                console.error('Dropbox token not found in Airtable.');
            }
        } catch (error) {
            console.error('Error fetching Dropbox token from Airtable:', error);
        }
    }

    // Call the function to execute
    fetchDropboxToken();

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

        if (files && files.length > 0 && recordId) {
            const filesArray = Array.from(files);
            await sendImagesToAirtableForRecord(filesArray, recordId);
            showSubmitButton(recordId);
            fetchAllData();  // Refresh data after images are uploaded
        } else {
            console.error('No files selected or record ID is missing.');
        }
    };

    async function sendImagesToAirtableForRecord(files, recordId) {
        if (!Array.isArray(files)) files = [files];

        const uploadedUrls = [];
        const currentImages = await fetchCurrentImagesFromAirtable(recordId);

        for (const file of files) {
            const dropboxUrl = await uploadFileToDropbox(file);
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
            const body = JSON.stringify({ fields: { 'Picture(s) of Issue': allImages } });

            console.log('Payload being sent to Airtable:', body);

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

    async function fetchCurrentImagesFromAirtable(recordId) {
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
            return data.fields['Picture(s) of Issue'] ? data.fields['Picture(s) of Issue'] : [];
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

            if (!response.ok) return null;

            const data = await response.json();
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
        console.log(`Creating shared link for file: ${filePath}`);
    
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
                    console.log('Shared link already exists, fetching existing link...');
                    return await getExistingDropboxLink(filePath);
                } else {
                    console.error(`Error creating shared link: ${response.status} ${response.statusText}`);
                    return null;
                }
            }
    
            const data = await response.json();
            console.log('Shared link created:', data);
            
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
        console.log(`Fetching existing shared link for file: ${filePath}`);
    
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
                console.log('Existing shared link fetched:', data.links[0]);
                
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
                { field: 'Completed  Pictures', value: fields['Completed  Pictures'] || [], image: true },
                { field: 'DOW to be Completed', value: fields['DOW to be Completed'] || 'N/A', editable: true },
                { field: 'Job Completed', value: fields['Job Completed'] || false, checkbox: true } // Checkbox for 'Job Completed'

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
                { field: 'Picture(s) of Issue', value: fields['Picture(s) of Issue'] || [], image: true, link: true },
                { field: 'Materials Needed', value: fields['Materials Needed'] || 'N/A', editable: true },
                { field: 'Billable/ Non Billable', value: fields['Billable/ Non Billable'] || '', dropdown: true, options: ['Billable', 'Non Billable'] },
                { field: 'Field Review Needed', value: fields['Field Review Needed'] || false, checkbox: true } // Checkbox for 'Field Review Needed'

            ];

            fieldConfigs.forEach(config => {
                const { field, value, checkbox, editable, link, image, dropdown, options, email, directions } = config;
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
                        let currentIndex = 0; // Define currentIndex here
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

                        let prevButton, nextButton; // Define prevButton and nextButton here

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

                        // Add Delete Button for images
                        const deleteButton = document.createElement('button');
                        deleteButton.innerHTML = '🗑️'; // Use trash can icon
                        deleteButton.classList.add('delete-button');
                        deleteButton.onclick = async () => {
                            const confirmed = confirm('Are you sure you want to delete this image?');
                            if (confirmed) {
                                await deleteImageFromAirtable(record.id, images[currentIndex].id);
                                images.splice(currentIndex, 1);
                                if (images.length > 0) {
                                    currentIndex = currentIndex % images.length; // Adjust index if needed
                                    imgElement.src = images[currentIndex].url;
                                    imageCount.textContent = `${currentIndex + 1} of ${images.length}`;
                                } else {
                                    // When all images are deleted, only show the "Add Photos" button
                                    carouselDiv.innerHTML = '';
                                    const addPhotoButton = document.createElement('button');
                                    addPhotoButton.textContent = 'Add Photos';
                                    addPhotoButton.onclick = () => {
                                        fileInput.setAttribute('data-record-id', record.id);
                                        fileInput.click();
                                    };
                                    carouselDiv.appendChild(addPhotoButton);
                                }
                            }
                        };
                        carouselDiv.appendChild(deleteButton);
                    }

                    // Ensure the "Add Photos" button is always displayed
                    const addPhotoButton = document.createElement('button');
                    addPhotoButton.textContent = 'Add Photos';
                    addPhotoButton.onclick = () => {
                        fileInput.setAttribute('data-record-id', record.id);
                        fileInput.click();
                    };
                    carouselDiv.appendChild(addPhotoButton);
                    cell.appendChild(carouselDiv);

                    // Add event listeners for keyboard navigation
                    carouselDiv.tabIndex = 0;  // Make div focusable
                    carouselDiv.addEventListener('keydown', (event) => {
                        if (event.key === 'ArrowLeft' && prevButton) {
                            prevButton.click();
                        } else if (event.key === 'ArrowRight' && nextButton) {
                            nextButton.click();
                        }
                    });

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
                    });

                    cell.appendChild(select);
                } else if (checkbox) {
                    const checkboxElement = document.createElement('input');
                    checkboxElement.type = 'checkbox';
                    checkboxElement.checked = value;
                    checkboxElement.classList.add('custom-checkbox');

                    // Center the checkbox in the second table
                    if (isSecondary) {
                        cell.style.textAlign = 'center';
                    }

                    checkboxElement.addEventListener('change', function () {
                        const newValue = checkboxElement.checked;
                        updatedFields[record.id] = updatedFields[record.id] || {};
                        updatedFields[record.id][field] = newValue;
                        hasChanges = true;
                        showSubmitButton(record.id);

                        if (field === 'Field Review Needed' && newValue) {
                            updatedFields[record.id]['Field Review Not Needed'] = false;
                        } else if (field === 'Field Review Not Needed' && newValue) {
                            updatedFields[record.id]['Field Review Needed'] = false;
                            updatedFields[record.id]['Status'] = 'Material Purchase Needed';
                        }
                    });

                    cell.appendChild(checkboxElement);
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

    async function deleteImageFromAirtable(recordId, imageId) {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
        const currentImages = await fetchCurrentImagesFromAirtable(recordId);

        const updatedImages = currentImages.filter(image => image.id !== imageId);

        const body = JSON.stringify({ fields: { 'Picture(s) of Issue': updatedImages } });

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
            }
        } catch (error) {
            console.error('Error deleting image from Airtable:', error);
        }
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

    submitButton.addEventListener('click', async () => {
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

    function showSubmitButton(recordId) {
        const recordRow = document.querySelector(`td[data-id="${recordId}"]`);
        if (recordRow) {
            const rowRect = recordRow.getBoundingClientRect();
            submitButton.style.top = `${window.scrollY + rowRect.top + 0}px`;
            submitButton.style.left = `${window.scrollX + rowRect.right + 2030}px`;
            submitButton.style.display = 'block';
            activeRecordId = recordId;
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
