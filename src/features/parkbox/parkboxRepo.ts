import { createRepository } from '../../services/storage/repository';

/** A note slip in the Parkbox. Priority 1 = wichtig, 2 = normal, 3 = später. */
export interface ParkNote {
  id: string;
  text: string;
  priority: 1 | 2 | 3;
  archived: boolean;
  /** index into PAPER_COLORS – only for looks */
  paper: number;
  /** slight rotation in degrees – only for looks */
  tilt: number;
  /** Project.id – the slip lies in that project's own box (not in the general Parkbox) */
  projectId?: string;
  /** where the slip came from – decides its fixed colour (park = yellow, wait = blue, project = green) */
  origin?: SlipOrigin;
  /** pinned to something else: an appointment, a person from the network or a mind map */
  attach?: { kind: SlipTarget; id: string };
  /** ticked off where it lies */
  done?: boolean;
  doneAt?: string;
  /** a waiting-room item turned into a slip – lets it go back to the waiting room unchanged */
  waitSnapshot?: { title: string; kind: WaitKind; need?: string; note?: string };
  /** 'YYYY-MM-DDTHH:MM' (local) – the slip flies into the Postfach / Home at that moment */
  deliverAt?: string;
  /** set once the slip has arrived on the start page; it then waits there until the person decides */
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type WaitKind = 'idee' | 'projekt' | 'aktivitaet';
export type SlipOrigin = 'park' | 'wait' | 'project';
export type SlipTarget = 'appointment' | 'person' | 'mindmap';

/** Something that wants to happen but has no time yet. Array order = the fixed place in the waiting room. */
export interface WaitItem {
  id: string;
  title: string;
  kind: WaitKind;
  /** which need is behind it (free text, optional) */
  need?: string;
  note?: string;
  /** Appointment.id once a period was assigned in the calendar */
  appointmentId?: string;
  /** Project.id once the item was given to a project */
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export const parkNotesRepo = createRepository<ParkNote>('park-notes');
export const waitItemsRepo = createRepository<WaitItem>('waiting-room');

/** Slips always have the same colour for the same origin – so you can tell where a slip belongs at a glance. */
export const SLIP_COLORS: Record<SlipOrigin, { bg: string; ink: string; label: { de: string; en: string } }> = {
  park: { bg: '#fff1a8', ink: '#3d3a2e', label: { de: 'aus der Parkbox', en: 'from the Park box' } },
  wait: { bg: '#d2e4ff', ink: '#2b3a4d', label: { de: 'aus dem Wartezimmer', en: 'from the waiting room' } },
  project: { bg: '#d3efcb', ink: '#2f3f2b', label: { de: 'aus einem Projekt', en: 'from a project' } },
};
export const slipOrigin = (n: Pick<ParkNote, 'origin' | 'projectId'>): SlipOrigin => n.origin ?? (n.projectId ? 'project' : 'park');
export const slipColor = (n: Pick<ParkNote, 'origin' | 'projectId'>) => SLIP_COLORS[slipOrigin(n)];
/** kept for old code: the paper colours (no longer random for slips) */
export const PAPER_COLORS = [SLIP_COLORS.park.bg, '#ffd6df', SLIP_COLORS.project.bg, SLIP_COLORS.wait.bg, '#e9d8ff', '#ffe0bf'];

export const WAIT_CALENDAR_CATEGORY_ID = 'cal_wartezimmer';
