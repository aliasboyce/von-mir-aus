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
  /** Project.id – the slip lies in that project's own box (not in the main box) */
  projectId?: string;
  /** 'YYYY-MM-DDTHH:MM' (local) – the slip flies into the Postfach / Home at that moment */
  deliverAt?: string;
  /** set once the slip has arrived on the start page; it then waits there until the person decides */
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type WaitKind = 'idee' | 'projekt' | 'aktivitaet';

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

export const PAPER_COLORS = ['#fff1a8', '#ffd6df', '#d3efcb', '#d2e4ff', '#e9d8ff', '#ffe0bf'];

export const WAIT_CALENDAR_CATEGORY_ID = 'cal_wartezimmer';
