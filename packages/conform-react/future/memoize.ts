/**
 * A memoized function with cache clearing capability.
 */
export type Memoized<T extends (...args: any) => any> = {
	(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T>;
	/** Clears the memoization cache */
	clearCache: () => void;
};

/**
 * Default equality check that compares arguments using Object.is().
 *
 * @param prevArgs - Previous function arguments
 * @param nextArgs - Current function arguments
 * @returns True if all arguments are equal
 */
export function defaultEqualityCheck(prevArgs: any[], nextArgs: any[]) {
	if (prevArgs.length !== nextArgs.length) {
		return false;
	}

	for (let i = 0; i < prevArgs.length; i++) {
		if (!Object.is(prevArgs[i], nextArgs[i])) {
			return false;
		}
	}

	return true;
}

/**
 * Memoizes function calls, caching only the most recent result to prevent redundant async validations.
 *
 * Built-in implementation based on memoize-one with enhanced async support.
 * Can be replaced with other memoization libraries if needed.
 *
 * @param fn - The function to memoize
 * @param isEqual - Custom equality function to compare arguments (defaults to shallow comparison)
 * @returns Memoized function with cache clearing capability
 *
 * @example
 * ```ts
 * // Async validation with API call
 * const validateUsername = useMemo(
 *   () => memoize(async function isUnique(username: string) {
 *     const response = await fetch(`/api/users/${username}`);
 *     return response.ok ? null : ['Username is already taken'];
 *   }),
 *   []
 * );
 *
 * // Usage in form validation
 * async onValidate({ payload, error }) {
 *   if (payload.username && !error.fieldErrors.username) {
 *     const messages = await validateUsername(value.username);
 *     if (messages) error.fieldErrors.username = messages;
 *   }
 *   return error;
 * }
 * ```
 */
export function memoize<T extends (...args: any) => any>(
	fn: T,
	isEqual: (
		prevArgs: Parameters<T>,
		nextArgs: Parameters<T>,
	) => boolean = defaultEqualityCheck,
): Memoized<T> {
	let cache: {
		this: ThisParameterType<T>;
		args: Parameters<T>;
		result: ReturnType<T>;
	} | null = null;

	function memoized(this: ThisParameterType<T>, ...args: Parameters<T>) {
		// Check if new arguments match last arguments including the context (this)
		if (cache && cache.this === this && isEqual(cache.args, args)) {
			return cache.result;
		}

		let result = fn.apply(this, args);

		if (result instanceof Promise) {
			result = result.catch((e) => {
				// If the promise is rejected, clear the cache so that the next call will re-invoke fn
				cache = null;

				// Re-throw the exception so that it can be handled by the caller
				throw e;
			});
		}

		// Update the cache
		cache = {
			this: this,
			args,
			result,
		};

		return result;
	}

	memoized.clearCache = function clearCache() {
		cache = null;
	};

	return memoized;
}
