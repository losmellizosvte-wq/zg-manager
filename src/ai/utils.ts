/**
 * Performs fuzzy matching on a provider name to standardize it.
 * Strips punctuation, multiple spaces, and common corporate extensions.
 */
export function fuzzyMatchProvider(name: string): string {
  if (!name || name.trim() === '') return name;

  // 1. Convert to uppercase for consistency
  let cleaned = name.toUpperCase();

  // 2. Remove all punctuation (dots, commas, dashes) except spaces
  cleaned = cleaned.replace(/[.,\-]/g, ' ');

  // 3. Remove common corporate extensions
  // Using \b to match whole words. Includes common variations.
  const extensions = [
    'S R L', 'SRL', 'S A', 'SA', 'S A U', 'SAU', 
    'S A S', 'SAS', 'S E', 'SE', 'S N C', 'SNC', 
    'S C A', 'SCA', 'S C S', 'SCS', 'S C', 'SC',
    'SOCIEDAD ANONIMA', 'SOCIEDAD DE HECHO', 'S H', 'SH'
  ];

  // Build a regex that matches any of the extensions at the end of the string or as an isolated word
  const extensionRegex = new RegExp(`\\b(?:${extensions.join('|')})\\b`, 'g');
  cleaned = cleaned.replace(extensionRegex, '');

  // 4. Remove multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned || name.trim(); // Return original trim if everything got removed
}
