import { isGlobalInstance } from './dom';
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

/**
 * Convert an unknown value into something acceptable for HTML form submission.
 * Returns `undefined` when the value cannot be represented in form data.
 *
 * Input -> Output:
 * - string -> string
 * - null -> '' (empty string)
 * - boolean -> 'on' | '' (checked semantics)
 * - number | bigint -> value.toString()
 * - Date -> value.toISOString()
 * - File -> File
 * - FileList -> File[]
 * - Array -> string[] or File[] if all items serialize to the same kind; otherwise undefined
 * - anything else -> undefined
 */
export function serialize(
	value: unknown,
): string | string[] | File | File[] | undefined {
	function serializePrimitive(value: unknown): string | File | undefined {
		if (typeof value === 'string') {
			return value;
		}

		if (value === null) {
			return '';
		}

		if (typeof value === 'boolean') {
			return value ? 'on' : '';
		}

		if (typeof value === 'number' || typeof value === 'bigint') {
			return value.toString();
		}

		if (value instanceof Date) {
			return value.toISOString();
		}

		if (isGlobalInstance(value, 'File')) {
			return value;
		}
	}

	if (Array.isArray(value)) {
		const options: string[] = [];
		const files: File[] = [];

		for (const item of value) {
			const serialized = serializePrimitive(item);

			if (typeof serialized === 'undefined') {
				return;
			}

			if (typeof serialized === 'string') {
				if (files.length > 0) {
					return;
				}

				options.push(serialized);
			} else {
				if (options.length > 0) {
					return;
				}

				files.push(serialized);
			}
		}

		if (options.length === value.length) {
			return options;
		}

		if (files.length === value.length) {
			return files;
		}

		// If not all items are strings or files, return nothing
	}

	if (isGlobalInstance(value, 'FileList')) {
		return Array.from(value);
	}

	return serializePrimitive(value);
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
