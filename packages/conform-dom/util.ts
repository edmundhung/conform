import type { FormValue } from './types';

export function invariant(
	expectedCondition: boolean,
	message: string,
): asserts expectedCondition {
	if (!expectedCondition) {
		throw new Error(message);
	}
}

export function generateId(): string {
	return (Date.now() * Math.random()).toString(36);
}

export function clone<Data>(data: Data): Data {
	return JSON.parse(JSON.stringify(data));
}

/**
 * Check if the value is a plain object
 */
export function isPlainObject(
	obj: unknown,
): obj is Record<string | number | symbol, unknown> {
	return (
		!!obj &&
		obj.constructor === Object &&
		Object.getPrototypeOf(obj) === Object.prototype
	);
}

/**
 * A utility function that performs a deep equality check between two values.
 * It handles plain objects, arrays, and primitive values only.
 */
export function deepEqual(left: unknown, right: unknown): boolean {
	if (Object.is(left, right)) {
		return true;
	}

	if (left == null || right == null) {
		return false;
	}

	// Compare plain objects
	if (isPlainObject(left) && isPlainObject(right)) {
		const prevKeys = Object.keys(left);
		const nextKeys = Object.keys(right);

		if (prevKeys.length !== nextKeys.length) {
			return false;
		}

		for (const key of prevKeys) {
			if (
				!Object.prototype.hasOwnProperty.call(right, key) ||
				!deepEqual(left[key], right[key])
			) {
				return false;
			}
		}

		return true;
	}

	// Compare arrays
	if (Array.isArray(left) && Array.isArray(right)) {
		if (left.length !== right.length) {
			return false;
		}

		for (let i = 0; i < left.length; i++) {
			if (!deepEqual(left[i], right[i])) {
				return false;
			}
		}

		return true;
	}

	return false;
}

/*
 * Removes File object from the FormValue.
 * Used to avoid serialzing/sending File object back to the client.
 */
export function stripFiles<
	Type extends string | number | boolean | File | null,
>(
	value: Record<string, FormValue<Type>>,
): Record<string, FormValue<Exclude<Type, File>>> {
	const json = JSON.stringify(value, (_, value) => {
		// If the current value is a File, return undefined to omit it
		if (typeof File !== 'undefined' && value instanceof File) {
			return undefined;
		}
		return value;
	});

	return JSON.parse(json);
}

/**
 * Helper to get readable type name for error messages
 */
export function getTypeName(value: unknown): string {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'Array';
	if (typeof value === 'object') {
		return value.constructor?.name ?? 'Object';
	}
	return typeof value;
}
