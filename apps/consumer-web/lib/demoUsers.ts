export interface DemoUser {
  id: string; // 'user_1', 'user_2', etc.
  handle: string; // e.g. 'milk_mob_1'
  displayName: string; // e.g. 'Milk Mob User 1'
  avatarColor: string; // Tailwind color class suffix, e.g. 'indigo', 'emerald'
}

export const DEMO_USERS: Record<string, DemoUser> = {
  user_1: {
    id: 'user_1',
    handle: 'user_1',
    displayName: 'User 1',
    avatarColor: 'indigo',
  },
  user_2: {
    id: 'user_2',
    handle: 'user_2',
    displayName: 'User 2',
    avatarColor: 'emerald',
  },
  user_3: {
    id: 'user_3',
    handle: 'user_3',
    displayName: 'User 3',
    avatarColor: 'rose',
  },
};

