// Minimal MPEG audio (Layer III) frame reader, used to join per-ayah files into one stream.
// It keeps only the audio frames (dropping ID3 tags and the Xing/Info/VBRI header frame,
// which would otherwise tell the browser the whole stream is one ayah long) and computes
// the exact duration from the frame count.

const BITRATES_V1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const BITRATES_V2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
// Indexed by the header's version bits: 3 = MPEG-1, 2 = MPEG-2, 0 = MPEG-2.5
const SAMPLE_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

function readHeader(b, i) {
  if (i + 4 > b.length || b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) return null;
  const version = (b[i + 1] >> 3) & 3;
  const layer = (b[i + 1] >> 1) & 3;
  if (version === 1 || layer !== 1) return null; // reserved version, or not Layer III
  const bitrateIndex = b[i + 2] >> 4;
  const rateIndex = (b[i + 2] >> 2) & 3;
  if (bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) return null;
  const v1 = version === 3;
  const bitrate = (v1 ? BITRATES_V1 : BITRATES_V2)[bitrateIndex] * 1000;
  const sampleRate = SAMPLE_RATES[version][rateIndex];
  const padding = (b[i + 2] >> 1) & 1;
  return {
    bitrate,
    length: Math.floor(((v1 ? 144 : 72) * bitrate) / sampleRate) + padding,
    samples: v1 ? 1152 : 576,
    sampleRate,
    v1,
    mono: ((b[i + 3] >> 6) & 3) === 3,
  };
}

function isInfoFrame(b, i, h) {
  const sideInfo = h.v1 ? (h.mono ? 17 : 32) : (h.mono ? 9 : 17);
  const tagAt = (o) => (o + 4 <= i + h.length ? String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]) : '');
  const xing = tagAt(i + 4 + sideInfo);
  return xing === 'Xing' || xing === 'Info' || tagAt(i + 36) === 'VBRI';
}

// Returns { data: Uint8Array of audio frames, duration: seconds, sampleRate, bitrate } or null.
// bitrate is 0 for VBR input.
export function parseMp3(buffer) {
  const b = new Uint8Array(buffer);
  let i = 0;

  // Skip leading ID3v2 tags (there can be more than one)
  while (i + 10 <= b.length && b[i] === 0x49 && b[i + 1] === 0x44 && b[i + 2] === 0x33) {
    const size = ((b[i + 6] & 0x7f) << 21) | ((b[i + 7] & 0x7f) << 14) | ((b[i + 8] & 0x7f) << 7) | (b[i + 9] & 0x7f);
    i += 10 + size + (b[i + 5] & 0x10 ? 10 : 0);
  }

  const ranges = [];
  let start = -1;
  let end = -1;
  let samples = 0;
  let sampleRate = 0;
  let bitrate = 0; // 0 once frames of different bitrates are seen (VBR)
  let first = true;

  while (i + 4 <= b.length) {
    const h = readHeader(b, i);
    const next = h ? i + h.length : 0;
    // A real frame fits in the buffer and is followed by another frame (or the end / a trailing tag).
    // Anything else is a false sync inside tag data: step forward and resync.
    const valid = h && next <= b.length && (next + 4 > b.length || readHeader(b, next) || b[next] === 0x54 /* 'TAG' */);
    if (!valid) { i++; continue; }

    if (first) {
      first = false;
      if (isInfoFrame(b, i, h)) { i = next; continue; }
    }

    if (end === i) {
      end = next;
    } else {
      if (start >= 0) ranges.push([start, end]);
      start = i;
      end = next;
    }
    samples += h.samples;
    sampleRate = h.sampleRate;
    bitrate = samples === h.samples ? h.bitrate : bitrate === h.bitrate ? bitrate : 0;
    i = next;
  }
  if (start >= 0) ranges.push([start, end]);
  if (!samples) return null;

  let data;
  if (ranges.length === 1) {
    data = b.subarray(ranges[0][0], ranges[0][1]);
  } else {
    data = new Uint8Array(ranges.reduce((n, [s, e]) => n + e - s, 0));
    let o = 0;
    for (const [s, e] of ranges) { data.set(b.subarray(s, e), o); o += e - s; }
  }
  return { data, duration: samples / sampleRate, sampleRate, bitrate };
}
