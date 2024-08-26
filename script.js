document.addEventListener('DOMContentLoaded', function () {
    const airtableApiKey = 'patXTUS9m8os14OO1.6a81b7bc4dd88871072fe71f28b568070cc79035bc988de3d4228d52239c8238';
    const airtableBaseId = 'appO21PVRA4Qa087I';
    const airtableTableName = 'tbl6EeKPsNuEvt5yJ';
    const dropboxAccessToken = 'sl.B7u2Cdp4Qf0QGteUiYnVOYzpV6ezapknwstGQNBvNv7dVhNCzyLjOEvW2pqpqIqygq4GUtiZS6MXLMYEf0_BazY30EU_40YXWvvXJgJoKx669YThnOQMXraLmEiUTGk3JG-L1BpJE4Q3_8PWM39agQ4'; // Replace with your Dropbox Access Token

    const loadingLogo = document.querySelector('.loading-logo');
    const mainContent = document.getElementById('main-content');
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

       // Create file input dynamically or select an existing file input
       const fileInput = document.createElement('input');
       fileInput.type = 'file';
       fileInput.id = 'file-input';
       fileInput.accept = 'image/*';
       fileInput.multiple = true; // Allow multiple file selection
   
       // Add the input to your DOM (for example, to a specific cell or container)
       document.body.appendChild(fileInput); // Adjust to your actual container
   
       // Add the event listener for file input changes
       fileInput.addEventListener('change', async function (event) {
           const files = event.target.files;
           if (files.length > 0) {
               await sendImagesToAirtableForRecord(files);
           }
       });

    // Function to upload image to Dropbox
   // Function to upload image to Dropbox
async function uploadImageToDropbox(file) {
    const url = 'https://content.dropboxapi.com/2/files/upload';
    const dropboxPath = `/images/${file.name}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${dropboxAccessToken}`,
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify({
                    path: dropboxPath,
                    mode: 'add',
                    autorename: true,
                    mute: false
                })
            },
            body: file
        });

        if (!response.ok) {
            const errorText = await response.text();  // Get the error response text
            console.error('Error uploading to Dropbox:', errorText); // Improved error logging
            return null;
        }

        const data = await response.json();
        console.log('Upload successful:', data); // Debugging: confirm successful upload
        return data.path_lower; // Return the path for further use
    } catch (error) {
        console.error('Error uploading to Dropbox:', error); // General error catch
        return null;
    }
}


   // Function to create a shareable link in Dropbox or retrieve existing one
