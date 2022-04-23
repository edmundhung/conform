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

interface Custom {
	custom(validate: (value: string) => boolean, message: string): this;
}

type FieldCreator<Constraint extends Constraints> = Custom &
	('required' extends Constraint ? Required : {}) &
	('length' extends Constraint ? Length : {}) &
	('range:date' extends Constraint ? Range<Date> : {}) &
	('range:number' extends Constraint ? Range<number> : {}) &
	('step' extends Constraint ? Step : {}) &
	('pattern' extends Constraint ? Pattern : {}) &
	('multiple' extends Constraint ? Multiple : {});

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
					// @ts-expect-error
					required: true,
					validity: {
						// @ts-expect-error
						...config.validity,
						valueMissing: message,
					},
				});
			},
			min(value: number | Date, message?: string) {
				return createField({
					...config,
					// @ts-expect-error
					min: value,
					validity: {
						// @ts-expect-error
						...config.validity,
						rangeUnderflow: message,
					},
				});
			},
			max(value: number | Date, message?: string) {
				return createField({
					...config,
					// @ts-expect-error
					max: value,
					validity: {
						// @ts-expect-error
						...config.validity,
						rangeOverflow: message,
					},
				});
			},
			minLength(value: number, message?: string) {
				return createField({
					...config,
					// @ts-expect-error
					minLength: value,
					validity: {
						// @ts-expect-error
						...config.validity,
						tooShort: message,
					},
				});
			},
			maxLength(value: number, message?: string) {
				return createField({
					...config,
					// @ts-expect-error
					maxLength: value,
					validity: {
						// @ts-expect-error
						...config.validity,
						tooLong: message,
					},
				});
			},
			// @ts-expect-error
			pattern(value: RegExp, message?: string) {
				if (value.global || value.ignoreCase || value.multiline) {
					console.warn(
						`global, ignoreCase, and multiline flags are not supported on the pattern attribute`,
					);

					return createField(config);
				}

				return createField({
					...config,
					// @ts-expect-error
					pattern: value,
					validity: {
						// @ts-expect-error
						...config.validity,
						patternMismatch: message,
					},
				});
			},
			custom(constraint: (value: string) => boolean, message: string) {
				return createField({
					...config,
					custom: [...(config.custom ?? [])].concat({
						constraint,
						message,
					}),
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
			// @ts-expect-error
			type,
			options,
			validity: {
				typeMismatch: message,
			},
		});
	}

	function select(): Field<'select'> {
		// @ts-expect-error
		return createField({
			tag: 'select',
		});
	}

	function textarea(): Field<'textarea'> {
		// @ts-expect-error
		return createField({
			tag: 'textarea',
		});
	}

	function fieldset(): Field<'fieldset', 'default'>;
	function fieldset(count: number): Field<'fieldset', 'array'>;
	function fieldset(
		count?: number,
	): Field<'fieldset', 'default'> | Field<'fieldset', 'array'> {
		// @ts-expect-error
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

type Fieldset<Config extends Record<string, Field>> = {
	[Key in keyof Config]: FieldConfig<InferTag<Config[Key]>>;
};

type InferTag<Config> = Config extends Field<infer Tag> ? Tag : never;

export function createFieldset<Config extends Record<string, Field>>(
	config: Config,
): Fieldset<Config> {
	// @ts-ignore
	let result: Fieldset<Config> = {};

	for (const [key, field] of Object.entries<Field>(config)) {
		// @ts-ignore
		result[key as T] = field[symbol];
	}

	return result;
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
		for (const [name, config] of flattenFieldset(fieldset)) {
			const value = valueByName[name];
			const validity = validate(value, config);
			const message =
				checkCustomValidity(validity, config) ?? 'The field is invalid';

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

function flattenFieldset(item: any, prefix = ''): Array<[string, FieldConfig]> {
	let entries: Array<[string, FieldConfig]> = [];

	if (item.tag === 'fieldset') {
		throw new Error('Validation based on fieldset is not supported');
	}

	if (typeof item.tag !== 'undefined') {
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

function isURL(value: string): boolean {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
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
	let valueMissing = typeof value === 'undefined' || value === '';

	if (value instanceof File) {
		typeMismatch = config.tag === 'input' && config.type !== 'file';
	} else {
		typeMismatch =
			config.tag === 'input' &&
			((config.type === 'email' && !/^\S+@\S+$/.test(value ?? '')) ||
				(config.type === 'url' && !isURL(value ?? '')));

		// @ts-expect-error
		if (typeof config.pattern !== 'undefined') {
			// @ts-expect-error
			const match = value?.match(config.pattern);

			patternMismatch = !match || value !== match[0];
		}

		// @ts-expect-error
		if (typeof config.max !== 'undefined') {
			rangeOverflow =
				(typeof value !== 'undefined' &&
					// @ts-expect-error
					config.max instanceof Date &&
					// @ts-expect-error
					new Date(value) > config.max) ||
				(typeof value !== 'undefined' &&
					// @ts-expect-error
					typeof config.max === 'number' &&
					// @ts-expect-error
					Number(value) > config.max);
		}

		// @ts-expect-error
		if (typeof config.min !== 'undefined') {
			rangeUnderflow =
				// @ts-expect-error
				(config.min.value instanceof Date &&
					// @ts-expect-error
					new Date(value ?? '') < config.min.value) ||
				// @ts-expect-error
				(typeof config.min.value === 'number' &&
					// @ts-expect-error
					Number(value ?? '') < config.min.value);
		}

		// @ts-expect-error
		if (typeof config.maxLength !== 'undefined') {
			tooLong =
				// @ts-expect-error
				typeof value !== 'undefined' && value.length > config.maxLength;
		}

		// @ts-expect-error
		if (typeof config.minLength !== 'undefined') {
			tooShort =
				// @ts-expect-error
				typeof value === 'undefined' || value.length < config.minLength;
		}
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
			return config.validity[key] ?? null;
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
	if (isValidationConstraintSupported(field)) {
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

interface BaseField {
	custom?: Array<{
		constraint: (value: string) => boolean;
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

interface FieldsetField extends BaseField {
	tag: 'fieldset';
	count?: number;
}

type InputField =
	| TextField
	| CheckboxOrRadioButton
	| NumericField
	| DateField
	| FileField
	| RangeField;

export type FieldConfig<Tag extends FieldTag = FieldTag> = Tag extends 'input'
	? InputField
	: Tag extends 'select'
	? SelectField
	: Tag extends 'textarea'
	? TextareaField
	: Tag extends 'fieldset'
	? FieldsetField
	: never;
