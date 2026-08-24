// src/utils/timeGreeting.ts
import dayjs from 'dayjs';

export const getGreetingTime = (): string => {
  const currentHour = dayjs().hour();

  if (currentHour >= 5 && currentHour < 12) return 'Selamat Pagi';
  if (currentHour >= 12 && currentHour < 15) return 'Selamat Siang';
  if (currentHour >= 15 && currentHour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};