document.addEventListener('DOMContentLoaded', function () {
    const airtableApiKey = 'patXTUS9m8os14OO1.6a81b7bc4dd88871072fe71f28b568070cc79035bc988de3d4228d52239c8238';
    const airtableBaseId = 'appO21PVRA4Qa087I';
    const airtableTableName = 'tbl6EeKPsNuEvt5yJ';

    const loadingLogo = document.querySelector('.loading-logo');
    const mainContent = document.getElementById('main-content');
    const secondaryContent = document.getElementById('secoundary-content');
    const toast = document.getElementById('toast');
    const headerTitle = document.querySelector('h1');
    const modal = document.getElementById("materials-modal");
    const closeModal = document.querySelector(".close");

    const calendarLinks = [
        { id: 'https://calendar.google.com/calendar/embed?src=c_d113e252e0e5c8cfbf17a13149707a30d3c0fbeeff1baaac7a46940c2cc448ca%40group.calendar.google.com&ctz=America%2FToronto', name: 'Charleston' },
        { id: 'https://calendar.google.com/calendar/ical/c_03867438b82e5dfd8d4d3b6096c8eb1c715425fa012054cc95f8dea7ef41c79b%40group.calendar.google.com/public/basic.ics', name: 'Greensboro' },
        { id: 'https://calendar.google.com/calendar/embed?src=c_ad562073f4db2c47279af5aa40e53fc2641b12ad2497ccd925feb220a0f1abee%40group.calendar.google.com&ctz=America%2FToronto', name: 'Myrtle Beach' },
        { id: 'https://calendar.google.com/calendar/embed?src=c_45db4e963c3363676038697855d7aacfd1075da441f9308e44714768d4a4f8de%40group.calendar.google.com&ctz=America%2FToronto', name: 'Wilmington' },
        { id: 'https://calendar.google.com/calendar/embed?src=c_0476130ac741b9c58b404c737a8068a8b1b06ba1de2a84cff08c5d15ced54edf%40group.calendar.google.com&ctz=America%2FToronto', name: 'Greenville' },
        { id: 'https://calendar.google.com/calendar/embed?src=c_df033dd6c81bb3cbb5c6fdfd58dd2931e145e061b8a04ea0c13c79963cb6d515%40group.calendar.google.com&ctz=America%2FToronto', name: 'Columbia' },
        { id: 'https://calendar.google.com/calendar/embed?src=warranty%40vanirinstalledsales.com&ctz=America%2FToronto', name: 'Raleigh' }
    ];

    // Ensure the modal is hidden on page load
    modal.classList.remove('show');

    let updatedFields = {}; // Object to store updated values before submission
    let hasChanges = false; // Flag to track if any changes were made

    // Create file input dynamically
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'file-input';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.style.display = 'none'; // Hide initially

    // Append file input to the DOM so it is usable
    document.body.appendChild(fileInput);

    fileInput.onchange = async (event) => {
        console.log('File input changed.');
        const files = event.target.files; // This is a FileList
        const recordId = event.target.getAttribute('data-record-id'); // Fetch recordId from the input's dataset
    
        // Log the type and value of files and recordId for debugging
        console.log('Type of files:', typeof files);
        console.log('Files:', files);
        console.log('Type of recordId:', typeof recordId);
        console.log('Record ID:', recordId);
    
        if (files && files.length > 0 && recordId) {
            // Ensure `files` is an array and log its length
            const filesArray = Array.from(files); // Convert FileList to Array
            console.log('sendImagesToAirtableForRecord called with:', filesArray, recordId);
            console.log('Number of files selected:', filesArray.length);
            await sendImagesToAirtableForRecord(filesArray, recordId);
        } else {
            console.error('No files selected or record ID is missing.');
            if (!files || files.length === 0) {
                console.error('Files is not a valid FileList or is missing.');
                console.log('Actual value of files:', files);
            }
            if (!recordId) {
                console.error('Record ID is missing.');
                console.log('Actual value of recordId:', recordId);
            }
        }
    };

    async function sendImagesToAirtableForRecord(files, recordId) {
        console.log('Inside sendImagesToAirtableForRecord function.');
    
        if (!Array.isArray(files)) {
            console.log('Converting files to an array for consistency.');
            files = [files]; // If files is not an array, convert it to an array containing the single file
        }
    
        console.log('Type of files:', typeof files, 'Is Array:', Array.isArray(files), 'Files:', files);
        console.log('Record ID:', recordId, 'Type of recordId:', typeof recordId);
    
        if (!Array.isArray(files) || !recordId) {
            console.error('Files is not an array or record ID is missing.');
            console.log('Check failed - Files:', files, 'Record ID:', recordId);
            return;
        }
    
        console.log('Uploading images to Dropbox...');
    
        const uploadedUrls = [];
    
        // Fetch current images from Airtable
        const currentImages = await fetchCurrentImagesFromAirtable(recordId);
        console.log('Current images from Airtable:', currentImages);
    
        // Loop through files and upload them to Dropbox
        for (const file of files) {
            const dropboxUrl = await uploadFileToDropbox(file);
            if (dropboxUrl) {
                uploadedUrls.push({ url: dropboxUrl });
            } else {
                console.error('Error uploading file to Dropbox:', file.name);
            }
        }
    
        // Combine existing images with new uploaded images
        const allImages = currentImages.concat(uploadedUrls);
    
        if (allImages.length > 0) {
            console.log('Updating Airtable record with all file URLs:', allImages);
    
            const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
            const body = JSON.stringify({
                fields: {
                    'Picture(s) of Issue': allImages
                }
            });
    
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
                    const data = await response.json();
                    console.log('Successfully updated record in Airtable:', data);
                }
            } catch (error) {
                console.error('Error updating Airtable:', error);
            }
        } else {
            console.error('No files were uploaded to Dropbox, skipping Airtable update.');
        }
    }

    // Function to fetch current images from Airtable
    async function fetchCurrentImagesFromAirtable(recordId) {
        console.log('Fetching current images from Airtable for record:', recordId);
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
    
        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`
                }
            });
    
            if (!response.ok) {
                console.error(`Error fetching record: ${response.status} ${response.statusText}`);
                return [];
            }
    
            const data = await response.json();
            const currentImages = data.fields['Picture(s) of Issue'] || [];
            console.log('Fetched current images:', currentImages);
            return currentImages;
        } catch (error) {
            console.error('Error fetching current images from Airtable:', error);
            return [];
        }
    }
    
    // Function to upload a single file to Dropbox and return the file URL
    async function uploadFileToDropbox(file) {
        const dropboxUploadUrl = 'https://content.dropboxapi.com/2/files/upload';
        const path = `/${file.name}`;
        console.log(`Uploading file to Dropbox: ${path}`);
    
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
    
            if (!response.ok) {
                console.error(`Error uploading file to Dropbox: ${response.status} ${response.statusText}`);
                return null;
            }
    
            const data = await response.json();
            console.log('File uploaded to Dropbox:', data);
    
            // Get the shared link to the file
            const sharedLink = await getDropboxSharedLink(data.path_lower);
            return sharedLink;
        } catch (error) {
            console.error('Error uploading file to Dropbox:', error);
            return null;
        }
    }
    
    async function getDropboxSharedLink(filePath) {
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
                        requested_visibility: 'public'  // Ensure this is set to public
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
            return data.url.replace('?dl=0', '?raw=1'); // Convert the link to a direct download link
        } catch (error) {
            console.error('Error creating Dropbox shared link:', error);
            return null;
        }
    }
    
    async function getExistingDropboxLink(filePath) {
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
                return data.links[0].url.replace('?dl=0', '?raw=1'); // Convert the link to a direct download link
            } else {
                console.error('No existing shared link found.');
                return null;
            }
        } catch (error) {
            console.error('Error fetching Dropbox existing shared link:', error);
            return null;
        }
    }
    
    async function fetchData(offset = null) {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        if (offset) url += `&offset=${offset}`;

        console.log('Fetching data from Airtable, URL:', url);
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });

            if (!response.ok) {
                console.error(`Error fetching data: ${response.status} ${response.statusText}`);
                return { records: [] };
            }

            const data = await response.json();
            console.log('Fetched data:', data);
            return data;
        } catch (error) {
            console.error('Error fetching data from Airtable:', error);
            return { records: [] };
        }
    }

    async function fetchAllData() {
        console.log('Fetching all data...');
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
        
        setTimeout(async () => {
            let allRecords = [];
            let offset = null;
        
            try {
                do {
                    console.log('Fetching data with offset:', offset);
                    const data = await fetchData(offset);
                    if (data.records.length === 0 && !offset) {
                        console.log('No records found or no offset present.');
                        break;
                    }
                    allRecords = allRecords.concat(data.records);
                    offset = data.offset;
                } while (offset);
            } catch (error) {
                console.error('Error fetching all data:', error);
            }
        
            console.log(`Total records fetched: ${allRecords.length}`);
        
            // Filter records for primary table
            const filteredRecordsForPrimary = allRecords.filter(record => {
                const address = record.fields['Address'];
                const status = record.fields['Status'];
                
                const isValid = address && address.toLowerCase() !== 'unknown, unknown, unknown, unknown' && status && status === 'Field Tech Review Needed';
                console.log('Record filtering:', record.id, 'is valid:', isValid);
                return isValid;
            });
    
            // Filter records for secondary table
            const filteredRecordsForSecondary = allRecords.filter(record => record.fields['Status'] === 'Scheduled- Awaiting Field');
    
            const today = new Date();
            today.setHours(0, 0, 0, 0);
    
            const validRecords = filteredRecordsForPrimary.filter(record => {
                const endDate = new Date(record.fields['EndDate']);
                endDate.setHours(0, 0, 0, 0);
                const isValid = endDate.getTime() >= today.getTime();
                console.log('Checking end date for record:', record.id, 'is valid:', isValid);
                return isValid;
            });
    
            validRecords.sort((a, b) => {
                const dateA = new Date(a.fields['StartDate']);
                const dateB = new Date(b.fields['StartDate']);
    
                if (dateA < dateB) return -1;
                if (dateA > dateB) return 1;
    
                return (a.fields['b'] || '').localeCompare(b.fields['b'] || '');
            });
    
            console.log('Displaying primary data...');
            await displayData(validRecords, '#airtable-data');
            console.log('Displaying secondary data...');
            await displayData(filteredRecordsForSecondary, '#feild-data', true);
    
            mainContent.style.display = 'block';
            secondaryContent.style.display = 'block';
            headerTitle.classList.add('visible');
            setTimeout(() => {
                mainContent.style.opacity = '1';
                secondaryContent.style.opacity = '1';
            }, 10);
        
        }, 1100);
    }

    async function displayData(records, tableSelector, isSecondary = false) {
        console.log(`Displaying data for ${isSecondary ? 'secondary' : 'primary'} table. Number of records: ${records.length}`);
        const tbody = document.querySelector(`${tableSelector} tbody`);
        tbody.innerHTML = '';
    
        if (records.length === 0) {
            console.log('No records to display.');
            return;
        }
    
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
            console.log('Processing record:', record.id);
            const fields = record.fields;
            const row = document.createElement('tr');
    
            const fieldConfigs = isSecondary ? [
                { field: 'b', value: fields['b'] || 'N/A', link: true },
                { field: 'Builders', value: fields['Builders'] || 'N/A' },
                { field: 'Lot Number and Community/Neighborhood', value: fields['Lot Number and Community/Neighborhood'] || 'N/A', directions: true },
                { field: 'Homeowner Name', value: fields['Homeowner Name'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A' },
                { field: 'description', value: fields['description'] ? fields['description'].replace(/<\/?[^>]+(>|$)/g, "") : 'N/A' },
                { field: 'StartDate', value: fields['StartDate'] ? formatDateTime(fields['StartDate']) : 'N/A' },
                { field: 'EndDate', value: fields['EndDate'] ? formatDateTime(fields['EndDate']) : 'N/A' },
                { field: 'Contact Email', value: fields['Contact Email'] || 'N/A', email: true },
                { field: 'Picture(s) of Issue', value: fields['Picture(s) of Issue'] || '', image: true },
                {
                    field: 'Invoice Status',
                    value: fields['Invoice Status'] || 'Not Invoiced',
                    dropdown: true,
                    options: ['Not Invoiced', 'Invoiced'],
                },
                { field: 'Job Invoiced', value: fields['Job Invoiced'] || false, checkbox: true },
                { field: 'Subcontractor Paid', value: fields['Subcontractor Paid'] || false, checkbox: true },
                { field: 'DOW to be Completed', value: fields['DOW to be Completed'] || 'N/A',editable: true },
            ] : [
                { field: 'b', value: fields['b'] || 'N/A', link: true },
                { field: 'Builders', value: fields['Builders'] || 'N/A' },
                { field: 'Lot Number and Community/Neighborhood', value: fields['Lot Number and Community/Neighborhood'] || 'N/A', directions: true },
                { field: 'Homeowner Name', value: fields['Homeowner Name'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A' },
                { field: 'description', value: fields['description'] ? fields['description'].replace(/<\/?[^>]+(>|$)/g, "") : 'N/A' },
                { field: 'StartDate', value: fields['StartDate'] ? formatDateTime(fields['StartDate']) : 'N/A' },
                { field: 'EndDate', value: fields['EndDate'] ? formatDateTime(fields['EndDate']) : 'N/A' },
                { field: 'Contact Email', value: fields['Contact Email'] || 'N/A', email: true },
                { field: 'Picture(s) of Issue', value: fields['Picture(s) of Issue'] || '', image: true },
                { field: 'Materials Needed', value: fields['Materials Needed'] || 'N/A', editable: true },
                {
                    field: 'Billable/ Non Billable',
                    value: fields['Billable/ Non Billable'] || '',
                    dropdown: true,
                    options: ['Billable', 'Non Billable'],
                },
                { field: 'Field Review Needed', value: fields['Field Review Needed'] || false, checkbox: true },
                { field: 'Field Review Not Needed', value: fields['Field Review Not Needed'] || false, checkbox: true }
            ];

            fieldConfigs.forEach(({ field, value, checkbox = false, editable = false, link = false, image = false, dropdown = false, options = [], email = false, directions = false }) => {
                console.log('Creating table cell for field:', field, 'with value:', value);
                const cell = document.createElement('td');
                cell.dataset.id = record.id;
                cell.dataset.field = field;
                cell.style.wordWrap = 'break-word';
                cell.style.maxWidth = '200px';
                cell.style.position = 'relative';
    
                if (image && Array.isArray(fields[field])) {
                    const images = fields[field].map(img => img.url);
                    console.log('Displaying image carousel for record:', record.id, 'with images:', images);
                    const carouselDiv = document.createElement('div');
                    carouselDiv.classList.add('image-carousel');
    
                    const imgElement = document.createElement('img');
                    imgElement.src = images[0];
                    imgElement.alt = "Issue Picture";
                    imgElement.style.maxWidth = '100%';
                    imgElement.style.height = '100%';
                    imgElement.classList.add('carousel-image');
                    carouselDiv.appendChild(imgElement);
    
                    const imageCount = document.createElement('div');
                    imageCount.classList.add('image-count');
                    imageCount.textContent = `1 of ${images.length}`;
                    carouselDiv.appendChild(imageCount);
    
                    if (images.length > 1) {
                        let currentIndex = 0;
    
                        const prevButton = document.createElement('button');
                        prevButton.textContent = '<';
                        prevButton.classList.add('carousel-nav-button', 'prev');
                        prevButton.onclick = () => {
                            currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                            imgElement.src = images[currentIndex];
                            imageCount.textContent = `${currentIndex + 1} of ${images.length}`;
                        };
    
                        const nextButton = document.createElement('button');
                        nextButton.textContent = '>';
                        nextButton.classList.add('carousel-nav-button', 'next');
                        nextButton.onclick = () => {
                            currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                            imgElement.src = images[currentIndex];
                            imageCount.textContent = `${currentIndex + 1} of ${images.length}`;
                        };
    
                        carouselDiv.appendChild(prevButton);
                        carouselDiv.appendChild(nextButton);
                    }
    
                    cell.appendChild(carouselDiv);
    
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.id = 'file-input';
                    fileInput.accept = 'image/*';
                    fileInput.multiple = true;
                    fileInput.style.position = 'relative';
                    fileInput.style.marginTop = '10px';
                    fileInput.onchange = async (event) => {
                        console.log('File input change detected for record:', record.id);
                        const files = event.target.files;
                        if (files.length > 0) {
                            for (const file of files) {
                                await sendImagesToAirtableForRecord(file, record.id);
                            }
                        }
                    };
                    cell.appendChild(fileInput);
    
                } else if (email) {
                    cell.innerHTML = value ? `<a href="mailto:${value}">${value}</a>` : 'N/A';
                } else if (directions) {
                    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(value)}`;
                    cell.innerHTML = value ? `<a href="${googleMapsUrl}" target="_blank">${value}</a>` : 'N/A';
                } else if (field === 'b') {
                    const matchingCalendar = calendarLinks.find(calendar => calendar.name === value);
                    if (matchingCalendar) {
                        value = `<a href="${matchingCalendar.id}" target="_blank">${value}</a>`;
                        cell.innerHTML = value;
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
    
                        if (option === value) {
                            optionElement.selected = true;
                        }
                        select.appendChild(optionElement);
                    });
    
                    select.addEventListener('change', () => {
                        const newValue = select.value;
                        console.log('Dropdown value changed for record:', record.id, 'field:', field, 'new value:', newValue);
                        updatedFields[record.id] = updatedFields[record.id] || {};
                        updatedFields[record.id][field] = newValue;
                        hasChanges = true;
                    });
    
                    cell.appendChild(select);
                } else if (checkbox) {
                    const checkboxElement = document.createElement('input');
                    checkboxElement.type = 'checkbox';
                    checkboxElement.checked = value;
                    checkboxElement.classList.add('custom-checkbox');
    
                    checkboxElement.addEventListener('change', function () {
                        const newValue = checkboxElement.checked;
                        console.log('Checkbox value changed for record:', record.id, 'field:', field, 'new value:', newValue);
                        updatedFields[record.id] = updatedFields[record.id] || {};
                        updatedFields[record.id][field] = newValue;
                        hasChanges = true;
    
                        if (field === 'Field Review Needed' && newValue) {
                            updatedFields[record.id]['Field Review Not Needed'] = false;
                        } else if (field === 'Field Review Not Needed' && newValue) {
                            updatedFields[record.id]['Field Review Needed'] = false;
                            updatedFields[record.id]['Status'] = 'Material Purchase Needed';
                        }
                    });
    
                    cell.appendChild(checkboxElement);
                } else if (link) {
                    cell.innerHTML = value ? `<a href="${value}" target="_blank">${value}</a>` : 'N/A';
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
                            console.log('Cell content changed for record:', record.id, 'field:', field, 'new value:', newValue);
                            updatedFields[record.id] = updatedFields[record.id] || {};
                            updatedFields[record.id][field] = newValue;
                            cell.classList.add('edited');
                            hasChanges = true;
                        }
                    });
                }
    
                row.appendChild(cell);
            });
    
            tbody.appendChild(row);
        });
    
        console.log(`Data displayed in ${isSecondary ? 'secondary' : 'primary'} table`);
    }

    async function updateRecord(id, fields) {
        console.log('Updating record:', id, 'with fields:', fields);
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${id}`;
        const formData = new FormData();
    
        for (const [field, value] of Object.entries(fields)) {
            if (Array.isArray(value)) {
                value.forEach((file, index) => {
                    if (file instanceof File) {
                        formData.append(`attachments[${field}][${index}]`, file);
                    } else {
                        if (typeof file === 'string' && file.startsWith('http')) {
                            formData.append(`attachments[${field}]`, file);
                        } else {
                            console.error(`Invalid file format for field "${field}"`);
                        }
                    }
                });
            } else {
                formData.append(field, value);
            }
        }
    
        try {
            console.log('Sending request to Airtable:', url, formData);
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`
                },
                body: formData
            });
    
            const responseBody = await response.json();
            console.log('Response from Airtable:', responseBody);
    
            if (!response.ok) {
                console.error(`Error updating record: ${response.status} ${response.statusText}`, responseBody);
                return;
            }
    
            console.log('Record updated successfully:', responseBody);
            return responseBody;
        } catch (error) {
            console.error('Error updating data in Airtable:', error);
        }
    }
    
    function showToast(message) {
        console.log('Showing toast message:', message);
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

    document.getElementById('submit-button').addEventListener('click', async () => {
        console.log('Submit button clicked.');
        if (!hasChanges) {
            showToast('No changes to submit.');
            return;
        }

        console.log('Submitting changes to Airtable...');
        mainContent.style.display = 'none';
        secondaryContent.style.display = 'none';

        for (const [recordId, fields] of Object.entries(updatedFields)) {
            await updateRecord(recordId, fields);
        }

        updatedFields = {};
        hasChanges = false;
        mainContent.style.display = 'block';
        secondaryContent.style.display = 'block';

        showToast('Changes submitted successfully!');
        fetchAllData();
    });

    document.getElementById('search-input').addEventListener('input', function () {
        const searchValue = this.value.toLowerCase();
        console.log('Search input changed. Value:', searchValue);
        const rows = document.querySelectorAll('#airtable-data tbody');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const match = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(searchValue));
            console.log('Row match:', match);
            row.style.display = match ? '' : 'none';
        });
    });

    closeModal.onclick = function () {
        console.log('Closing modal.');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = "none", 300);
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            console.log('Window click detected outside modal, closing modal.');
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = "none", 300);
        }
    };

    console.log('Initial data fetch.');
    fetchAllData();
});
