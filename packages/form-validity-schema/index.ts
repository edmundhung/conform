import type { FieldConfig, FieldTag, InputType } from 'form-validity';
import { checkCustomValidity, unflatten, getDataByName } from 'form-validity';

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

type FieldCreator<Constraint extends string> = Custom &
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
			custom(isValid: (value: string) => boolean, message: string) {
				return createField({
					...config,
					constraints: [...(config.constraints ?? [])].concat({
						isValid,
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
		if (typeof count === 'undefined') {
			// @ts-expect-error
			return createField({
				tag: 'fieldset',
				type: 'nested',
			});
		}

		// @ts-expect-error
		return createField({
			tag: 'fieldset',
			type: 'array',
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

export function parse<T>(
	data: unknown,
	schema: Record<string, T>,
): {
	value: Record<string, any>;
	error: Record<string, string> | null;
} {
	const valueEntries: Array<[string, string]> = [];
	const errorEntries: Array<[string, string]> = [];

	for (const [name, field] of flattenSchema(schema)) {
		const value = getDataByName(data, name);
		const config = getFieldConfig(field);
		const validity = validate(value, config);
		const message =
			checkCustomValidity(validity, config) ?? 'The field is invalid';

		if (message) {
			errorEntries.push([name, message]);
		}

		valueEntries.push([name, value]);
	}

	return {
		value: valueEntries.length > 0 ? unflatten(valueEntries) : {},
		error: errorEntries.length > 0 ? unflatten(errorEntries) : null,
	};
}

export function getFieldConfig<Tag extends FieldTag>(
	field: Field<Tag>,
): FieldConfig<Tag> {
	if (typeof field[symbol] === 'undefined') {
		throw new Error('Only field object is accepted');
	}

	return field[symbol];
}

function flattenSchema(item: any, prefix = ''): Array<[string, Field]> {
	let entries: Array<[string, Field]> = [];
	let config: FieldConfig | null = item[symbol] ?? null;

	if (config?.tag === 'fieldset') {
		throw new Error('Validation based on fieldset is not supported');
	}

	if (config) {
		entries.push([prefix, item]);
	} else if (Array.isArray(item)) {
		for (var i = 0; i < item.length; i++) {
			entries.push(...flattenSchema(item[i], `${prefix}[${i}]`));
		}
	} else {
		for (const [key, value] of Object.entries(item)) {
			entries.push(...flattenSchema(value, prefix ? `${prefix}.${key}` : key));
		}
	}

	return entries;
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
