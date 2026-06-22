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

/**
 * Calculates the Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Finds the best provider match using fuzzy cleaning and Levenshtein distance (>85% similarity).
 */
export function findBestProviderMatch(extractedName: string, providers: { id: string, name: string }[], threshold: number = 0.85): { id: string, name: string } | null {
  const cleanedExtracted = fuzzyMatchProvider(extractedName);
  
  let bestMatch = null;
  let highestSimilarity = 0;

  for (const provider of providers) {
    const cleanedProvider = fuzzyMatchProvider(provider.name);
    const distance = levenshteinDistance(cleanedExtracted, cleanedProvider);
    const maxLength = Math.max(cleanedExtracted.length, cleanedProvider.length);
    const similarity = maxLength === 0 ? 1 : 1 - (distance / maxLength);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = provider;
    }
  }

  return highestSimilarity >= threshold ? bestMatch : null;
}
