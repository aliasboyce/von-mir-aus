import { createRepository } from '../../services/storage/repository';
import type { WeatherCheckIn } from '../../data/types';

export const weatherRepo = createRepository<WeatherCheckIn>('weather-checkins');