async function createDropboxShareableLink(filePath) {
    // Step 1: Check for existing shared link
    const checkLinkUrl = 'https://api.dropboxapi.com/2/sharing/list_shared_links';

    try {
        const checkResponse = await fetch(checkLinkUrl, {
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

        const checkData = await checkResponse.json();
        if (checkResponse.ok && checkData.links.length > 0) {
            // A shared link already exists, use it
            console.log('Using existing shared link:', checkData.links[0].url);
            return checkData.links[0].url.replace('?dl=0', '?raw=1'); // Convert to direct download link
        }

        // Step 2: If no existing link, create a new one
        const createLinkUrl = 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings';
        const createResponse = await fetch(createLinkUrl, {
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

        if (createResponse.ok) {
            const createData = await createResponse.json();
            return createData.url.replace('?dl=0', '?raw=1'); // Convert to direct download link
        } else {
            console.error('Error creating shareable link on Dropbox:', createResponse.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error checking or creating Dropbox shareable link:', error);
        return null;
    }
}

    // Function to upload the image and send link to Airtable
    async function sendImageToAirtable(file) {
        // Step 1: Upload the image to Dropbox
        const dropboxFilePath = await uploadImageToDropbox(file);

        if (!dropboxFilePath) {
            console.error('Failed to upload image to Dropbox');
            return;
        }

        // Step 2: Create a shareable link to the uploaded image
        const dropboxLink = await createDropboxShareableLink(dropboxFilePath);

        if (!dropboxLink) {
            console.error('Failed to create Dropbox shareable link');
            return;
        }

        // Step 3: Send the direct download link to Airtable
        const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        const response = await fetch(airtableUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${airtableApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    'Picture(s) of Issue': [{ url: dropboxLink }]
                }
            })
        });

        if (response.ok) {
            console.log('Image link sent to Airtable successfully');
        } else {
            console.error('Error sending image link to Airtable:', response.statusText);
        }
    }

    async function fetchData(offset = null) {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        if (offset) url += `&offset=${offset}`;

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });

            if (!response.ok) {
                console.error(`Error fetching data: ${response.status} ${response.statusText}`);
                return { records: [] };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data from Airtable:', error);
            return { records: [] };
        }
    }

    async function fetchAllData() {
        mainContent.style.display = 'none';
    
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
    
            console.log(`Total records fetched: ${allRecords.length}`); // Log the number of records fetched
    
            // Filter out records with the exact Address "Unknown, Unknown, Unknown, Unknown" 
            // and only show records where the Status field is "Field Tech Review Needed"
            allRecords = allRecords.filter(record => {
                const address = record.fields['Address'];
                const status = record.fields['Status'];
                
                return (
                    address && address.toLowerCase() !== 'unknown, unknown, unknown, unknown' && 
                    status && status === 'Field Tech Review Needed'
                );
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set the time to midnight to compare only dates

            allRecords = allRecords.filter(record => {
                const endDate = new Date(record.fields['EndDate']);
                endDate.setHours(0, 0, 0, 0); // Set the time to midnight to compare only dates
                return endDate.getTime() >= today.getTime();
            });

            // Sort by StartDate first, then by field 'b'
            allRecords.sort((a, b) => {
                const dateA = new Date(a.fields['StartDate']);
                const dateB = new Date(b.fields['StartDate']);

                // Compare StartDate
                if (dateA < dateB) return -1;
                if (dateA > dateB) return 1;

                // If StartDate is the same, compare by field 'b'
                return (a.fields['b'] || '').localeCompare(b.fields['b'] || '');
            });

            await displayData(allRecords);

            mainContent.style.display = 'block';
            headerTitle.classList.add('visible');
            setTimeout(() => {
                mainContent.style.opacity = '1';
            }, 10);
    
        }, 1100);
    }

    async function displayData(records) {
        const tbody = document.querySelector('#airtable-data tbody');
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
            const fields = record.fields;
            const row = document.createElement('tr');
    
            const fieldConfigs = [
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
                { field: 'Billable/ Non Billable', value: fields['Billable/ Non Billable'] || '', dropdown: true, options: ['', 'Billable', 'Non Billable'] },
                { field: 'Field Review Needed', value: fields['Field Review Needed'] || false, checkbox: true },
                { field: 'Field Review Not Needed', value: fields['Field Review Not Needed'] || false, checkbox: true }
            ];
    
            fieldConfigs.forEach(({ field, value, checkbox = false, editable = false, link = false, image = false, dropdown = false, options = [], email = false, directions = false }) => {
                const cell = document.createElement('td');
                cell.dataset.id = record.id;
                cell.dataset.field = field;
                cell.style.wordWrap = 'break-word';
                cell.style.maxWidth = '200px';
                cell.style.position = 'relative'; // Ensure position relative for file input
    
                if (image && Array.isArray(fields[field])) {
                    const images = fields[field].map(img => img.url);
                    const carouselDiv = document.createElement('div');
                    carouselDiv.classList.add('image-carousel');
    
                    const imgElement = document.createElement('img');
                    imgElement.src = images[0];
                    imgElement.alt = "Issue Picture";
                    imgElement.style.maxWidth = '100px';
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
    
                   // Ensure file input is initialized properly for multi-file upload
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.id = 'file-input';
fileInput.accept = 'image/*';
fileInput.multiple = true; // Allow multiple files to be selected
fileInput.style.position = 'relative'; // Ensure file input is position relative
fileInput.style.marginTop = '10px'; // Add some spacing for visual clarity
fileInput.onchange = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
        for (const file of files) {
            await sendImageToAirtableForRecord(file, record.id); // Ensure the image is uploaded to the correct record
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
                                optionElement.style.backgroundColor = '#ffeb3b'; // yellow for Billable
                                optionElement.style.color = '#000'; // black text for Billable
                            } else if (option === 'Non Billable') {
                                optionElement.style.backgroundColor = '#03a9f4'; // light blue for Non Billable
                                optionElement.style.color = '#fff'; // white text for Non Billable
                            }
                        }
    
                        if (option === value) {
                            optionElement.selected = true;
                        }
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
    
        console.log('Data displayed in table');
    }
    
   // Function to upload multiple images and send the links to Airtable for a specific record
async function sendImagesToAirtableForRecord(files, recordId) {
    const uploadedFilePaths = [];
    for (const file of files) {
        // Step 1: Upload the image to Dropbox
        const dropboxFilePath = await uploadImageToDropbox(file);

        if (!dropboxFilePath) {
            console.error('Failed to upload image to Dropbox');
            continue;
        }

        // Step 2: Create a shareable link to the uploaded image
        const dropboxLink = await createDropboxShareableLink(dropboxFilePath);

        if (!dropboxLink) {
            console.error('Failed to create Dropbox shareable link');
            continue;
        }

        uploadedFilePaths.push({ url: dropboxLink });
    }

    if (uploadedFilePaths.length === 0) {
        console.error('No files were successfully uploaded.');
        return;
    }

    // Step 3: Send the direct download links to Airtable
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
    const response = await fetch(airtableUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                'Picture(s) of Issue': uploadedFilePaths
            }
        })
    });

    if (response.ok) {
        console.log('Image links sent to Airtable successfully');
        fetchAllData(); // Optionally refresh the table to show the updated images
    } else {
        console.error('Error sending image links to Airtable:', response.statusText);
    }
}

    

  async function updateRecord(id, fields) {
    const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${id}`;
    const formData = new FormData();

    // Check if there are new files to upload
    for (const [field, value] of Object.entries(fields)) {
        if (Array.isArray(value)) {
            value.forEach((file, index) => {
                if (file instanceof File) {
                    formData.append(`attachments[${field}][${index}]`, file);
                } else {
                    // If the value is not a file, ensure it is a valid attachment URL
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

        console.log('Record updated:', responseBody); // Log updated record
        return responseBody;
    } catch (error) {
        console.error('Error updating data in Airtable:', error);
    }
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

        for (const [recordId, fields] of Object.entries(updatedFields)) {
            await updateRecord(recordId, fields);
        }

        updatedFields = {}; // Clear the temporary storage
        hasChanges = false; // Reset the changes flag
        mainContent.style.display = 'block';

        showToast('Changes submitted successfully!');
        fetchAllData(); // Refresh data only if there were changes
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

    closeModal.onclick = function () {
        modal.classList.remove('show'); // Remove the animation class
        setTimeout(() => modal.style.display = "none", 300); // Hide the modal after the fade-out animation
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.classList.remove('show'); // Remove the animation class
            setTimeout(() => modal.style.display = "none", 300); // Hide the modal after the fade-out animation
        }
    };

    fetchAllData();

    // Event listener for file input change
    document.getElementById('file-input').addEventListener('change', async function (event) {
        const files = event.target.files;
        if (files.length > 0) {
            await sendImageToAirtable(files[0]);
        }
    });

});
