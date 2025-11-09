const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'controllers');

// Controllers to process
const controllers = [
  'AuditTrailController.js',
  'CityController.js',
  'CustomerIssueController.js',
  'AttachmentController.js',
  'AppController.js',
  'ConsentFormMasterController.js',
  'CustomerReportedIssuesController.js',
  'DischargeSummaryController.js',
  'ExternalLabReportController.js',
  'FamilyMemberController.js',
  'FamilyMemberHospitalAccountController.js',
  'HospitalController.js',
  'LabReportController.js',
  'LocationController.js',
  'ReceiptController.js',
  'SpecialityController.js',
  'VisitController.js'
];

controllers.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  console.log(`\nProcessing ${file}...`);
  let changeCount = 0;

  // Pattern 1: res.status(200); res.send(data);
  const pattern1 = /res\.status\(200\);\s*res\.send\(([^;]+)\);/g;
  const matches1 = content.match(pattern1);
  if (matches1) {
    content = content.replace(pattern1, 'return ResponseHandler.success(res, $1);');
    changeCount += matches1.length;
  }

  // Pattern 2: res.status(500); res.send(error);
  const pattern2 = /res\.status\(500\);\s*res\.send\(([^;]+)\);/g;
  const matches2 = content.match(pattern2);
  if (matches2) {
    content = content.replace(pattern2, 'return ResponseHandler.error(res, $1, 500);');
    changeCount += matches2.length;
  }

  // Pattern 3: res.send(data) without status
  // This is trickier - we need to look at context
  // For now, let's handle simple cases
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check if this line has res.send but not already ResponseHandler
    if (line.includes('res.send(') && !line.includes('ResponseHandler') && !line.includes('return ResponseHandler')) {
      // Check if previous line has res.status
      if (i > 0 && lines[i-1].includes('res.status(')) {
        // Already handled by patterns above
        newLines.push(line);
      } else {
        // Standalone res.send - needs manual inspection but let's try to convert
        // Skip if it's already been converted or has complex logic
        if (line.match(/^\s*res\.send\(/)) {
          newLines.push(line);
        } else {
          newLines.push(line);
        }
      }
    } else {
      newLines.push(line);
    }
  }

  content = newLines.join('\n');

  if (changeCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Fixed ${changeCount} responses in ${file}`);
  } else {
    console.log(`  - No changes needed for ${file}`);
  }
});

console.log('\n=== Manual Review Required ===');
console.log('Please manually check these patterns in each file:');
console.log('1. Error responses without proper status codes');
console.log('2. Complex conditional responses');
console.log('3. Responses inside nested callbacks');
console.log('\nRun: grep -n "res\\.send" src/controllers/*.js | grep -v ResponseHandler');
