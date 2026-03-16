const fs = require('fs');

const content = fs.readFileSync('c:/Users/zacha/OneDrive/Documents/VIBECODING/political/tiles.svg', 'utf8');

// State name to abbreviation mapping
const STATE_ABBREVS = {
  'ALABAMA': 'AL',
  'ALASKA': 'AK',
  'ARIZONA': 'AZ',
  'ARKANSAS': 'AR',
  'CALIFORNIA': 'CA',
  'COLORADO': 'CO',
  'CONNECTICUT': 'CT',
  'DELAWARE': 'DE',
  'DISTRICT OF COLUMBIA': 'DC',
  'FLORIDA': 'FL',
  'GEORGIA': 'GA',
  'HAWAII': 'HI',
  'IDAHO': 'ID',
  'ILLINOIS': 'IL',
  'INDIANA': 'IN',
  'IOWA': 'IA',
  'KANSAS': 'KS',
  'KENTUCKY': 'KY',
  'LOUISIANA': 'LA',
  'MAINE': 'ME',
  'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA',
  'MICHIGAN': 'MI',
  'MINNESOTA': 'MN',
  'MISSISSIPPI': 'MS',
  'MISSOURI': 'MO',
  'MONTANA': 'MT',
  'NEBRASKA': 'NE',
  'NEVADA': 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  'OHIO': 'OH',
  'OKLAHOMA': 'OK',
  'OREGON': 'OR',
  'PENNSYLVANIA': 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  'TENNESSEE': 'TN',
  'TEXAS': 'TX',
  'UTAH': 'UT',
  'VERMONT': 'VT',
  'VIRGINIA': 'VA',
  'WASHINGTON': 'WA',
  'WEST VIRGINIA': 'WV',
  'WISCONSIN': 'WI',
  'WYOMING': 'WY',
  'PUERTO RICO': 'PR',
};

// Extract groups and their polygons
const groupRegex = /<g id="([^"]+)">([\s\S]*?)<\/g>/g;
const polygonRegex = /points="([^"]+)"/g;

const ORIGIN_X = 99;
const ORIGIN_Y = 91;
const H_SPACING = 19.81;  // r*sqrt(3)
const V_SPACING = 17.16;  // r*1.5

function centroid(pointsStr) {
  const coords = pointsStr.trim().split(',').map(Number);
  let sx = 0, sy = 0, n = coords.length / 2;
  for (let i = 0; i < coords.length; i += 2) {
    sx += coords[i];
    sy += coords[i + 1];
  }
  return [sx / n, sy / n];
}

function pixelToGrid(px, py) {
  const row = Math.round((py - ORIGIN_Y) / V_SPACING);
  const col = Math.round((px - ORIGIN_X) / H_SPACING - (row % 2 === 1 ? 0.5 : 0));
  return [col, row];
}

const result = {};
const unknownGroups = [];

let match;
groupRegex.lastIndex = 0;
while ((match = groupRegex.exec(content)) !== null) {
  const groupName = match[1];
  const groupContent = match[2];
  const abbrev = STATE_ABBREVS[groupName.toUpperCase()] || STATE_ABBREVS[groupName];

  if (!abbrev) {
    unknownGroups.push(groupName);
    continue;
  }

  const cells = [];
  let polyMatch;
  polygonRegex.lastIndex = 0;
  while ((polyMatch = polygonRegex.exec(groupContent)) !== null) {
    const [cx, cy] = centroid(polyMatch[1]);
    const [col, row] = pixelToGrid(cx, cy);
    cells.push([col, row]);
  }

  if (!result[abbrev]) result[abbrev] = [];
  result[abbrev].push(...cells);
}

if (unknownGroups.length > 0) {
  console.error('Unknown groups:', unknownGroups);
}

// Output the JavaScript object
const lines = ['const HEX_CELLS = {'];
const sorted = Object.keys(result).sort();
sorted.forEach((abbrev, i) => {
  const cells = result[abbrev];
  const cellStr = cells.map(([c, r]) => `[${c},${r}]`).join(',');
  const comma = i < sorted.length - 1 ? ',' : '';
  lines.push(`  '${abbrev}': [${cellStr}]${comma}`);
});
lines.push('};');

const output = lines.join('\n');
console.log(output);

// Also write to file
fs.writeFileSync('c:/Users/zacha/OneDrive/Documents/VIBECODING/political/hex_cells.js', output);
console.error('\nWritten to hex_cells.js');
console.error(`Total states: ${Object.keys(result).length}`);
