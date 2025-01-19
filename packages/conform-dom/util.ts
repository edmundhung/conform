export function invariant(
	expectedCondition: boolean,
	message: string,
): asserts expectedCondition {
	if (!expectedCondition) {
		throw new Error(message);
	}
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
