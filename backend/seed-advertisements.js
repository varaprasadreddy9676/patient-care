const mongoose = require('mongoose');
const Constants = require('./src/config/constants');

// Connect to MongoDB
mongoose.connect(Constants.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
    seedAdvertisements();
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function seedAdvertisements() {
    try {
        // Load models the same way the app does
        const models = require('./src/models/index');
        const Advertisement = mongoose.model('Advertisement', models.advertisement);

        // Clear existing advertisements
        await Advertisement.remove({});
        console.log('Cleared existing advertisements');

        // Sample advertisements with actual base64 data
        const sampleAdvertisements = [
            {
                base64Image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                targetUrl: "https://example.com/ad1",
                isActive: true
            },
            {
                base64Image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                targetUrl: "https://example.com/ad2",
                isActive: true
            }
        ];

        // Insert sample advertisements
        const insertedAds = await Advertisement.create(sampleAdvertisements);
        console.log('Sample advertisements inserted:', insertedAds.length);

        console.log('Sample advertisement IDs:');
        insertedAds.forEach((ad, index) => {
            console.log(`${index + 1}. ID: ${ad._id}, Target: ${ad.targetUrl}`);
        });

        mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding advertisements:', error);
        mongoose.connection.close();
        process.exit(1);
    }
}