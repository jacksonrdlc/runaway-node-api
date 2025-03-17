const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Function to transform JSON data to table format
function transformData(record) {
    const transformedData = {
        external_id: record.id?.toString(),
        upload_id: record.upload_id,
        name: record.name,
        detail: record.description,
        distance: record.distance,
        moving_time: record.moving_time,
        elapsed_time: record.elapsed_time,
        high_elevation: record.elev_high,
        low_elevation: record.elev_low,
        total_elevation_gain: record.total_elevation_gain,
        start_date: record.start_date,
        start_date_local: record.start_date_local,
        time_zone: record.timezone,
        achievement_count: record.achievement_count || 0,
        kudos_count: record.kudos_count || 0,
        comment_count: record.comment_count || 0,
        athlete_count: record.athlete_count || 1,
        photo_count: record.photo_count || 0,
        total_photo_count: record.total_photo_count || 0,
        trainer: record.trainer || false,
        commute: record.commute || false,
        manual: record.manual || false,
        private: record.private || false,
        flagged: record.flagged || false,
        average_speed: record.average_speed,
        max_speed: record.max_speed,
        calories: record.calories,
        has_kudoed: record.has_kudoed || false,
        kilo_joules: record.kilojoules,
        average_power: record.average_watts,
        max_power: record.max_watts,
        device_watts: record.device_watts || false,
        has_heart_rate: record.has_heartrate || false,
        average_heart_rate: record.average_heartrate,
        max_heart_rate: record.max_heartrate
    };

    // Convert any undefined values to null
    Object.keys(transformedData).forEach(key => {
        if (transformedData[key] === undefined) {
            transformedData[key] = null;
        }
    });

    return transformedData;
}

async function importActivities() {
    console.log('Starting import process...');
    let successCount = 0;
    let errorCount = 0;

    try {
        // Read and parse the JSON file
        const jsonData = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'assets', 'activities.json'), 'utf8')
        );

        for (const record of jsonData) {
            const transformedData = transformData(record);

            try {
                const { data, error } = await supabase
                    .from('activities')
                    .insert([transformedData])
                    .select();

                if (error) {
                    console.error('Error inserting record:', error);
                    console.error('Data:', transformedData);
                    errorCount++;
                } else {
                    console.log('Successfully inserted activity:', transformedData.name);
                    successCount++;
                }

                // Add a small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error('Error processing record:', error);
                errorCount++;
            }
        }
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error);
        process.exit(1);
    }

    console.log(`Import completed!`);
    console.log(`Successfully imported: ${successCount} records`);
    console.log(`Failed to import: ${errorCount} records`);
}

// Run the import
importActivities().catch(console.error); 