import { createRepository } from '../../services/storage/repository';
import type { DiaryEntry } from '../../data/types';

export const diaryRepo = createRepository<DiaryEntry>('diary-entries');
