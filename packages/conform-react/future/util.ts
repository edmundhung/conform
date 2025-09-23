import type { FormError } from '@conform-to/dom/future';
import {
	formatIssues,
	formatPathSegments,
	getPathSegments,
	getValueAtPath,
	isPlainObject,
	setValueAtPath,
} from '@conform-to/dom/future';
import type { StandardSchemaV1 } from './standard-schema';
import { ValidateHandler, ValidateResult } from './types';

export function isUndefined(value: unknown): value is undefined {
	return value === undefined;
}

export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
	return typeof value === 'number';
}

export function isOptional<T>(
	value: unknown,
	typeGuard: (value: unknown) => value is T,
): value is T | undefined {
	return isUndefined(value) || typeGuard(value);
}

export function getArrayAtPath<Type>(
	formValue: Record<string, Type> | null,
	name: string,
): Array<Type> {
	const value = getValueAtPath(formValue, name) ?? [];

	if (!Array.isArray(value)) {
		throw new Error(`The value of "${name}" is not an array`);
	}

	return value;
}

/**
 * Immutably updates a value at the specified path.
 * Empty path replaces the entire object.
 */
export function updateValueAtPath<Data>(
	data: Record<string, Data>,
	name: string,
	value: Data | Record<string, Data>,
): Record<string, Data> {
	if (name === '') {
		if (!isPlainObject(value)) {
			throw new Error('The value must be an object');
		}

		return value;
	}

	return setValueAtPath(data, getPathSegments(name), value, { clone: true });
}

/**
 * Creates a function that updates array indices in field paths.
 * Returns null to remove fields, or updated path with new index.
 */
export function createPathIndexUpdater(
	listName: string,
	update: (index: number) => number | null,
): (name: string) => string | null {
	const listPaths = getPathSegments(listName);

	return (name: string) => {
		const paths = getPathSegments(name);

		if (
			paths.length > listPaths.length &&
			listPaths.every((path, index) => paths[index] === path)
		) {
			const currentIndex = paths[listPaths.length];

			if (typeof currentIndex === 'number') {
				const newIndex = update(currentIndex);

				if (newIndex === null) {
					// To remove the item instead of updating it
					return null;
				}

				if (newIndex !== currentIndex) {
					// Replace the index
					paths.splice(listPaths.length, 1, newIndex);

					return formatPathSegments(paths);
				}
			}
		}

		return name;
	};
}

/**
 * Returns null if error object has no actual error messages,
 * otherwise returns the error as-is.
 */
export function normalizeFormError<ErrorShape>(
	error: FormError<ErrorShape> | null,
): FormError<ErrorShape> | null {
	if (
		error &&
		error.formErrors.length === 0 &&
		Object.entries(error.fieldErrors).every(([, messages]) =>
			Array.isArray(messages) ? messages.length === 0 : !messages,
		)
	) {
		return null;
	}

	return error;
}

export function normalizeValidateResult<ErrorShape, Value>(
	result: ValidateResult<ErrorShape, Value>,
): {
	error: FormError<ErrorShape> | null;
	value?: Value;
} {
	if (result !== null && 'error' in result) {
		return {
			error: normalizeFormError(result.error),
			value: result.value,
		};
	}

	return {
		error: normalizeFormError(result),
	};
}

/**
 * Handles different validation result formats:
 * - Promise: async validation only
 * - Array: [syncResult, asyncPromise]
 * - Object: sync validation only
 */
export function resolveValidateResult<ErrorShape, Value>(
	result: ReturnType<ValidateHandler<ErrorShape, Value>>,
) {
	let syncResult: ValidateResult<ErrorShape, Value> | undefined;
	let asyncResult: Promise<ValidateResult<ErrorShape, Value>> | undefined;

	if (result instanceof Promise) {
		asyncResult = result;
	} else if (Array.isArray(result)) {
		syncResult = result[0];
		asyncResult = result[1];
	} else {
		syncResult = result;
	}

	return {
		syncResult: syncResult ? normalizeValidateResult(syncResult) : undefined,
		asyncResult: asyncResult
			? asyncResult.then(normalizeValidateResult)
			: undefined,
	};
}

export function resolveStandardSchemaResult<Value>(
	result: StandardSchemaV1.Result<Value>,
): {
	error: FormError<string> | null;
	value?: Value;
} {
	if (!result.issues) {
		return {
			error: null,
			value: result.value,
		};
	}

	return {
		error: formatIssues(result.issues),
	};
}

/**
 * Create a copy of the object with the updated properties if there is any change
 */
export function merge<Obj extends Record<string, any>>(
	obj: Obj,
	update: Partial<Obj>,
): Obj {
	if (
		obj === update ||
		Object.entries(update).every(([key, value]) => obj[key] === value)
	) {
		return obj;
	}

	return Object.assign({}, obj, update);
}

/**
 * Transforms object keys using a mapping function.
 * Keys mapped to null are filtered out.
 */
export function transformKeys<Value>(
	obj: Record<string, Value>,
	fn: (key: string) => string | null,
) {
	const result: Record<string, Value> = {};

	for (const [key, value] of Object.entries(obj)) {
		const name = fn(key);

		if (name !== null) {
			result[name] = value;
		}
	}

	return result;
}

/**
 * Appends item to array only if not already present.
 * Returns original array if item exists, new array if added.
 */
export function appendUniqueItem<Item>(list: Array<Item>, item: Item) {
	if (list.includes(item)) {
		return list;
	}

	return list.concat(item);
}

/**
 * Maps over array and filters out null results.
 */
export function compactMap<Item>(
	list: Array<NonNullable<Item>>,
	fn: (value: Item) => Item | null,
): Array<Item> {
	const result: Array<Item> = [];

	for (const item of list) {
		const value = fn(item);

		if (value !== null) {
			result.push(value);
		}
	}

	return result;
}

export function generateUniqueKey() {
	return Math.trunc(Date.now() * Math.random()).toString(36);
}
