import type { FormError } from '@conform-to/dom/future';
import {
	formatPathSegments,
	getPathSegments,
	getValueAtPath,
	updateField,
	isGlobalInstance,
} from '@conform-to/dom/future';

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

export function focusable(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): void {
	if (!element.hidden && element.type !== 'hidden') {
		return;
	}

	// Style the element to be visually hidden
	element.style.position = 'absolute';
	element.style.width = '1px';
	element.style.height = '1px';
	element.style.padding = '0';
	element.style.margin = '-1px';
	element.style.overflow = 'hidden';
	element.style.clip = 'rect(0,0,0,0)';
	element.style.whiteSpace = 'nowrap';
	element.style.border = '0';

	// Hide the element from screen readers
	element.setAttribute('aria-hidden', 'true');

	// Make sure people won't tab to this element
	element.tabIndex = -1;

	// Set the element to be visible again so it can be focused
	if (element.hidden) {
		element.hidden = false;
	}

	if (element.type === 'hidden') {
		element.setAttribute('type', 'text');
	}
}

export function initializeField(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	options:
		| {
				defaultValue?: string | string[] | File | File[] | null;
				defaultChecked?: boolean;
				value?: string;
		  }
		| undefined,
): void {
	if (element.dataset.conform) {
		return;
	}

	const defaultValue =
		typeof options?.value === 'string' ||
		typeof options?.defaultChecked === 'boolean'
			? options.defaultChecked
				? options.value ?? 'on'
				: null
			: options?.defaultValue;

	// Update the value of the element, including the default value
	updateField(element, { value: defaultValue, defaultValue });

	element.dataset.conform = 'initialized';
}

export function getRadioGroupValue(
	inputs: Array<HTMLInputElement>,
): string | undefined {
	for (const input of inputs) {
		if (input.type === 'radio' && input.checked) {
			return input.value;
		}
	}
}

export function getCheckboxGroupValue(
	inputs: Array<HTMLInputElement>,
): string[] | undefined {
	let values: string[] | undefined;

	for (const input of inputs) {
		if (input.type === 'checkbox') {
			values ??= [];
			if (input.checked) {
				values.push(input.value);
			}
		}
	}

	return values;
}

export type InputSnapshot = {
	value?: string;
	options?: string[];
	checked?: boolean;
	files?: File[];
};

export function getInputSnapshot(
	input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
) {
	if (input instanceof HTMLInputElement) {
		switch (input.type) {
			case 'file':
				return {
					files: input.files ? Array.from(input.files) : undefined,
				};
			case 'radio':
			case 'checkbox':
				return {
					value: input.value,
					checked: input.checked,
				};
		}
	} else if (input instanceof HTMLSelectElement && input.multiple) {
		return {
			options: Array.from(input.selectedOptions).map((option) => option.value),
		};
	}

	return {
		value: input.value,
	};
}

export function getDefaultSnapshot(
	defaultValue: string | string[] | File | File[] | FileList | null | undefined,
	defaultChecked: boolean | undefined,
	value: string | undefined,
): InputSnapshot {
	if (typeof value === 'string' || typeof defaultChecked === 'boolean') {
		return {
			value: value ?? 'on',
			checked: defaultChecked,
		};
	}

	if (typeof defaultValue === 'string') {
		return { value: defaultValue };
	}

	if (Array.isArray(defaultValue)) {
		if (
			defaultValue.every((item): item is string => typeof item === 'string')
		) {
			return { options: defaultValue };
		} else {
			return { files: defaultValue };
		}
	}

	if (isGlobalInstance(defaultValue, 'File')) {
		return { files: [defaultValue] };
	}

	if (isGlobalInstance(defaultValue, 'FileList')) {
		return { files: Array.from(defaultValue) };
	}

	return {};
}

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export function isNonNullable<T>(value: T): value is NonNullable<T> {
	return value !== null && value !== undefined;
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
	return typeof value === 'undefined' || typeGuard(value);
}

export function getListValue<Type>(
	formValue: Record<string, Type> | null,
	name: string,
): Array<Type> {
	const value = getValueAtPath(formValue, name) ?? [];

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

export function configureListIndexUpdate(
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

export function mapKeys<Value>(
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

export function addItem<Item>(list: Array<Item>, item: Item) {
	if (list.includes(item)) {
		return list;
	}

	return list.concat(item);
}

export function mapItems<Item>(
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

export function getSubmitEvent(
	event: React.FormEvent<HTMLFormElement>,
): SubmitEvent {
	if (event.type !== 'submit') {
		throw new Error('The event is not a submit event');
	}

	return event.nativeEvent as SubmitEvent;
}

export function generateUniqueKey() {
	return Math.trunc(Date.now() * Math.random()).toString(36);
}
