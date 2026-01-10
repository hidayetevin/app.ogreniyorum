/**
 * Delays execution for specified milliseconds
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Retries an async function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds
 * @returns Result of the function
 */
export async function retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < maxRetries) {
                const delayMs = baseDelay * Math.pow(2, attempt);
                await delay(delayMs);
            }
        }
    }

    throw lastError ?? new Error('Retry failed with unknown error');
}

/**
 * Executes an async function with a timeout
 * @param fn - Async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @returns Result of the function
 * @throws Error if timeout is reached
 */
export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
        fn(),
        new Promise<T>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        }),
    ]);
}

/**
 * Debounces an async function
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends unknown[]>(
    fn: (...args: T) => void,
    delayMs: number
): (...args: T) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: T): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            fn(...args);
        }, delayMs);
    };
}

/**
 * Throttles a function to execute at most once per interval
 * @param fn - Function to throttle
 * @param intervalMs - Interval in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends unknown[]>(
    fn: (...args: T) => void,
    intervalMs: number
): (...args: T) => void {
    let lastCallTime = 0;

    return (...args: T): void => {
        const now = Date.now();

        if (now - lastCallTime >= intervalMs) {
            lastCallTime = now;
            fn(...args);
        }
    };
}
