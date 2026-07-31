/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: {
      id: string;
      email?: string;
      username: string;
      handle: string;
      avatar?: string;
      chaptersRead?: number;
      hoursWatched?: number;
      readingStreakDays?: number;
      preferredReaderMode?: string;
      preferredStreamQuality?: string;
      autoSkipIntro?: boolean;
    } | null;
  }
}
