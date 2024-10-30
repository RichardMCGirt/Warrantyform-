// Airtable API credentials and table information
const apiKey = 'patXTUS9m8os14OO1.6a81b7bc4dd88871072fe71f28b568070cc79035bc988de3d4228d52239c8238';
const warrantiesBaseId = 'appO21PVRA4Qa087I';
const warrantiesTableId = 'tbl6EeKPsNuEvt5yJ';
const vendorsBaseId = 'appeNSp44fJ8QYeY5';
const vendorsTableId = 'tblLEYdDi0hfD9fT3';

// Function to fetch all records from the Warranties table
async function fetchAllWarrantyRecords() {
    const url = `https://api.airtable.com/v0/${warrantiesBaseId}/${warrantiesTableId}`;
    const options = {
        headers: { Authorization: `Bearer ${apiKey}` }
    };
    
    let records = [];
    let offset = null;

    do {
        console.log(`Fetching Warranties records with offset: ${offset || "none"}`);
        const response = await fetch(`${url}${offset ? `?offset=${offset}` : ''}`, options);
        const data = await response.json();

        if (data.records) {
            console.log(`Fetched ${data.records.length} records from Warranties table.`);
            records.push(...data.records);
        } else {
            console.warn("No records found in this request to the Warranties table.");
        }

        offset = data.offset; // Set the next offset if available
    } while (offset);

    console.log(`Total records fetched from Warranties table: ${records.length}`);
    return records;
}

// Function to fetch vendor data with emails from the Brick and Mortar Vendor Locations table
async function fetchVendorsWithEmails() {
    const url = `https://api.airtable.com/v0/${vendorsBaseId}/${vendorsTableId}`;
    const options = {
        headers: { Authorization: `Bearer ${apiKey}` }
    };
    
    let vendors = [];
    let offset = null;

    do {
        console.log(`Fetching Vendor records with offset: ${offset || "none"}`);
        const response = await fetch(`${url}${offset ? `?offset=${offset}` : ''}`, options);
        const data = await response.json();

        if (data.records) {
            console.log(`Fetched ${data.records.length} records from Vendor Locations table.`);
            vendors.push(...data.records.map(record => ({
                name: record.fields['Name'],
                email: record.fields['Email'],
                secondaryEmail: record.fields['Secondary Email'],
                returnEmail: record.fields['Return Email'],
                secondaryReturnEmail: record.fields['Secondary Return Email']
            })));
        } else {
            console.warn("No records found in this request to the Vendor Locations table.");
        }

        offset = data.offset; // Set the next offset if available
    } while (offset);

    console.log(`Total vendor records fetched: ${vendors.length}`);
    return vendors;
}

// Function to update the Warranties table with matched email information, overwriting or clearing emails if "Material Vendor" has changed
async function updateWarrantyEmails() {
    console.log("Starting to update Warranties with vendor email data...");
    const warranties = await fetchAllWarrantyRecords();
    const vendors = await fetchVendorsWithEmails();

    const vendorMap = vendors.reduce((map, vendor) => {
        map[vendor.name] = vendor; // Create a map with vendor names as keys for quick lookup
        return map;
    }, {});

    const updatePromises = warranties.map(async (warranty) => {
        const vendorName = warranty.fields['Material Vendor'];
        const matchedVendor = vendorMap[vendorName];

        let fieldsToUpdate = {};

        if (matchedVendor) {
            // Update email fields if they differ from the matched vendor’s data
            if (warranty.fields['Vendor Email'] !== matchedVendor.email) {
                fieldsToUpdate['Vendor Email'] = matchedVendor.email || '';
                console.log(`Updating 'Vendor Email' for warranty record ${warranty.id}`);
            }
            if (warranty.fields['Vendor Secondary Email'] !== matchedVendor.secondaryEmail) {
                fieldsToUpdate['Vendor Secondary Email'] = matchedVendor.secondaryEmail || '';
                console.log(`Updating 'Vendor Secondary Email' for warranty record ${warranty.id}`);
            }
            if (warranty.fields['Vendor Return Email'] !== matchedVendor.returnEmail) {
                fieldsToUpdate['Vendor Return Email'] = matchedVendor.returnEmail || '';
                console.log(`Updating 'Vendor Return Email' for warranty record ${warranty.id}`);
            }
            if (warranty.fields['Vendor Secondary Return Email'] !== matchedVendor.secondaryReturnEmail) {
                fieldsToUpdate['Vendor Secondary Return Email'] = matchedVendor.secondaryReturnEmail || '';
                console.log(`Updating 'Vendor Secondary Return Email' for warranty record ${warranty.id}`);
            }
        } else {
            // If "Material Vendor" is not found, clear email fields
            fieldsToUpdate = {
                'Vendor Email': '',
                'Vendor Secondary Email': '',
                'Vendor Return Email': '',
                'Vendor Secondary Return Email': ''
            };
            console.warn(`No match found for Material Vendor: ${vendorName}. Clearing email fields for warranty record ${warranty.id}.`);
        }

        // Proceed with the update only if there are fields to update
        if (Object.keys(fieldsToUpdate).length > 0) {
            try {
                const url = `https://api.airtable.com/v0/${warrantiesBaseId}/${warrantiesTableId}/${warranty.id}`;
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fields: fieldsToUpdate })
                });

                if (!response.ok) {
                    console.error(`Error updating warranty ${warranty.id}: ${response.statusText}`);
                } else {
                    console.log(`Successfully updated warranty ${warranty.id} with vendor emails or cleared fields.`);
                }
            } catch (error) {
                console.error(`Error updating warranty ${warranty.id}:`, error);
            }
        } else {
            console.log(`No updates needed for warranty record ${warranty.id}`);
        }
    });

    await Promise.all(updatePromises);
    console.log("All warranties updated with vendor emails, where necessary.");
}

// Execute the update function
updateWarrantyEmails().then(() => {
    console.log("Email update process completed.");
}).catch(error => {
    console.error("Error during email update process:", error);
});
