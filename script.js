// Load environment variables from .env file
const dotenv = ('dotenv');
console.log(process.env.AIRTABLE_API_KEY);

document.addEventListener('DOMContentLoaded', function () {
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableTableName = process.env.AIRTABLE_TABLE_NAME;
    const dropboxAccessToken = process.env.DROPBOX_ACCESS_TOKEN;

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
        const files = event.target.files;
        const recordId = event.target.getAttribute('data-record-id');

        if (files && files.length > 0 && recordId) {
            const filesArray = Array.from(files); // Convert FileList to Array
            await sendImagesToAirtableForRecord(filesArray, recordId);
            fetchAllData();  // Refresh data after images are uploaded
        } else {
            console.error('No files selected or record ID is missing.');
        }
    };

    async function sendImagesToAirtableForRecord(files, recordId) {
        if (!Array.isArray(files)) files = [files]; // Ensure files is an array

        const uploadedUrls = [];
        const currentImages = await fetchCurrentImagesFromAirtable(recordId);

        for (const file of files) {
            const dropboxUrl = await uploadFileToDropbox(file);
            if (dropboxUrl) {
                const formattedLink = dropboxUrl.replace('?dl=0', '?raw=1');
                uploadedUrls.push({ url: formattedLink }); // Use an array of objects with 'url' key
            } else {
                console.error('Error uploading file to Dropbox:', file.name);
            }
        }

        const allImages = currentImages.concat(uploadedUrls); // Combine existing images with new ones

        if (allImages.length > 0) {
            const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
            const body = JSON.stringify({ fields: { 'Picture(s) of Issue': allImages } });

            console.log('Payload being sent to Airtable:', body); // Log the payload for debugging

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
                    const errorResponse = await response.json(); // Read the error response body
                    console.error(`Error updating record: ${response.status} ${response.statusText}`, errorResponse);
                } else {
                    console.log('Successfully updated record in Airtable:', await response.json());
                    fetchAllData();  // Refresh data after successful update
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
            
            // Convert shared link to a direct link format
            return convertToDirectLink(data.url);
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
                
                // Convert shared link to a direct link format
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
    
    // Utility function to convert a Dropbox shared link to a direct link
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
                { field: 'Picture(s) of Issue', value: fields['Picture(s) of Issue'] || [], image: true },
                { field: 'DOW to be Completed', value: fields['DOW to be Completed'] || 'N/A', editable: true },
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
                { field: 'Billable/ Non Billable', value: fields['Billable/ Non Billable'] || '', dropdown: true, options: ['Billable', 'Non Billable'] }
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
                        const imgElement = document.createElement('img');
                        imgElement.src = images[0].url;
                        imgElement.alt = "Issue Picture";
                        imgElement.style.maxWidth = '100%';
                        imgElement.style.height = 'auto';
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
                                imgElement.src = images[currentIndex].url;
                                imageCount.textContent = `${currentIndex + 1} of ${images.length}`;
                            };

                            const nextButton = document.createElement('button');
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
                    }

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
                        if (event.key === 'ArrowLeft') {
                            prevButton.click();
                        } else if (event.key === 'ArrowRight') {
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
                    });

                    cell.appendChild(select);
                } else if (checkbox) {
                    const checkboxElement = document.createElement('input');
                    checkboxElement.type = 'checkbox';
                    checkboxElement.checked = value;
                    checkboxElement.classList.add('custom-checkbox');

                    checkboxElement.addEventListener('change', function () {
                        const newValue = checkboxElement.checked;
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
                        }
                    });
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });
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

    document.getElementById('submit-button').addEventListener('click', async () => {
        if (!hasChanges) {
            showToast('No changes to submit.');
            return;
        }

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
        fetchAllData();  // Refresh data after form submission
    });

    document.getElementById('search-input').addEventListener('input', function () {
        const searchValue = this.value.toLowerCase();
        const rows = document.querySelectorAll('#airtable-data tbody tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const match = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(searchValue));
            row.style.display = match ? '' : 'none';
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