/**
 * form-validity
 */
type FieldTag = 'input' | 'textarea' | 'select' | 'fieldset';

type InputType =
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

type Constraints =
	| 'required'
	| 'length'
	| 'range:date'
	| 'range:number'
	| 'step'
	| 'pattern'
	| 'multiple';

interface Required {
	required(message?: string): this;
}

interface Range<Value> {
	min(value: Value | string, message?: string): this;
	max(value: Value | string, message?: string): this;
}

interface Length {
	minLength(number: number, message?: string): this;
	maxLength(number: number, message?: string): this;
}

interface Pattern {
	pattern(regexp: RegExp, message?: string): this;
}

interface Step {
	step(number: number | string, message?: string): this;
}

interface Multiple {
	multiple(): this;
}

type FieldCreator<Constraint extends Constraints> =
	('required' extends Constraint ? Required : {}) &
		('length' extends Constraint ? Length : {}) &
		('range:date' extends Constraint ? Range<Date> : {}) &
		('range:number' extends Constraint ? Range<number> : {}) &
		('step' extends Constraint ? Step : {}) &
		('pattern' extends Constraint ? Pattern : {}) &
		('multiple' extends Constraint ? Multiple : {});

type FieldConfig<Tag extends FieldTag = FieldTag> = {
	tag: Tag;
	type?: {
		value: InputType;
		message: string | undefined;
	};
	required?: {
		message: string | undefined;
	};
	minLength?: {
		value: number;
		message: string | undefined;
	};
	maxLength?: {
		value: number;
		message: string | undefined;
	};
	min?: {
		value: Date | number;
		message: string | undefined;
	};
	max?: {
		value: Date | number;
		message: string | undefined;
	};
	step?: {
		value: number | string;
		message: string | undefined;
	};
	pattern?: Array<{
		value: RegExp;
		message: string | undefined;
	}>;
	multiple?: {
		message: string | undefined;
	};
	options?: string[];
	value?: string;
	count?: number;
};

/**
 * To hide the config from user
 */
const symbol = Symbol('form-validity');

export type Field<
	Tag extends FieldTag = FieldTag,
	Type extends InputType | 'default' | 'array' = 'default',
> = { [symbol]: FieldConfig<Tag> } & (Tag extends 'input'
	? Type extends 'checkbox' | 'file' | 'radio'
		? FieldCreator<'required'>
		: Type extends 'date' | 'datetime-local' | 'month' | 'time' | 'week'
		? FieldCreator<'required' | 'range:date' | 'step'>
		: Type extends 'email' | 'password' | 'search' | 'tel' | 'text' | 'url'
		? FieldCreator<'required' | 'length' | 'pattern'>
		: Type extends 'number'
		? FieldCreator<'required' | 'range:number' | 'step'>
		: Type extends 'range'
		? FieldCreator<'range:number' | 'step'>
		: {}
	: Tag extends 'select'
	? FieldCreator<'required'>
	: Tag extends 'textarea'
	? FieldCreator<'required' | 'length'>
	: Tag extends 'fieldset'
	? Type extends 'array'
		? FieldCreator<'range:number'>
		: {}
	: unknown);

