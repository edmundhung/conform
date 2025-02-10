import {
	formatPaths,
	FormError,
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

export function getListValue(
	formValue: Record<string, unknown> | null,
	name: string,
): Array<unknown> {
	const paths = getPaths(name);
	const value = getValue(formValue, paths) ?? [];

	if (!Array.isArray(value)) {
		throw new Error(`The value of "${name}" is not an array`);
	}

	return value;
}

export function insertItem<Item>(
	list: Array<Item>,
	item: Item,
	index: number,
): void {
	list.splice(index, 0, item);
}

export function removeItem(list: Array<unknown>, index: number): void {
	list.splice(index, 1);
}

export function reorderItems(
	list: Array<unknown>,
	fromIndex: number,
	toIndex: number,
): void {
	list.splice(toIndex, 0, ...list.splice(fromIndex, 1));
}

/**
 * Format based on a prefix and a path
 * @example
 * ```js
 * getName(undefined, 'todos'); // "todos"
 * getName('todos', 0); // "todos[0]"
 * getName('todos[0]', 'content'); // "todos[0].content"
 * getName('todos[0].content', undefined); // "todos[0].content"
 * ```
 */
export function getName(prefix: string | undefined, path?: string | number) {
	return typeof path !== 'undefined'
		? formatPaths([...getPaths(prefix), path])
		: prefix ?? '';
}

/**
 * Compare the parent and child paths to get the relative paths
 * Returns null if the child paths do not start with the parent paths
 */
export function getChildPaths(
	parentNameOrPaths: string | Array<string | number>,
	childName: string,
) {
	const parentPaths =
		typeof parentNameOrPaths === 'string'
			? getPaths(parentNameOrPaths)
			: parentNameOrPaths;
	const childPaths = getPaths(childName);

	if (
		childPaths.length >= parentPaths.length &&
		parentPaths.every((path, index) => childPaths[index] === path)
	) {
		return childPaths.slice(parentPaths.length);
	}

	return null;
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

export function resolveValidateResult<FormShape, ErrorShape, Value>(
	result:
		| FormError<FormShape, ErrorShape>
		| null
		| {
				error: FormError<FormShape, ErrorShape> | null;
				value?: Value;
		  },
): {
	error: FormError<FormShape, ErrorShape> | null;
	value?: Value;
} {
	if (result !== null && 'error' in result) {
		return result;
	}

	return {
		error: result,
	};
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
>(obj1: Obj, obj2: Obj) {
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
				value = mergeObjects(val1, val2);
			} else {
				value = val2;
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
export function mutate<Obj extends Record<string, any>>(
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
			| null
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

/**
 * Updates the DOM element with the provided value.
 *
 * @param element The form element to update
 * @param options The options to update the form element
 */
export function updateFieldValue(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	options: {
		value?: string | string[];
		defaultValue?: string | string[];
	},
) {
	const value =
		typeof options.value === 'undefined'
			? null
			: Array.isArray(options.value)
				? options.value
				: [options.value];
	const defaultValue =
		typeof options.defaultValue === 'undefined'
			? null
			: Array.isArray(options.defaultValue)
				? options.defaultValue
				: [options.defaultValue];

	if (element instanceof HTMLInputElement) {
		switch (element.type) {
			case 'checkbox':
			case 'radio':
				if (value) {
					element.checked = value.includes(element.value);
				}
				if (defaultValue) {
					element.defaultChecked = defaultValue.includes(element.value);
				}
				break;
			case 'file':
				// Do nothing for now
				break;
			default:
				if (value) {
					element.value = value[0] ?? '';
				}
				if (defaultValue) {
					element.defaultValue = defaultValue[0] ?? '';
				}
				break;
		}
	} else if (element instanceof HTMLSelectElement) {
		for (const option of element.options) {
			if (value) {
				const index = value.indexOf(option.value);
				const selected = index > -1;

				// Update the selected state of the option
				if (option.selected !== selected) {
					option.selected = selected;
				}

				// Remove the option from the value array
				if (selected) {
					value.splice(index, 1);
				}
			}
			if (defaultValue) {
				const index = defaultValue.indexOf(option.value);
				const selected = index > -1;

				// Update the selected state of the option
				if (option.selected !== selected) {
					option.defaultSelected = selected;
				}

				// Remove the option from the defaultValue array
				if (selected) {
					defaultValue.splice(index, 1);
				}
			}
		}

		// We have already removed all selected options from the value and defaultValue array at this point
		const missingOptions = new Set([...(value ?? []), ...(defaultValue ?? [])]);

		for (const optionValue of missingOptions) {
			element.options.add(
				new Option(
					optionValue,
					optionValue,
					defaultValue?.includes(optionValue),
					value?.includes(optionValue),
				),
			);
		}
	} else {
		if (value) {
			/**
			 * Triggering react custom change event
			 * Solution based on dom-testing-library
			 * @see https://github.com/facebook/react/issues/10135#issuecomment-401496776
			 * @see https://github.com/testing-library/dom-testing-library/blob/main/src/events.js#L104-L123
			 */
			const inputValue = value[0] ?? '';
			const { set: valueSetter } =
				Object.getOwnPropertyDescriptor(element, 'value') || {};
			const prototype = Object.getPrototypeOf(element);
			const { set: prototypeValueSetter } =
				Object.getOwnPropertyDescriptor(prototype, 'value') || {};

			if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
				prototypeValueSetter.call(element, inputValue);
			} else {
				if (valueSetter) {
					valueSetter.call(element, inputValue);
				} else {
					throw new Error('The given element does not have a value setter');
				}
			}
		}
		if (defaultValue) {
			element.defaultValue = defaultValue[0] ?? '';
		}
	}
}

export function updateValidationAttributes(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	attributes: {
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		min?: string | number;
		max?: string | number;
		step?: string | number;
		multiple?: boolean;
		pattern?: string;
	},
): void {
	if (
		typeof attributes.required !== 'undefined' &&
		// If the element is a part of the checkbox group, it is unclear whether all checkboxes are required or only one.
		!(
			element.type === 'checkbox' &&
			element.form?.elements.namedItem(element.name) instanceof RadioNodeList
		)
	) {
		element.required = attributes.required;
	}

	if (typeof attributes.multiple !== 'undefined' && 'multiple' in element) {
		element.multiple = attributes.multiple;
	}

	if (typeof attributes.minLength !== 'undefined' && 'minLength' in element) {
		element.minLength = attributes.minLength;
	}

	if (typeof attributes.maxLength !== 'undefined' && 'maxLength' in element) {
		element.maxLength = attributes.maxLength;
	}
	if (typeof attributes.min !== 'undefined' && 'min' in element) {
		element.min = `${attributes.min}`;
	}

	if (typeof attributes.max !== 'undefined' && 'max' in element) {
		element.max = `${attributes.max}`;
	}

	if (typeof attributes.step !== 'undefined' && 'step' in element) {
		element.step = `${attributes.step}`;
	}

	if (typeof attributes.pattern !== 'undefined' && 'pattern' in element) {
		element.pattern = attributes.pattern;
	}
}
