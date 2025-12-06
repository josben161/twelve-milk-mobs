/**
 * Shared utilities for generating human-readable mob names and descriptions
 * from semantic mob IDs (e.g., "skate_drink_skatepark_0" -> "Skate & Drink at Skatepark")
 */

/**
 * Generate human-readable mob name from mob ID
 * Converts "skate_drink_skatepark_0" to "Skate & Drink at Skatepark"
 */
export function generateMobNameFromId(mobId: string): string {
  // Remove numeric cluster index suffix (e.g., "_0", "_1")
  const parts = mobId.split('_').filter(p => !/^\d+$/.test(p));
  
  if (parts.length === 0) {
    return 'Misc Milk Mob';
  }
  
  // Capitalize first letter of each part
  const capitalized = parts.map(part => {
    // Handle special cases
    if (part === 'misc' || part === 'milk') {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }
    return part.charAt(0).toUpperCase() + part.slice(1);
  });
  
  // Join with " & " for actions/scenes, or " at " for location
  // Simple heuristic: if we have 2+ parts, join first parts with " & " and last with " at "
  if (capitalized.length === 1) {
    return capitalized[0] + ' Mob';
  } else if (capitalized.length === 2) {
    return `${capitalized[0]} & ${capitalized[1]}`;
  } else {
    // For 3+ parts, assume last is location
    const actions = capitalized.slice(0, -1).join(' & ');
    const location = capitalized[capitalized.length - 1];
    return `${actions} at ${location}`;
  }
}

/**
 * Generate mob description from mob ID
 */
export function generateMobDescriptionFromId(mobId: string): string {
  const parts = mobId.split('_').filter(p => !/^\d+$/.test(p));
  
  if (parts.length === 0) {
    return 'General milk-related content and everyday moments';
  }
  
  const capitalized = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1));
  return `Videos featuring ${capitalized.join(', ')}`;
}

