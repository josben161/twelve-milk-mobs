export interface DemoUser {
  id: string; // 'user_1', 'user_2', etc.
  handle: string; // e.g. 'milk_mob_1'
  displayName: string; // e.g. 'Milk Mob User 1'
  avatarColor: string; // Tailwind color class suffix, e.g. 'indigo', 'emerald'
}

export const DEMO_USERS: Record<string, DemoUser> = {
  user_1: {
    id: 'user_1',
    handle: 'milk_mob_1',
    displayName: 'Milk Mob User 1',
    avatarColor: 'indigo',
  },
  user_2: {
    id: 'user_2',
    handle: 'skate_milk',
    displayName: 'Skate Milk',
    avatarColor: 'emerald',
  },
  user_3: {
    id: 'user_3',
    handle: 'milk_lover',
    displayName: 'Milk Lover',
    avatarColor: 'rose',
  },
};

