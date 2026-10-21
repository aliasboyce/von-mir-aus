import { lettersRepo, type LetterToSelf } from './lettersRepo';
import { createId } from '../../services/storage/repository';

/**
 * "Briefe an Freundinnen" without a server: a letter is packed into a link
 * or a file that the sender passes on themselves (messenger, mail). The
 * other person puts it into their own app, where it waits sealed until the
 * time the SENDER chose. Nothing is stored or uploaded anywhere.
 *
 * Honest limit (also told to the people using it): the time is a promise
 * of the app, not a lock — the text itself is inside the link.
 */
export interface SharedLetterPayload {
  v: 1;
  /** random id so the same letter is not imported twice */
  id: string;
  from: string;
  to?: string;
  text: string;
  /** ISO datetime when the letter opens for the receiver */
  at: string;
}

const MAX_TEXT = 12000;
const MAX_NAME = 60;

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  writer.write(bytes as unknown as BufferSource).catch(() => {});
  writer.close().catch(() => {});
  const buf = await new Response(stream.readable).arrayBuffer();
  return new Uint8Array(buf);
}

export function newPayload(from: string, to: string, text: string, at: Date): SharedLetterPayload {
  return {
    v: 1,
    id: createId('shl'),
    from: from.trim().slice(0, MAX_NAME),
    to: to.trim() ? to.trim().slice(0, MAX_NAME) : undefined,
    text: text.trim().slice(0, MAX_TEXT),
    at: at.toISOString(),
  };
}

/** Compact token: "z." = deflate-compressed, "p." = plain (older browsers). */
export async function encodeLetter(payload: SharedLetterPayload): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream !== 'undefined') {
    try {
      return 'z.' + toBase64Url(await pipe(raw, new CompressionStream('deflate-raw')));
    } catch {
      // fall back to plain
    }
  }
  return 'p.' + toBase64Url(raw);
}

function validate(x: unknown): SharedLetterPayload | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.text !== 'string' || typeof o.from !== 'string' || typeof o.at !== 'string') return null;
  if (!o.text.trim() || Number.isNaN(new Date(o.at).getTime())) return null;
  return {
    v: 1,
    id: o.id.slice(0, 80),
    from: o.from.slice(0, MAX_NAME),
    to: typeof o.to === 'string' ? o.to.slice(0, MAX_NAME) : undefined,
    text: o.text.slice(0, MAX_TEXT),
    at: new Date(o.at).toISOString(),
  };
}

export async function decodeLetter(token: string): Promise<SharedLetterPayload | null> {
  try {
    const kind = token.slice(0, 2);
    const body = fromBase64Url(token.slice(2));
    let bytes: Uint8Array;
    if (kind === 'z.') {
      if (typeof DecompressionStream === 'undefined') return null;
      bytes = await pipe(body, new DecompressionStream('deflate-raw'));
    } else if (kind === 'p.') {
      bytes = body;
    } else {
      return null;
    }
    return validate(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function buildLetterLink(token: string): string {
  return `${window.location.origin}/brief/importieren?d=${token}`;
}

/** Finds the token in whatever was pasted: a whole link, a message containing a link, or the bare code. */
export function extractToken(input: string): string | null {
  const m = input.match(/[?&#]d=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|[zp]\.[A-Za-z0-9_-]+)/) ?? input.match(/\b([zp]\.[A-Za-z0-9_-]{8,})/);
  return m ? m[1] : null;
}

export function letterFileContent(payload: SharedLetterPayload): string {
  return JSON.stringify({ app: 'von-mir-aus', type: 'letter', ...payload }, null, 2);
}

export function parseLetterFile(raw: string): SharedLetterPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.app !== 'von-mir-aus' || parsed?.type !== 'letter') return null;
    return validate(parsed);
  } catch {
    return null;
  }
}

/** Puts the letter into the receiver's own letters, sealed until `at`. */
export function importLetter(p: SharedLetterPayload): 'saved' | 'duplicate' {
  if (lettersRepo.getAll().some((l) => l.externalId === p.id)) return 'duplicate';
  const letter: LetterToSelf = {
    id: createId('letter'),
    text: p.text,
    createdAt: new Date().toISOString(),
    scheduledFor: p.at,
    opened: false,
    inReview: false,
    fromName: p.from || undefined,
    externalId: p.id,
  };
  lettersRepo.save(letter);
  return 'saved';
}
