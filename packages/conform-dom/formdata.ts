import { isPlainObject } from './util';

/**
 * Returns the paths from a name based on the JS syntax convention
 * @example
 * ```js
 * const paths = getPaths('todos[0].content'); // ['todos', 0, 'content']
 * ```
 */
export function getPaths(name: string | undefined): Array<string | number> {
	if (!name) {
		return [];
	}

	return name
		.split(/\.|(\[\d*\])/)
		.reduce<Array<string | number>>((result, segment) => {
			if (
				typeof segment !== 'undefined' &&
				segment !== '' &&
				segment !== '__proto__' &&
				segment !== 'constructor' &&
				segment !== 'prototype'
			) {
				if (segment.startsWith('[') && segment.endsWith(']')) {
					const index = segment.slice(1, -1);

					result.push(Number(index));
				} else {
					result.push(segment);
				}
			}
			return result;
		}, []);
}

/**
 * Returns a formatted name from the paths based on the JS syntax convention
 * @example
 * ```js
 * formatPaths([]); // ""
 * formatPaths(['email']); // "email"
 * formatPaths(['address', 'city']); // "address.city"
 * formatPaths(['todos', 0, 'content']); // "todos[0].content"
 * ```
 */
export function formatPaths(paths: Array<string | number>): string {
	return paths.reduce<string>((name, path) => {
		if (typeof path === 'number') {
			return `${name}[${Number.isNaN(path) ? '' : path}]`;
		}

		if (name === '' || path === '') {
			return [name, path].join('');
		}

		return [name, path].join('.');
	}, '');
}

/**
 * Assign a value to a target object by following the paths
 */
export function setValue<Data extends Record<string, any>>(
	data: Data,
	paths: Array<string | number>,
	value: unknown | ((currentValue: unknown) => unknown),
	handle: <Value>(value: Value) => Value = (i) => i,
): Data {
	if (paths.length === 0) {
		throw new Error('Setting value to the object root is not supported');
	}

	// Clone the paths to prevent mutation
	const remainingPaths = paths.slice();
	const result = handle(data);

	let target: any = result;

	while (remainingPaths.length > 0) {
		const path = remainingPaths.shift();
		const nextPath = remainingPaths[0];

		if (typeof path === 'undefined' || path in Object.prototype) {
			break;
		}

		const nextValue = getValue(target, [path]);

		if (typeof nextPath === 'undefined') {
			target[path] = typeof value === 'function' ? value(nextValue) : value;
		} else {
			target[path] = handle(
				nextValue ?? (typeof nextPath === 'number' ? [] : {}),
			);
		}

		target = target[path];
	}

	return result;
}

/**
 * Retrive the value from a target object by following the paths
 */
export function getValue(
	target: unknown,
	paths: Array<string | number>,
): unknown {
	let pointer = target;

	for (const path of paths) {
		if (typeof pointer === 'undefined' || pointer == null) {
			break;
		}

		if (!Object.prototype.hasOwnProperty.call(pointer, path)) {
			return;
		}

		if (isPlainObject(pointer) && typeof path === 'string') {
			pointer = pointer[path];
		} else if (Array.isArray(pointer) && typeof path === 'number') {
			pointer = pointer[path];
		} else {
			throw new Error(
				`Failed to access the value; The path ${path} from ${name} is invalid`,
			);
		}
	}

	return pointer;
}
