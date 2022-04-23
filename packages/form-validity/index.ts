export type FieldTag = 'input' | 'select' | 'textarea' | 'fieldset';

export type InputType =
	| 'checkbox'
	| 'color'
	| 'date'
	| 'date'
	| 'datetime-local'
	| 'email'
	| 'fieldset'
	| 'file'
	| 'hidden'
	| 'month'
	| 'number'
	| 'password'
	| 'radio'
	| 'range'
	| 'search'
	| 'select'
	| 'tel'
	| 'text'
	| 'textarea'
	| 'time'
	| 'url'
	| 'week';

interface BaseField {
	constraints?: Array<{
		isValid: (value: string) => boolean;
		message: string;
	}>;
}

interface FileField extends BaseField {
	tag: 'input';
	type: 'file';
	required?: boolean;
	multiple?: boolean;
	options?: string[];
	validity?: {
		valueMissing?: string;
		typeMismatch?: string;
	};
}

interface DateField extends BaseField {
	tag: 'input';
	type: 'date' | 'datetime-local' | 'month' | 'time' | 'week';
	required?: boolean;
	min?: string;
	max?: string;
	step?: string;
	validity?: {
		valueMissing?: string;
		stepMismatch?: string;
		rangeUnderflow?: string;
		rangeOverflow?: string;
		typeMismatch?: string;
		badInput?: string;
	};
}

interface CheckboxOrRadioButton extends BaseField {
	tag: 'input';
	type: 'checkbox' | 'radio';
	required?: boolean;
	options?: string[];
	validity?: {
		valueMissing?: string;
	};
}

interface TextField extends BaseField {
	tag: 'input';
	type: 'email' | 'password' | 'search' | 'tel' | 'text' | 'url';
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	multiple?: boolean;
	validity?: {
		valueMissing?: string;
		tooShort?: string;
		tooLong?: string;
		typeMismatch?: string;
		badInput?: string;
		patternMismatch?: string;
	};
}

interface NumericField extends BaseField {
	tag: 'input';
	type: 'number';
	required?: boolean;
	min?: string;
	max?: string;
	step?: string;
	validity?: {
		valueMissing?: string;
		stepMismatch?: string;
		rangeUnderflow?: string;
		rangeOverflow?: string;
		typeMismatch?: string;
		badInput?: string;
	};
}

interface RangeField extends BaseField {
	tag: 'input';
	type: 'range';
	min?: string;
	max?: string;
	step?: string;
	validity?: {
		stepMismatch?: string;
		rangeUnderflow?: string;
		rangeOverflow?: string;
	};
}

interface SelectField extends BaseField {
	tag: 'select';
	required?: boolean;
	multiple?: boolean;
	validity?: {
		valueMissing?: string;
	};
}

interface TextareaField extends BaseField {
	tag: 'textarea';
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	validity?: {
		valueMissing?: string;
		tooShort?: string;
		tooLong?: string;
		badInput?: string;
	};
}

interface NestedFieldsetField extends BaseField {
	tag: 'fieldset';
	type: 'nested';
}

interface FieldsetArrayField extends BaseField {
	tag: 'fieldset';
	type: 'array';
	count: number;
}

type InputField =
	| TextField
	| CheckboxOrRadioButton
	| NumericField
	| DateField
	| FileField
	| RangeField;

export type FieldConfig<
	Tag extends FieldTag = any,
	Type extends InputType | 'array' | 'default' = any,
> = Tag extends 'input'
	? InputField
	: Tag extends 'select'
	? SelectField
	: Tag extends 'textarea'
	? TextareaField
	: Tag extends 'fieldset'
	? Type extends 'array'
		? FieldsetArrayField
		: NestedFieldsetField
	: never;

export function isElement<T extends HTMLElement>(
	element: any,
	tag: string,
): element is T {
	return !!element && element.tagName.toLowerCase() === tag;
}

export function isFieldElement(
	element: unknown,
): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
	return (
		isElement<HTMLInputElement>(element, 'input') ||
		isElement<HTMLSelectElement>(element, 'select') ||
		isElement<HTMLTextAreaElement>(element, 'textarea')
	);
}

export function shouldSkipValidate(element: unknown) {
	return isElement<HTMLButtonElement>(element, 'button') ||
		isElement<HTMLInputElement>(element, 'input')
		? element.formNoValidate
		: false;
}

