// Test script to verify Banner system integration
// Run with: node test-banner-integration.js

console.log('🧪 Testing Banner System Integration...\n');

// Test 1: Model Syntax
console.log('1️⃣  Testing Model Syntax...');
try {
  require('./src/models/Banner.js');
  console.log('   ✅ Banner.js syntax OK');
} catch (e) {
  console.error('   ❌ Banner.js error:', e.message);
  process.exit(1);
}

try {
  require('./src/models/BannerClick.js');
  console.log('   ✅ BannerClick.js syntax OK');
} catch (e) {
  console.error('   ❌ BannerClick.js error:', e.message);
  process.exit(1);
}

try {
  require('./src/models/BannerImpression.js');
  console.log('   ✅ BannerImpression.js syntax OK');
} catch (e) {
  console.error('   ❌ BannerImpression.js error:', e.message);
  process.exit(1);
}

// Test 2: Models Index Registration
console.log('\n2️⃣  Testing Models Registration...');
try {
  const models = require('./src/models/index.js');
  if (models.banner) {
    console.log('   ✅ banner model registered');
  } else {
    console.error('   ❌ banner model NOT registered');
    process.exit(1);
  }
  if (models.bannerClick) {
    console.log('   ✅ bannerClick model registered');
  } else {
    console.error('   ❌ bannerClick model NOT registered');
    process.exit(1);
  }
  if (models.bannerImpression) {
    console.log('   ✅ bannerImpression model registered');
  } else {
    console.error('   ❌ bannerImpression model NOT registered');
    process.exit(1);
  }
} catch (e) {
  console.error('   ❌ Models index error:', e.message);
  process.exit(1);
}

// Test 3: Routes Registration
console.log('\n3️⃣  Testing Routes Registration...');
try {
  const routes = require('./src/routes.js');
  const constants = require('./src/config/constants');
  const bannerRoute = constants.BASE_URL + '/banners';

  if (routes[bannerRoute]) {
    console.log('   ✅ /banners route registered at:', bannerRoute);
  } else {
    console.error('   ❌ /banners route NOT registered');
    console.log('   Available routes:', Object.keys(routes));
    process.exit(1);
  }
} catch (e) {
  console.error('   ❌ Routes error:', e.message);
  process.exit(1);
}

// Test 4: Controller Syntax
console.log('\n4️⃣  Testing Controller Syntax...');
try {
  const controllerFunc = require('./src/controllers/BannerController.js');
  if (typeof controllerFunc === 'function') {
    console.log('   ✅ BannerController.js exports function');
  } else {
    console.error('   ❌ BannerController.js does not export function');
    process.exit(1);
  }
} catch (e) {
  console.error('   ❌ BannerController.js error:', e.message);
  process.exit(1);
}

console.log('\n✨ All Integration Tests Passed!\n');
console.log('📋 Summary:');
console.log('   - 3 models created and registered');
console.log('   - 1 controller created');
console.log('   - 1 route endpoint registered');
console.log('   - No syntax errors found');
console.log('\n🚀 Ready for MongoDB connection and API testing');
console.log('   To test with running server:');
console.log('   1. Ensure MongoDB is running');
console.log('   2. Start server: node medics-care.js');
console.log('   3. Test endpoints with curl or Postman\n');
