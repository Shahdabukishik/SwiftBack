import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

type BaseDirection = 'ltr' | 'rtl';

interface BidiRun {
  text: string;
  level: number;
}

function splitIntoRuns(text: string, levels: Uint8Array): BidiRun[] {
  const runs: BidiRun[] = [];
  let runStart = 0;
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || levels[i] !== levels[runStart]) {
      runs.push({ text: text.slice(runStart, i), level: levels[runStart] });
      runStart = i;
    }
  }
  return runs;
}

// pdfkit draws characters at strictly increasing x (left-to-right) and
// never reorders a run for RTL advance direction itself — it just shapes
// glyphs (letter-joining) per string. So a whole same-level RTL run (e.g. a
// pure-Arabic multi-word phrase) reaches bidi-js's reorder step as a single
// run with nothing to swap it against, and comes out with word order
// untouched — backwards once drawn left-to-right. Word order within an RTL
// run has to be flipped explicitly before rendering; per-word joining still
// works since each word's internal character order is untouched.
function reverseWordOrder(text: string): string {
  return text.split(/(\s+)/).reverse().join('');
}

// pdfkit/fontkit shape glyphs per string but don't reorder mixed-direction
// text into visual order. Reversing at the character level (the naive fix)
// breaks Arabic letter-joining, since shaping needs characters in logical
// order. Instead: split into same-direction runs (each run's internal
// character order stays untouched, so joining still works), mirror
// brackets/parens, reverse word order within RTL runs, then reorder the
// *runs* into visual (left-to-right drawing) order.
function reorderRuns(text: string, baseDirection: BaseDirection): string[] {
  if (!text) return [text];

  const embeddingLevels = bidi.getEmbeddingLevels(text, baseDirection);

  const mirrored = bidi.getMirroredCharactersMap(text, embeddingLevels);
  const chars = text.split('');
  mirrored.forEach((replacement, index) => {
    chars[index] = replacement;
  });

  const runs = splitIntoRuns(chars.join(''), embeddingLevels.levels).map(
    (run) =>
      run.level % 2 === 1
        ? { ...run, text: reverseWordOrder(run.text) }
        : run,
  );

  const runOfChar: number[] = [];
  runs.forEach((run, runIndex) => {
    for (let i = 0; i < run.text.length; i++) runOfChar.push(runIndex);
  });

  const order = runs.map((_, i) => i);
  for (const [start, end] of bidi.getReorderSegments(text, embeddingLevels)) {
    let i = runOfChar[start];
    let j = runOfChar[end];
    while (i < j) {
      [order[i], order[j]] = [order[j], order[i]];
      i++;
      j--;
    }
  }

  // pdfkit drops whitespace-only segments in a `continued: true` chain, so
  // a space that lands on its own run (common at RTL/LTR boundaries) can
  // otherwise vanish. Fold it into a neighboring run instead.
  const segments: string[] = [];
  for (const runIndex of order) {
    const segment = runs[runIndex].text;
    if (/^\s+$/.test(segment) && segments.length > 0) {
      segments[segments.length - 1] += segment;
    } else {
      segments.push(segment);
    }
  }
  return segments;
}

// For contexts where only a single string can be rendered (e.g. a pdfkit
// table cell). Correctly reorders/mirrors, but same-line Arabic/Latin
// boundary spacing can still occasionally collapse — see the render*
// functions below for the fully-correct alternative when direct doc.text()
// calls are available.
export function toDisplayString(
  text: string,
  baseDirection: BaseDirection = 'rtl',
): string {
  return reorderRuns(text, baseDirection).join('');
}

// Renders mixed-direction text starting at the document's current x/y,
// issuing one pdfkit `.text()` call per direction run chained with
// `continued: true`. Use for left-flush lines only — pdfkit's `align`
// option garbles multi-run continued chains (produces overlapping
// glyphs), so this never sets align itself.
export function renderBidiLine(
  doc: PDFKit.PDFDocument,
  text: string,
  baseDirection: BaseDirection = 'rtl',
): void {
  const segments = reorderRuns(text, baseDirection);
  segments.forEach((segment, i) => {
    doc.text(segment, { continued: i < segments.length - 1 });
  });
}

// Renders mixed-direction text right-flush against `xRight`. Since
// pdfkit's `align` option breaks multi-run continued chains, this
// measures the rendered width up front and positions the starting cursor
// so the line lands flush on its own, without ever using `align`.
export function renderBidiLineRight(
  doc: PDFKit.PDFDocument,
  text: string,
  xRight: number,
  y: number,
  baseDirection: BaseDirection = 'rtl',
): void {
  const segments = reorderRuns(text, baseDirection);
  const totalWidth = segments.reduce(
    (sum, segment) => sum + doc.widthOfString(segment),
    0,
  );
  doc.x = xRight - totalWidth;
  doc.y = y;
  segments.forEach((segment, i) => {
    doc.text(segment, { continued: i < segments.length - 1 });
  });
}

// Same measure-first approach as renderBidiLineRight, but centered on
// `centerX` instead of flush against a right edge.
export function renderBidiLineCenter(
  doc: PDFKit.PDFDocument,
  text: string,
  centerX: number,
  y: number,
  baseDirection: BaseDirection = 'rtl',
): void {
  const segments = reorderRuns(text, baseDirection);
  const totalWidth = segments.reduce(
    (sum, segment) => sum + doc.widthOfString(segment),
    0,
  );
  doc.x = centerX - totalWidth / 2;
  doc.y = y;
  segments.forEach((segment, i) => {
    doc.text(segment, { continued: i < segments.length - 1 });
  });
}