export function draftUpdate(name: string, index?: number) {
	return {
		name: '__form-validity__',
		value: [name]
			.concat(typeof index === 'undefined' ? [] : [`${index}`])
			.join('|'),
	};
}

export function getDraft(payload: URLSearchParams | FormData) {
	const update = payload.get('__form-validity__');

	if (!update) {
		return null;
	}

	// We are mutating the payload here
	payload.delete('__form-validity__');

	if (update instanceof File) {
		throw new Error('What?');
	}

	const [name, indexString] = update.split('|');
	const index = typeof indexString !== 'undefined' ? Number(indexString) : null;

	return {
		name,
		index,
	};
}

export function process(payload: FormData | URLSearchParams | string): {
	data: Record<string, any>;
	isDraft: boolean;
} {
	const entries: URLSearchParams | FormData =
		payload instanceof URLSearchParams || payload instanceof FormData
			? payload
			: new URLSearchParams(payload);
	const data = unflatten(entries);
	const update = getDraft(entries);

	if (update) {
		const list = getDataByName(data, update.name);

		if (
			!Array.isArray(list) ||
			(update.index !== null && isNaN(update.index))
		) {
			throw new Error('Oops');
		}

		if (update.index !== null) {
			list.splice(update.index, 1);
		} else {
			list.push({});
		}
	}

	return {
		data,
		isDraft: update !== null,
	};
}

export function getPaths(name: string): Array<string | number> {
	const pattern = /(\w+)\[(\d+)\]/;

	return name.split('.').flatMap((key) => {
		const matches = pattern.exec(key);

		if (!matches) {
			return key;
		}

		return [matches[1], Number(matches[2])];
	});
}

export function getDataByName<T = any>(
	obj: any,
	name: string,
	defaultValue?: T,
): T | undefined {
	let target = obj;

	for (let path of getPaths(name)) {
		if (typeof target[path] === 'undefined') {
			return defaultValue;
		}

		target = target[path];
	}

	return target;
}

export function unflatten<T>(
	entries: Array<[string, T]> | Iterable<[string, T]>,
): any {
	const result: any = {};

	for (let [key, value] of entries) {
		let paths = getPaths(key);
		let length = paths.length;
		let lastIndex = length - 1;
		let index = -1;
		let pointer = result;

		while (pointer != null && ++index < length) {
			let key = paths[index];
			let next = paths[index + 1];
			let newValue = value;

			if (index != lastIndex) {
				newValue = pointer[key] ?? (typeof next === 'number' ? [] : {});
			}

			// if (typeof pointer[key] !== 'undefined') {
			// 	pointer[key] = Array.isArray(pointer[key])
			// 		? pointer[key].concat(newValue)
			// 		: [pointer[key], newValue];
			// } else {
			pointer[key] = newValue;
			// }

			pointer = pointer[key];
		}
	}

	return result;
}

export function checkCustomValidity(
	validity: ValidityState,
	config: FieldConfig,
): string | null {
	const validityKeys: Array<keyof ValidityState> = [
		'valueMissing',
		'tooShort',
		'tooLong',
		'stepMismatch',
		'rangeUnderflow',
		'rangeOverflow',
		'typeMismatch',
		'badInput',
		'patternMismatch',
		'customError',
	];

	for (let key of validityKeys) {
		if (validity[key]) {
			// @ts-ignore
			return config.validity?.[key] ?? null;
		}
	}

	return '';
}

/**
 * Mnaully trigger an invalid event
 * @param field
 */
export function revalidate(field: EventTarget): void {
	field.dispatchEvent(new Event('invalid'));
}

/**
 * Check if the form or field is valid
 * by manually triggering an invalid event and check the final validity
 * @param field
 * @returns
 */
export function checkValidity(field: unknown): boolean {
	if (isFieldElement(field)) {
		// We can skip this if there is no custom validation configured
		revalidate(field);

		// Check the latest validity
		return field.validity.valid;
	} else if (isElement<HTMLFormElement>(field, 'form')) {
		let isValid = true;

		for (let element of Array.from(field.elements)) {
			if (!checkValidity(element)) {
				isValid = false;
			}
		}

		return isValid;
	}

	// Assuming it to be valid and fallback to server validation
	return true;
}
