const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, 'cover-heatfield.js');
if (process.argv.includes('--integration')) {
  const deck = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(deck, /<canvas[^>]+data-heatfield/, 'Formal cover must include the heatfield');
  assert.match(deck, /<script id="cover-heatfield">/, 'Embed the renderer for portable review snapshots');
  assert.doesNotMatch(deck.match(/<section class="slide[\s\S]*?<\/section>/)[0], /class="ascii-bg"/);
}
assert.ok(fs.existsSync(source), 'Continuous heatfield implementation is missing');
const {density, color, palette} = require(source);
assert.deepEqual(palette[1], [11, 93, 59], 'Keep the deck forest-green theme');
const peak = color(.85);
assert.ok(peak[0] > peak[1] + 20 && peak[1] > peak[2] + 25, 'High density needs a warm apricot accent');
let warm = 0, samples = 0;
for (let y = 0; y < 1; y += .01) for (let x = 0; x < 1; x += .01) {
  const [r,g,b] = color(density(x,y,0));
  warm += r > g + 15 && g > b + 25;
  samples++;
}
assert.ok(warm / samples > .005 && warm / samples < .08, 'Warm accents must be visible but occupy less than 8% of the frame');
let change = 0;
let min = 1, max = 0;
for (let y = 0; y <= 1; y += .05) {
  for (let x = 0; x <= 1; x += .05) {
    const a = density(x, y, 0), b = density(x, y, 8);
    assert.ok(Number.isFinite(a) && a >= 0 && a <= 1);
    assert.ok(Math.abs(density(x, y, .001) - a) < .002, 'No temporal jumps');
    min = Math.min(min, a); max = Math.max(max, a);
    change += Math.abs(a - b);
    assert.ok(color(a).every(v => Number.isInteger(v) && v >= 0 && v <= 255));
  }
}
assert.ok(max - min > .5, 'Field must have visible density variation');
assert.ok(change > 4, 'Field must evolve over time');
assert.ok(density(.15, .5, 0) < .22, 'Keep the main title zone quiet');
console.log('PASS: theme palette, field range, temporal continuity, evolution, title zone');
