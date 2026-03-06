import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getYouTubeEmbedUrl(url: string) {
  try {
    let videoId = '';
    if (url.includes('youtu.be')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    }
    
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch (e) {
    return null;
  }
}
