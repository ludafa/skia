// Loads the built package in Node and checks the fork's APIs work: node smoke-test.cjs <npm_build dir> <font.ttf>
const fs = require('node:fs');
const path = require('node:path');

const [dir, fontFile] = process.argv.slice(2).map((p) => path.resolve(p));
const CanvasKitInit = require(path.join(dir, 'bin/canvaskit.js'));

function check(ok, what) {
  if (!ok) {
    console.error(`FAIL ${what}`);
    process.exit(1);
  }
  console.log(`ok   ${what}`);
}

CanvasKitInit({ locateFile: (file) => path.join(dir, 'bin', file) }).then((CK) => {
  const bytes = fs.readFileSync(fontFile);
  const typeface = CK.Typeface.MakeTypefaceFromData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  check(typeface, 'Typeface.MakeTypefaceFromData');
  check(typeface.getUnitsPerEm() === 2048, `Typeface.getUnitsPerEm() is 2048 (got ${typeface.getUnitsPerEm()})`);

  const font = new CK.Font(typeface, 100);
  const [h] = font.getGlyphIDs('H');
  const [space] = font.getGlyphIDs(' ');

  const one = font.getGlyphPath(h);
  check(one, 'Font.getGlyphPath(H) is a Path');
  const b = one.getBounds();
  check(b[2] - b[0] > 40 && b[3] - b[1] > 60 && b[3] <= 0.5, `H outline bounds look like an H at 100 px [${Array.from(b, (v) => v.toFixed(2))}]`);
  const blank = font.getGlyphPath(space);
  check(blank && blank.isEmpty(), 'Font.getGlyphPath(space) is an empty Path');
  blank.delete();

  const atSize = font.getGlyphPathAtSize(h);
  check(atSize, 'Font.getGlyphPathAtSize(H) is a Path');
  const a = atSize.getBounds();
  check(a.every((v, i) => Math.abs(v - b[i]) < 0.5), `getGlyphPathAtSize bounds match getGlyphPath within 0.5 px [${Array.from(a, (v) => v.toFixed(2))}]`);

  const two = font.getGlyphsPath([h, space, h], [0, 0, 100, 0, 200, 0]);
  const t = two.getBounds();
  check(Math.abs(t[0] - b[0]) < 0.01 && Math.abs(t[2] - (b[2] + 200)) < 0.01, `Font.getGlyphsPath places glyphs at their positions [${Array.from(t, (v) => v.toFixed(2))}]`);

  let threw = false;
  try {
    font.getGlyphsPath([h, h], [0, 0]);
  } catch {
    threw = true;
  }
  check(threw, 'Font.getGlyphsPath throws when positions are short');

  [one, atSize, two, font, typeface].forEach((o) => o.delete());
  console.log('all checks passed');
});
