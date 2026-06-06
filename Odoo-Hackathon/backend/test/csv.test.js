const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeCsvValue, rowsToCsv } = require('../utils/csv');

test('escapeCsvValue quotes values containing commas or quotes', () => {
  assert.equal(escapeCsvValue('Alpha, Inc'), '"Alpha, Inc"');
  assert.equal(escapeCsvValue('A "quoted" value'), '"A ""quoted"" value"');
});

test('rowsToCsv creates a header row and data rows', () => {
  const csv = rowsToCsv([
    { company: 'Alpha', total: 100 },
    { company: 'Beta', total: 200 },
  ]);

  assert.equal(csv, 'company,total\nAlpha,100\nBeta,200');
});
