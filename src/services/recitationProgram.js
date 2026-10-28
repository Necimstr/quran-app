// Joins the configured ayahs into ONE continuous MP3, so a whole session plays from a
// single audio source. Background playback then never depends on starting a new file
// between ayahs, which is what phones block or delay when the screen is locked.
//
// A program covers one pass of the range (or the rest of it, after a skip), with each
// ayah's repeats baked in. Later passes reuse the same file through `audio.loop`.
// Seeking is avoided on purpose: reciters mix bitrates between files, and browsers
// estimate seek positions from the bitrate, so a seek can land in the wrong ayah.


// Upper bound for one joined file (~70 min at 128 kbps). Longer passes continue in a
// second program when the first one ends.
const MAX_PROGRAM_BYTES = 64 * 1024 * 1024;
const CONCURRENCY = 4;

export class ProgramError extends Error {}

// from: { pass, verse } — where playback starts. plan: { start, end, verseRepeat }.
// getVerse(verse) → Promise<{ data, duration }>. Returns null if cancelled.
export async function buildProgram({ from, plan, getVerse, onProgress, isCancelled }) {
  const verses = [];
  for (let v = from.verse; v <= plan.end; v++) verses.push(v);

  const inflight = new Map();
  const kick = (k) => {
    if (k >= verses.length || inflight.has(k)) return;
    const p = getVerse(verses[k]);
    p.catch(() => {}); // awaited below; avoid unhandled rejections for ones we never reach
    inflight.set(k, p);
  };
  for (let k = 0; k < CONCURRENCY; k++) kick(k);

  const included = [];
  let bytes = 0;
  for (let k = 0; k < verses.length; k++) {
    const parsed = await inflight.get(k);
    kick(k + CONCURRENCY);
    if (isCancelled()) return null;
    const add = parsed.data.length * plan.verseRepeat;
    if (included.length && bytes + add > MAX_PROGRAM_BYTES) break;
    included.push({ verse: verses[k], parsed });
    bytes += add;
    onProgress?.(k + 1, verses.length);
  }

  const parts = [];
  const segments = [];
  let t = 0;
  for (const { verse, parsed } of included) {
    for (let rep = 0; rep < plan.verseRepeat; rep++) {
      parts.push(parsed.data);
      segments.push({ verse, rep, start: t, end: t + parsed.duration });
      t += parsed.duration;
    }
  }

  return {
    url: URL.createObjectURL(new Blob(parts, { type: 'audio/mpeg' })),
    segments,
    duration: t,
    pass: from.pass,
    // A whole pass from its first ayah can repeat itself with audio.loop
    loopsPass: from.verse === plan.start && included.length === verses.length,
  };
}

// Where playback continues after `program` ends, or null when the session is complete.
export function nextStart(program, pass, plan, groupRepeat) {
  const last = program.segments[program.segments.length - 1];
  if (last.verse < plan.end) return { pass, verse: last.verse + 1 };
  if (groupRepeat === 0 || pass + 1 < groupRepeat) return { pass: pass + 1, verse: plan.start };
  return null;
}
