import {
	formatPaths,
	getPaths,
	getValue,
	isPlainObject,
	setValue,
} from 'conform-dom';

export function isNonNullable<T>(value: T): value is NonNullable<T> {
	return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
	return typeof value === 'number';
}

export function isOptionalString(value: unknown): value is string | undefined {
	return typeof value === 'undefined' || typeof value === 'string';
}

export function isOptionalNumber(value: unknown): value is number | undefined {
	return typeof value === 'undefined' || typeof value === 'number';
}

export function getList(initialValue: unknown, name: string) {
	const paths = getPaths(name);
	const data = getValue(initialValue, paths) ?? [];

	if (!Array.isArray(data)) {
		throw new Error(
			`Update state failed; The initialValue at "${name}" is not an array`,
		);
	}

	// Make a copy of the currnet list data
	return Array.from(data);
}

/**
 * Format based on a prefix and a path
 * @example
 * ```js
 * formatName(undefined, 'todos'); // "todos"
 * formatName('todos', 0); // "todos[0]"
 * formatName('todos[0]', 'content'); // "todos[0].content"
 * formatName('todos[0].content', undefined); // "todos[0].content"
 * ```
 */
export function formatName(prefix: string | undefined, path?: string | number) {
	return typeof path !== 'undefined'
		? formatPaths([...getPaths(prefix), path])
		: prefix ?? '';
}

/**
 * Check if a name match the prefix paths
 */
export function isPrefix(name: string, prefix: string) {
	if (name === prefix) {
		return true;
	}

	const paths = getPaths(name);
	const prefixPaths = getPaths(prefix);

	return (
		paths.length > prefixPaths.length &&
		prefixPaths.every((path, index) => paths[index] === path)
	);
}

/**
 * Flatten a tree into a dictionary
 */
export function flatten<Value>(
	data: unknown,
	// @ts-expect-error ?
	select: (value: unknown) => Value = identiy,
	prefix?: string,
): Record<string, NonNullable<Value>> {
	const result: Record<string, NonNullable<Value>> = {};

	function process(data: unknown, prefix: string) {
		const value = select(data);

		if (typeof value !== 'undefined' && value !== null) {
			result[prefix] = value;
		}

		if (Array.isArray(data)) {
			for (let i = 0; i < data.length; i++) {
				process(data[i], `${prefix}[${i}]`);
			}
		} else if (isPlainObject(data)) {
			for (const [key, value] of Object.entries(data)) {
				process(value, prefix ? `${prefix}.${key}` : key);
			}
		}
	}

	if (data) {
		process(data, prefix ?? '');
	}

	return result;
}

export function configureListIndexUpdate(
	listName: string,
	update: (index: number) => number | null,
): (name: string) => string | null {
	const listPaths = getPaths(listName);

	return (name: string) => {
		const paths = getPaths(name);

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

					return formatPaths(paths);
				}
			}
		}

		return name;
	};
}

/**
 * As identity function that returns the input value
 */
export function identiy<Value>(value: Value): Value {
	return value;
}

export function deepEqual<Value>(prev: Value, next: Value): boolean {
	if (prev === next) {
		return true;
	}

	if (!prev || !next) {
		return false;
	}

	if (Array.isArray(prev) && Array.isArray(next)) {
		if (prev.length !== next.length) {
			return false;
		}

		for (let i = 0; i < prev.length; i++) {
			if (!deepEqual(prev[i], next[i])) {
				return false;
			}
		}

		return true;
	}

	if (isPlainObject(prev) && isPlainObject(next)) {
		const prevKeys = Object.keys(prev);
		const nextKeys = Object.keys(next);

		if (prevKeys.length !== nextKeys.length) {
			return false;
		}

		for (const key of prevKeys) {
			if (
				!Object.prototype.hasOwnProperty.call(next, key) ||
				// @ts-expect-error FIXME
				!deepEqual(prev[key], next[key])
			) {
				return false;
			}
		}

		return true;
	}

	return false;
}

export function mergeObjects<
	Obj extends Record<string | number | symbol, unknown>,
>(obj1: Obj, obj2: Obj, overwrite: boolean) {
	let result = obj1;

	for (const key in obj2) {
		const val1 = obj1[key];
		const val2 = obj2[key];

		let value = val2;

		// If both objects have the same key, determine how to merge
		if (Object.prototype.hasOwnProperty.call(obj1, key)) {
			if (Array.isArray(val1) && Array.isArray(val2)) {
				value = val2;
			} else if (isPlainObject(val1) && isPlainObject(val2)) {
				value = mergeObjects(val1, val2, overwrite);
			} else {
				value = overwrite ? val2 : val1;
			}
		}

		if (result[key] !== value) {
			if (result === obj1) {
				// If the result is still the same object, clone it
				result = setValue(obj1, [key], value, { clone: true });
			} else {
				// Otherwise, update the result object
				result[key] = value;
			}
		}
	}

	return result;
}

