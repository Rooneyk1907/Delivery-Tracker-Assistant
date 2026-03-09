const fs = require('fs');
const path = require('path');

const { createSampleDays } = require('../helpers/sampleData.node.js');

const days = createSampleDays(70);
const outPath = path.join(__dirname, '..', 'assets', 'sample-data.json');

fs.writeFileSync(outPath, JSON.stringify(days, null, 2), 'utf8');
console.log(`Wrote ${days.length} days to ${outPath}`);
ts;
