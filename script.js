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

            allRecords.sort((a, b) => (a.fields['VanirOffice'] || '').localeCompare(b.fields['VanirOffice'] || ''));

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

        records.forEach(record => {
            const fields = record.fields;
            const row = document.createElement('tr');

            const fieldConfigs = [
                { field: 'Status', value: fields['Status'] || 'N/A' },
                { field: 'Branch', value: fields['Branch'] || 'N/A' },
                { field: 'Address', value: fields['Address'] || 'N/A' },
                { field: 'Calendar Link', value: fields['Calendar Link'] || 'N/A' },
                { field: 'Builder', value: fields['Builder'] || 'N/A' },
                { field: 'Picture(s) of Issue', value: fields['Picture(s) of Issue'] || 'N/A', editable: true },
                { field: 'Billable/ Non Billable', value: fields['Billable/ Non Billable'] || 'N/A', editable: true },
                { field: 'Lot Number and Community/Neighborhood', value: fields['Lot Number and Community/Neighborhood'] || 'N/A' },
                { field: 'StartDate', value: fields['StartDate'] || 'N/A', editable: true },
                { field: 'EndDate', value: fields['EndDate'] || 'N/A', editable: true },
                { field: 'description', value: fields['description'] || 'N/A' },
            ];

            fieldConfigs.forEach(({ field, value, editable = false }) => {
                const cell = document.createElement('td');
                cell.dataset.id = record.id;
                cell.dataset.field = field;

                if (field === 'Picture(s) of Issue' && Array.isArray(fields[field])) {
                    const images = fields[field].map(url => `<img src="${url}" alt="Issue Picture" style="max-width: 100px; height: auto;"/>`).join('');
                    cell.innerHTML = images;
                } else {
                    cell.textContent = value;
                }

                if (editable) {
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
