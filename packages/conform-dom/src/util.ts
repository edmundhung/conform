import type { FormValue } from './submission';

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
 * Create a shallow clone of the value
 * This allows us to create a new object without mutating the original object
 */
export function shallowClone<Value>(value: Value): Value {
	if (Array.isArray(value)) {
		return value.slice() as Value;
	} else if (isPlainObject(value)) {
		return { ...value } as Value;
	}

	if (value && typeof value === 'object') {
		throw new Error(`${value} is not supported`);
	}

	return value;
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
