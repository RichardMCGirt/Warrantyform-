document.addEventListener('DOMContentLoaded', function () {
    const airtableApiKey = 'patXTUS9m8os14OO1.6a81b7bc4dd88871072fe71f28b568070cc79035bc988de3d4228d52239c8238';
    const airtableBaseId = 'appO21PVRA4Qa087I';
    const airtableTableName = 'tbl6EeKPsNuEvt5yJ';

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

    async function fetchData(offset = null) {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        if (offset) url += `&offset=${offset}`;

        console.log('Fetching data from:', url); // Log URL for debugging

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });

            if (!response.ok) {
                console.error(`Error fetching data: ${response.status} ${response.statusText}`);
                return { records: [] };
            }

            const data = await response.json();
            console.log('Data fetched:', data); // Log fetched data
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
                { 
                    field: 'Lot Number and Community/Neighborhood', 
                    value: fields['Lot Number and Community/Neighborhood'] || 'N/A', 
                    directions: true 
                },
                { field: 'Homeowner Name', value: fields['Homeowner Name'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A' },
                { 
                    field: 'description',
                    value: fields['description'] ? fields['description'].replace(/<\/?[^>]+(>|$)/g, "") : 'N/A' 
                },
                { 
                    field: 'StartDate',
                    value: fields['StartDate'] ? formatDateTime(fields['StartDate']) : 'N/A' 
                },
                { 
                    field: 'EndDate',
                    value: fields['EndDate'] ? formatDateTime(fields['EndDate']) : 'N/A' 
                },
                { 
                    field: 'Contact Email', 
                    value: fields['Contact Email'] || 'N/A', 
                    email: true 
                },
                { field: 'Picture(s) of Issue', value: fields['Picture(s) of Issue'] || '', image: true },
                { field: 'Materials Needed', value: fields['Materials Needed'] || 'N/A', editable: true },
                { 
                    field: 'Billable/ Non Billable',
                    value: fields['Billable/ Non Billable'] || '',
                    editable: true,
                    dropdown: true,
                    options: ['', 'Billable', 'Non Billable']
                },
                { 
                    field: 'Field Review Needed', 
                    value: fields['Field Review Needed'] || false, 
                    checkbox: true 
                },
                { 
                    field: 'Field Review Not Needed', 
                    value: fields['Field Review Not Needed'] || false, 
                    checkbox: true 
                }
            ];
    
            fieldConfigs.forEach(({ field, value, checkbox = false, editable = false, link = false, image = false, dropdown = false, options = [], email = false, directions = false }) => {
                const cell = document.createElement('td');
                cell.dataset.id = record.id;
                cell.dataset.field = field;
                cell.style.wordWrap = 'break-word';
                cell.style.maxWidth = '200px';
    
                if (image && Array.isArray(fields[field])) {
                    const imageUrl = fields[field][0].url;
                    if (imageUrl) {
                        const imgElement = document.createElement('img');
                        imgElement.src = imageUrl;
                        imgElement.alt = "Issue Picture";
                        imgElement.style.maxWidth = '100px';
                        imgElement.style.height = 'auto';
                        imgElement.classList.add('zoomable-image');
                        cell.appendChild(imgElement);
                    } else {
                        console.error('Image URL is invalid or undefined:', imageUrl);
                    }
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
                        
                        // Apply colors based on option value
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
    
                    // Store the selected value in the updatedFields object
                    select.addEventListener('change', () => {
                        const newValue = select.value;
                        updatedFields[record.id] = updatedFields[record.id] || {};
                        updatedFields[record.id][field] = newValue;
                        hasChanges = true; // Mark as changed
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
                        hasChanges = true; // Mark as changed

                        // Store desired state changes only if user clicks submit
                        if (field === 'Field Review Needed' && newValue) {
                            updatedFields[record.id]['Field Review Not Needed'] = false; // Plan to uncheck if "Field Review Needed" is checked
                        } else if (field === 'Field Review Not Needed' && newValue) {
                            updatedFields[record.id]['Field Review Needed'] = false; // Plan to uncheck "Field Review Needed" if "Field Review Not Needed" is checked
                            updatedFields[record.id]['Status'] = 'Material Purchase Needed'; // Plan to set status
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
                    cell.classList.add('editable-cell'); // Add a class for custom styling if needed
                
                    // Track original content to detect changes
                    const originalContent = cell.textContent;
                
                    cell.addEventListener('blur', () => {
                        const newValue = cell.textContent;
                        if (newValue !== originalContent) {
                            updatedFields[record.id] = updatedFields[record.id] || {};
                            updatedFields[record.id][field] = newValue;
                            cell.classList.add('edited');
                            hasChanges = true; // Mark as changed
                        }
                    });
                }
                
                row.appendChild(cell);
            });
    
            tbody.appendChild(row);
        });
    
        console.log('Data displayed in table');
    }

    async function updateRecord(id, fields) {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${id}`;

        console.log('Updating record with ID:', id); // Log record ID being updated
        console.log('Data being sent to Airtable:', JSON.stringify({ fields }));

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields })
            });

            const responseBody = await response.json();

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
});