function configureF() {
	function createField<Tag extends FieldTag>(config: FieldConfig<Tag>) {
		return {
			required(message?: string) {
				return createField({
					...config,
					required: { message },
				});
			},
			min(value: number | Date, message?: string) {
				return createField({
					...config,
					min: { value, message },
				});
			},
			max(value: number | Date, message?: string) {
				return createField({
					...config,
					max: { value, message },
				});
			},
			minLength(value: number, message?: string) {
				return createField({
					...config,
					minLength: { value, message },
				});
			},
			maxLength(value: number, message?: string) {
				return createField({
					...config,
					maxLength: { value, message },
				});
			},
			pattern(value: RegExp, message?: string) {
				if (value.global || value.ignoreCase || value.multiline) {
					console.warn(
						`global, ignoreCase, and multiline flags are not supported on the pattern attribute`,
					);

					return createField(config);
				}

				return createField({
					...config,
					pattern: [...(config.pattern ?? [])].concat({
						value,
						message,
					}),
				});
			},
			multiple(message?: string) {
				return createField({
					...config,
					multiple: { message },
				});
			},
			[symbol]: config,
		};
	}

	function input<T extends 'checkbox' | 'radio'>(
		type: T,
		options: string[],
	): Field<'input', T>;
	function input<T extends 'email' | 'number' | 'url'>(
		type: T,
		message?: string,
	): Field<'input', T>;
	function input<T extends Exclude<InputType, 'email' | 'number' | 'url'>>(
		type: T,
	): Field<'input', T>;
	function input<T extends InputType>(
		type: T,
		messageOrOptions?: string | string[],
	): Field<'input', T> {
		const isCheckboxOrRadioButton = type === 'checkbox' || type === 'radio';
		const message =
			!isCheckboxOrRadioButton && !Array.isArray(messageOrOptions)
				? messageOrOptions
				: undefined;
		const options =
			isCheckboxOrRadioButton && Array.isArray(messageOrOptions)
				? messageOrOptions
				: undefined;

		// @ts-expect-error
		return createField({
			tag: 'input',
			type: {
				value: type,
				message,
			},
			options,
		});
	}

	function select(): Field<'select'> {
		return createField({
			tag: 'select',
		});
	}

	function textarea(): Field<'textarea'> {
		return createField({
			tag: 'textarea',
		});
	}

	function fieldset(): Field<'fieldset', 'default'>;
	function fieldset(count: number): Field<'fieldset', 'array'>;
	function fieldset(
		count?: number,
	): Field<'fieldset', 'default'> | Field<'fieldset', 'array'> {
		return createField({
			tag: 'fieldset',
			count,
		});
	}

	return {
		input,
		select,
		textarea,
		fieldset,
	};
}

/**
 * Helpers for constructing the field constraint based on the type
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation#validation-related_attributes
 */
export const f = configureF();

export function getFieldConfig<Tag extends FieldTag>(
	field: Field<Tag>,
): FieldConfig<Tag> {
	if (typeof field[symbol] === 'undefined') {
		throw new Error('Only field object is accepted');
	}

	return field[symbol];
}

export function isElement<T extends HTMLElement>(
	element: any,
	tag: string,
): element is T {
	return !!element && element.tagName.toLowerCase() === tag;
}

export function isDirty(element: unknown): boolean {
	if (isElement<HTMLFormElement>(element, 'form')) {
		for (let el of element.elements) {
			if (isDirty(el)) {
				return true;
			}
		}

		return false;
	}

	if (
		isElement<HTMLInputElement>(element, 'input') ||
		isElement<HTMLTextAreaElement>(element, 'textarea')
	) {
		return element.value !== element.defaultValue;
	}

	if (isElement<HTMLSelectElement>(element, 'select')) {
		return (
			element.value !==
			Array.from(element.options).find((option) => option.defaultSelected)
				?.value
		);
	}

	return false;
}

export function isValidationConstraintSupported(
	element: unknown,
): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
	if (
		!isElement<HTMLInputElement>(element, 'input') &&
		!isElement<HTMLSelectElement>(element, 'select') &&
		!isElement<HTMLTextAreaElement>(element, 'textarea')
	) {
		return false;
	}

	return typeof element.checkValidity === 'function';
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

