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

    // Ensure the modal is hidden on page load
    modal.classList.remove('show');

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

            // Filter out records with 'unknown' in the Address field
            allRecords = allRecords.filter(record => record.fields['Address'] && record.fields['Address'].toLowerCase() !== 'unknown');

            allRecords.sort((a, b) => (a.fields['b'] || '').localeCompare(b.fields['b'] || ''));

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
                { field: 'Status', value: fields['Status'] || '', editable: true, dropdown: true, options: [
                    'Pending Review', 'Field Tech Review Needed', 'Material Purchase Needed', 
                    'Scheduled- Awaiting Field', 'Subcontractor To Pay', 'Ready for Invoicing', 
                    'Completed', 'Closed'
                ]},
                { field: 'b', value: fields['b'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A' },
                { field: 'Calendar Link', value: fields['Calendar Link'] || 'N/A', link: true },
                { field: 'Builders', value: fields['Builders'] || 'N/A' },
                { field: 'Picture(s) of Issue', value: fields['Picture(s) of Issue'] || '', image: true, editable: true },
                {
                    field: 'Billable/ Non Billable',
                    value: fields['Billable/ Non Billable'] || '', // Leave blank if no value
                    editable: true,
                    dropdown: true,
                    options: ['', 'Billable', 'Non Billable']
                },
                { field: 'Lot Number and Community/Neighborhood', value: fields['Lot Number and Community/Neighborhood'] || 'N/A' },
                {
                    field: 'StartDate',
                    value: fields['StartDate'] ? formatDateTime(fields['StartDate']) : 'N/A',
                    editable: true
                },
                {
                    field: 'EndDate',
                    value: fields['EndDate'] ? formatDateTime(fields['EndDate']) : 'N/A',
                    editable: true
                },
                {
                    field: 'description',
                    value: fields['description'] ? fields['description'].replace(/<\/?[^>]+(>|$)/g, "") : 'N/A'
                },
            ];
    
            fieldConfigs.forEach(({ field, value, editable = false, link = false, image = false, dropdown = false, options = [] }) => {
                const cell = document.createElement('td');
                cell.dataset.id = record.id;
                cell.dataset.field = field;
    
                if (dropdown) {
                    const select = document.createElement('select');
                    options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;
                        optionElement.textContent = option;
                        if (option === value) {
                            optionElement.selected = true;
                        }
                        select.appendChild(optionElement);
                    });
    
                    select.addEventListener('change', async () => {
                        const newValue = select.value;
                        console.log(`Updating ${field} for record ${record.id} to ${newValue}`); // Log the change
                        await updateRecord(record.id, { [field]: newValue });
                        showToast('Record updated successfully');
                    });
    
                    cell.appendChild(select);
                } else if (link) {
                    cell.innerHTML = value ? `<a href="${value}" target="_blank">${value}</a>` : 'N/A';
                } else if (image && Array.isArray(fields[field])) {
                    const images = fields[field].map(url => `<img src="${url}" alt="Issue Picture" style="max-width: 100px; height: auto;"/>`).join('');
                    cell.innerHTML = images;

                    if (editable) {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.style.display = 'block';
                        fileInput.addEventListener('change', async () => {
                            const file = fileInput.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = async (e) => {
                                    const newImageUrl = e.target.result;
                                    fields[field].push(newImageUrl); // Add new image to existing images
                                    await updateRecord(record.id, { [field]: fields[field] });
                                    showToast('Picture uploaded successfully');
                                };
                                reader.readAsDataURL(file);
                            }
                        });
                        cell.appendChild(fileInput);
                    }

                } else {
                    cell.textContent = value;
                }
    
                if (editable && !dropdown && !image) {
                    cell.setAttribute('contenteditable', 'true');
                    cell.addEventListener('click', () => {
                        modal.style.display = "flex"; // Show the modal
                        setTimeout(() => modal.classList.add('show'), 10); // Add animation class after a short delay
                    });
                }
    
                row.appendChild(cell);
            });
    
            tbody.appendChild(row);
        });
    
        console.log('Data displayed in table'); // Log when data is displayed
    }
    
    async function updateRecord(id, fields) {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${id}`;

        console.log('Updating record with ID:', id); // Log record ID being updated

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields })
            });

            if (!response.ok) {
                console.error(`Error updating record: ${response.status} ${response.statusText}`);
                return;
            }

            const updatedRecord = await response.json();
            console.log('Record updated:', updatedRecord); // Log updated record
            return updatedRecord;
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
        mainContent.style.display = 'none';

        const tbody = document.querySelector('#airtable-data tbody');
        const rows = tbody.querySelectorAll('tr');

        for (const row of rows) {
            const editableCell = row.querySelector('[contenteditable="true"]');
            if (editableCell && editableCell.classList.contains('edited')) {
                const recordId = editableCell.dataset.id;
                const newValue = editableCell.textContent;
                console.log(`Submitting change for record ${recordId}: ${newValue}`); // Log submission details
                await updateRecord(recordId, { 'Materials Needed': newValue });
                editableCell.classList.remove('edited');
            }
        }

        mainContent.style.display = 'block';

        showToast('Changes submitted successfully!');
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
