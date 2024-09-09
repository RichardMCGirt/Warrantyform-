document.addEventListener('DOMContentLoaded', function () {
    // Define your calendar links here
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

    // Function to validate date string
    function isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());  // Checks if the date is valid
    }

    // Function to populate the Google calendar iframe based on event data
    function populateCalendarWithEvent(eventData) {
        const { branch, address, startDate, endDate } = eventData;

        // Skip if any field is 'N/A'
        if (startDate === 'N/A' || address === 'N/A') {
            console.log('Skipping event with missing or invalid data:', eventData);
            return;  // Skip this event
        }

        // Validate startDate and endDate
        if (!isValidDate(startDate)) {
            console.error(`Invalid start date value: Start Date: ${startDate}`);
            alert("Invalid start date provided.");
            return;
        }

        // Handle missing or invalid end date by defaulting it to the start date
        const validEndDate = isValidDate(endDate) ? endDate : startDate;

        const formattedStartDate = new Date(startDate).toISOString().replace(/-|:|\.\d{3}/g, "");
        const formattedEndDate = new Date(validEndDate).toISOString().replace(/-|:|\.\d{3}/g, "");

        const calendarBaseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
        const calendarEventUrl = `${calendarBaseUrl}&text=Warranty+Service&dates=${formattedStartDate}/${formattedEndDate}&details=Warranty+service+scheduled&location=${encodeURIComponent(address)}&sf=true&output=xml`;

        // Log for debugging: Check if the event data is correctly passed
        console.log(`Event Data: ${JSON.stringify(eventData)}`);
        
        // Find the corresponding Google Calendar iframe for the selected branch
        const selectedCalendar = calendarLinks.find(calendar => calendar.name === branch);

        if (selectedCalendar) {
            const calendarIframe = document.getElementById('google-calendar-iframe');
            calendarIframe.src = calendarEventUrl;  // Update the calendar URL with the event details
            console.log(`Google Calendar populated for branch: ${branch} with event URL: ${calendarEventUrl}`);
        } else {
            console.error('Selected branch not found.');
        }
    }

    // Function to extract the data from the table row and populate the calendar
    function extractAndPopulateEvent(rowElement) {
        const branchElement = rowElement.querySelector('td:nth-child(1)');
        const addressElement = rowElement.querySelector('td:nth-child(5)');
        const startDateElement = rowElement.querySelector('td:nth-child(7)');
        const endDateElement = rowElement.querySelector('td:nth-child(8)');

        // Check if all elements exist before proceeding
        if (branchElement && addressElement && startDateElement) {
            const branch = branchElement.textContent.trim();
            const address = addressElement.textContent.trim();
            const startDate = startDateElement.textContent.trim();
            const endDate = endDateElement ? endDateElement.textContent.trim() : 'N/A';

            const eventData = {
                branch,
                address,
                startDate,
                endDate
            };

            // Populate the Google calendar
            populateCalendarWithEvent(eventData);
        } else {
            console.error('One or more required fields are missing in this row.');
        }
    }

    // Event listener for the populate calendar button
    document.getElementById('populate-calendar-button').addEventListener('click', function () {
        const selectedBranch = document.getElementById('branch-select').value;

        // Log selected branch for debugging
        console.log(`Selected Branch: ${selectedBranch}`);

        // Loop through both tables and populate calendar based on selected branch
        const allRows = document.querySelectorAll('#airtable-data tbody tr, #feild-data tbody tr');

        let foundRow = false;  // To track if any matching row is found

        allRows.forEach(row => {
            const branchElement = row.querySelector('td:nth-child(1)');  // First column in the row
            if (branchElement && branchElement.textContent.trim() === selectedBranch) {
                foundRow = true;
                console.log(`Matching row found for branch: ${selectedBranch}`);
                extractAndPopulateEvent(row);  // Populate calendar with the event details
            }
        });

        if (!foundRow) {
            console.log(`No matching events found for branch: ${selectedBranch}`);
        }
    });
});
