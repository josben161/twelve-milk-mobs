// apps/admin-web/app/videos/data.ts
export type AdminVideoStatus = 'validated' | 'processing' | 'rejected';

export interface AdminVideo {
  id: string;
  user: string;
  mob: string;
  status: AdminVideoStatus;
  createdAt: string;
  score: number | null;
  hashtags: string[];
  location: string;
  caption: string;
  actions: string[];
  objectsScenes: string[];
  timeline: { t: string; event: string }[];
}

export const adminVideos: AdminVideo[] = [
  {
    id: 'vid_1',
    user: 'sk8milk',
    mob: 'Skatepark',
    status: 'validated',
    createdAt: '2024-01-15',
    score: 0.93,
    hashtags: ['#gotmilk', '#skatepark'],
    location: 'Venice Skatepark',
    caption: 'Tried a new trick with a milk chug 🍶🛹',
    actions: ['Ollie', 'Kickflip attempt', 'Drink from milk carton'],
    objectsScenes: ['Skatepark bowl', 'Sunset sky', 'Milk carton, branded'],
    timeline: [
      { t: '0–3s', event: 'Approach ramp with milk carton visible' },
      { t: '4–8s', event: 'Performs trick while holding milk' },
      { t: '9–13s', event: 'Close-up: drinking, brand visible' },
    ],
  },
  {
    id: 'vid_2',
    user: 'late_night_milk',
    mob: 'Bedroom Dance',
    status: 'processing',
    createdAt: '2024-01-14',
    score: null,
    hashtags: ['#milkshake', '#dance'],
    location: 'Bedtime Beats',
    caption: 'Milkshake choreo round 2 💃',
    actions: ['Dance moves', 'Sip from glass'],
    objectsScenes: ['Bedroom interior', 'LED strip lighting', 'Glass of milk'],
    timeline: [
      { t: '0–4s', event: 'Intro, dance with milkshake' },
      { t: '5–9s', event: 'Close-up of milkshake + logo' },
    ],
  },
];
