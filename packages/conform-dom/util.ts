import { isPlainObject } from './formdata';

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

/**
 * The default serialize function for form values.
 */
export function serialize(value: unknown): string | undefined {
	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'boolean') {
		return value ? 'on' : undefined;
	}

	if (typeof value === 'number' || typeof value === 'bigint') {
		return value.toString();
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	return;
}
