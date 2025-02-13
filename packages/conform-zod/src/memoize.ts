export type Memoized<T extends (...args: any) => any> = {
	(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T>;
	clearCache: () => void;
};

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
