/**
 * Fisher-Yates shuffle algorithm
 * Shuffles an array in place and returns it
 * Time complexity: O(n)
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }

    return shuffled;
}

/**
 * Chunks an array into smaller arrays of specified size
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
    if (size <= 0) {
        throw new Error('Chunk size must be greater than 0');
    }

    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }

    return chunks;
}

/**
 * Creates an array of pairs from a single array
 * Each element appears twice in the result
 * @param array - Source array
 * @returns Array with each element duplicated
 */
export function createPairs<T>(array: T[]): T[] {
    return array.flatMap((item) => [item, item]);
}

/**
 * Removes duplicates from an array
 * @param array - Array with potential duplicates
 * @returns Array with unique elements
 */
export function unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}

/**
 * Groups array elements by a key function
 * @param array - Array to group
 * @param keyFn - Function to extract grouping key
 * @returns Record of grouped elements
 */
export function groupBy<T, K extends string | number>(
    array: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    return array.reduce(
        (groups, item) => {
            const key = keyFn(item);
            const group = groups[key] ?? [];
            return {
                ...groups,
                [key]: [...group, item],
            };
        },
        {} as Record<K, T[]>
    );
}

/**
 * Checks if an array is empty
 * @param array - Array to check
 * @returns True if array is empty
 */
export function isEmpty<T>(array: T[]): boolean {
    return array.length === 0;
}

/**
 * Gets a random element from an array
 * @param array - Source array
 * @returns Random element or undefined if array is empty
 */
export function randomElement<T>(array: T[]): T | undefined {
    if (isEmpty(array)) {
        return undefined;
    }
    return array[Math.floor(Math.random() * array.length)];
}