/**
 * Create a copy of the object with the updated properties if there is any change
 */
export function updateObject<Obj extends Record<string, any>>(
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

export function mapKeys<Value>(
	obj: Record<string, Value>,
	fn: (key: string) => string | null,
) {
	const result: Record<string, Value> = {};
	let hasNoChange = true;

	for (const [key, value] of Object.entries(obj)) {
		const name = fn(key);
		if (name !== key) {
			hasNoChange = false;
		}

		if (name !== null) {
			result[name] = value;
		}
	}

	if (hasNoChange) {
		return obj;
	}

	return result;
}

export function addItems<Item>(list: Array<Item>, items: Array<Item>) {
	return items.reduce((result, item) => {
		if (result.includes(item)) {
			return result;
		}

		return result.concat(item);
	}, list);
}

export function mapItems<Item>(
	list: Array<NonNullable<Item>>,
	fn: (value: Item) => Item | null,
): Array<Item> {
	let hasNoChange = true;
	const updated = list.reduce<Array<Item>>((result, item) => {
		const value = fn(item);

		if (value !== item || value === null) {
			hasNoChange = false;
		}

		if (value !== null) {
			result.push(value);
		}

		return result;
	}, []);

	if (hasNoChange) {
		return list;
	}

	return updated;
}

export function getSubmitEvent(
	event: React.FormEvent<HTMLFormElement>,
): SubmitEvent {
	if (event.type !== 'submit') {
		throw new Error('The event is not a submit event');
	}

	return event.nativeEvent as SubmitEvent;
}

export type FormRef =
	| React.RefObject<
			| HTMLFormElement
			| HTMLFieldSetElement
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLButtonElement
	  >
	| string;

export function getFormElement(
	formRef: FormRef | undefined,
): HTMLFormElement | null {
	if (typeof formRef === 'string') {
		return document.forms.namedItem(formRef);
	}

	const element = formRef?.current;

	if (element instanceof HTMLFormElement) {
		return element;
	}

	return element?.form ?? null;
}

export function updateFieldValue(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	value: string | string[],
): void {
	if (
		element instanceof HTMLInputElement &&
		(element.type === 'checkbox' || element.type === 'radio')
	) {
		const wasChecked = element.checked;
		const willChecked = Array.isArray(value)
			? value.includes(element.value)
			: element.value === value;

		if (wasChecked !== willChecked) {
			element.click();
			return;
		}
	} else if (element instanceof HTMLSelectElement) {
		let updated = false;
		const selectedValue = Array.isArray(value) ? [...value] : [value];

		for (const option of element.options) {
			const index = selectedValue.indexOf(option.value);
			const selected = index > -1;

			// Update the selected state of the option
			if (option.selected !== selected) {
				option.selected = selected;
				updated = true;
			}
			// Remove the option from the selected array
			if (selected) {
				selectedValue.splice(index, 1);
			}
		}

		// Add the remaining options to the select element
		for (const option of selectedValue) {
			updated = true;

			if (typeof option === 'string') {
				element.options.add(new Option(option, option, false, true));
			}
		}

		if (!updated) {
			return;
		}
	} else {
		// No `change` event will be triggered on React if `element.value` is already updated
		if (element.value === value) {
			return;
		}

		/**
		 * Triggering react custom change event
		 * Solution based on dom-testing-library
		 * @see https://github.com/facebook/react/issues/10135#issuecomment-401496776
		 * @see https://github.com/testing-library/dom-testing-library/blob/main/src/events.js#L104-L123
		 */
		const { set: valueSetter } =
			Object.getOwnPropertyDescriptor(element, 'value') || {};
		const prototype = Object.getPrototypeOf(element);
		const { set: prototypeValueSetter } =
			Object.getOwnPropertyDescriptor(prototype, 'value') || {};

		if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
			prototypeValueSetter.call(element, value);
		} else {
			if (valueSetter) {
				valueSetter.call(element, value);
			} else {
				throw new Error('The given element does not have a value setter');
			}
		}
	}

	// Dispatch input event with the updated input value
	element.dispatchEvent(new InputEvent('input', { bubbles: true }));
	// Dispatch change event (necessary for select to update the selected option)
	element.dispatchEvent(new Event('change', { bubbles: true }));
}