export function parse<T>(
	payload: FormData | URLSearchParams | string,
	fieldsetCreator:
		| ((value?: Record<string, any>) => Record<string, T>)
		| Record<string, T>,
): {
	value: Record<string, any>;
	error: Record<string, string> | null;
	isDraft: boolean;
} {
	const valueEntries: URLSearchParams | FormData =
		payload instanceof URLSearchParams || payload instanceof FormData
			? payload
			: new URLSearchParams(payload);

	const update = getDraft(valueEntries);
	const value = unflatten(valueEntries);

	if (update) {
		const list = getItem(value, update.name);

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

	const fieldset =
		typeof fieldsetCreator === 'function'
			? fieldsetCreator(value)
			: fieldsetCreator;
	const valueByName = Object.fromEntries(valueEntries);
	const errorEntries: Array<[string, string]> = [];

	if (!update) {
		for (const [name, field] of flattenFieldset(fieldset)) {
			const config = getFieldConfig(field);
			const value = valueByName[name];
			const validity = validate(value, config);
			const message =
				checkCustomValidity(value, validity, config) ?? 'The field is invalid';

			if (message) {
				errorEntries.push([name, message]);
			}
		}
	}

	return {
		value,
		error: errorEntries.length > 0 ? unflatten(errorEntries) : null,
		isDraft: update !== null,
	};
}

/**
 * Helpers
 */

const pattern = /(\w+)\[(\d+)\]/;

function getPaths(key: string): Array<string | number> {
	return key.split('.').flatMap((key) => {
		const matches = pattern.exec(key);

		if (!matches) {
			return key;
		}

		return [matches[1], Number(matches[2])];
	});
}

function getItem(obj: any, key: string, defaultValue?: any): any {
	let target = obj;

	for (let path of getPaths(key)) {
		if (typeof target[path] === 'undefined') {
			return defaultValue;
		}

		target = target[path];
	}

	return target;
}

function flattenFieldset(item: any, prefix = ''): Array<[string, Field]> {
	let entries: Array<[string, Field]> = [];
	let config: FieldConfig | null = item[symbol] ?? null;

	if (config?.tag === 'fieldset') {
		throw new Error('Validation based on fieldset is not supported');
	}

	if (config) {
		entries.push([prefix, item]);
	} else if (Array.isArray(item)) {
		for (var i = 0; i < item.length; i++) {
			entries.push(...flattenFieldset(item[i], `${prefix}[${i}]`));
		}
	} else {
		for (const [key, value] of Object.entries(item)) {
			entries.push(
				...flattenFieldset(value, prefix ? `${prefix}.${key}` : key),
			);
		}
	}

	return entries;
}

function unflatten<T>(
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

function validate(
	value: FormDataEntryValue | undefined,
	config: FieldConfig,
): ValidityState {
	let badInput = false;
	let customError = false;
	let patternMismatch = false;
	let rangeOverflow = false;
	let rangeUnderflow = false;
	let stepMismatch = false;
	let tooLong = false;
	let tooShort = false;
	let typeMismatch = false;
	let valueMissing = false;

	if (value instanceof File) {
		typeMismatch = config.type?.value !== 'file';
	} else {
		const isURL = (value: string) => {
			try {
				new URL(value);
				return true;
			} catch {
				return false;
			}
		};

		patternMismatch =
			config.pattern?.some((pattern) => {
				const match = value?.match(pattern.value);

				return !match || value !== match[0];
			}) ?? false;
		rangeOverflow = config.max
			? (typeof value !== 'undefined' &&
					config.max.value instanceof Date &&
					new Date(value) > config.max.value) ||
			  (typeof value !== 'undefined' &&
					typeof config.max.value === 'number' &&
					Number(value) > config.max.value)
			: false;
		rangeUnderflow = config.min
			? (config.min.value instanceof Date &&
					new Date(value ?? '') < config.min.value) ||
			  (typeof config.min.value === 'number' &&
					Number(value ?? '') < config.min.value)
			: false;
		tooLong = config.maxLength
			? typeof value !== 'undefined' && value.length > config.maxLength.value
			: false;
		tooShort = config.minLength
			? typeof value === 'undefined' || value.length < config.minLength.value
			: false;
		typeMismatch =
			(config.type?.value === 'email' && !/^\S+@\S+$/.test(value ?? '')) ||
			(config.type?.value === 'url' && !isURL(value ?? ''));
		valueMissing = typeof value === 'undefined' || value === '';
	}

	return {
		badInput,
		customError,
		patternMismatch,
		rangeOverflow,
		rangeUnderflow,
		stepMismatch,
		tooLong,
		tooShort,
		typeMismatch,
		valid:
			!badInput &&
			!customError &&
			!patternMismatch &&
			!rangeOverflow &&
			!rangeUnderflow &&
			!stepMismatch &&
			!tooLong &&
			!tooShort &&
			!typeMismatch &&
			!valueMissing,
		valueMissing,
	};
}

export function checkCustomValidity(
	value: FormDataEntryValue,
	validity: ValidityState,
	config: FieldConfig,
): string | null {
	if (config.required && validity.valueMissing) {
		return config.required.message ?? null;
	} else if (config.minLength && validity.tooShort) {
		return config.minLength.message ?? null;
	} else if (config.maxLength && validity.tooLong) {
		return config.maxLength.message ?? null;
	} else if (config.step && validity.stepMismatch) {
		return config.step.message ?? null;
	} else if (config.min && validity.rangeUnderflow) {
		return config.min.message ?? null;
	} else if (config.max && validity.rangeOverflow) {
		return config.max.message ?? null;
	} else if (config.type && (validity.typeMismatch || validity.badInput)) {
		return config.type.message ?? null;
	} else if (config.pattern && validity.patternMismatch) {
		if (config.pattern.length === 1) {
			return config.pattern[0].message ?? null;
		}

		return (
			config.pattern.find((pattern) => pattern.value.test(value as string))
				?.message ?? null
		);
	} else {
		return '';
	}
}
