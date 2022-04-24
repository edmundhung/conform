import type { FieldConfig, FieldType, InputType } from 'form-validity';
import {
	patchNativeConstraints,
	unflatten,
	getDataByName,
} from 'form-validity';

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

export type Field<Type extends FieldType = FieldType> = (Type extends
	| 'checkbox'
	| 'file'
	| 'radio'
	? FieldCreator<'required'>
	: Type extends 'date' | 'datetime-local' | 'month' | 'time' | 'week'
	? FieldCreator<'required' | 'range:date' | 'step'>
	: Type extends 'email' | 'password' | 'search' | 'tel' | 'text' | 'url'
	? FieldCreator<'required' | 'length' | 'pattern'>
	: Type extends 'number'
	? FieldCreator<'required' | 'range:number' | 'step'>
	: Type extends 'range'
	? FieldCreator<'range:number' | 'step'>
	: Type extends 'select'
	? FieldCreator<'required'>
	: Type extends 'textarea'
	? FieldCreator<'required' | 'length'>
	: Type extends 'fieldset'
	? {}
	: Type extends 'fieldset-array'
	? FieldCreator<'range:number'>
	: never) & { [symbol]: FieldConfig<Type> };

function configureF() {
	function createField<Tag extends FieldTag>(config: FieldConfig<Tag>) {
		return {
			required(message?: string) {
				return createField({
					...config,
					required: true,
					validity: {
						...config.validity,
						valueMissing: message,
					},
				});
			},
			min(value: number | Date, message?: string) {
				return createField({
					...config,
					min: value instanceof Date ? value.toISOString() : value.toString(),
					validity: {
						...config.validity,
						rangeUnderflow: message,
					},
				});
			},
			max(value: number | Date, message?: string) {
				return createField({
					...config,
					max: value instanceof Date ? value.toISOString() : value.toString(),
					validity: {
						...config.validity,
						rangeOverflow: message,
					},
				});
			},
			minLength(value: number, message?: string) {
				return createField({
					...config,
					minLength: value,
					validity: {
						...config.validity,
						tooShort: message,
					},
				});
			},
			maxLength(value: number, message?: string) {
				return createField({
					...config,
					maxLength: value,
					validity: {
						...config.validity,
						tooLong: message,
					},
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
					pattern: value.source,
					validity: {
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
	): Field<T>;
	function input<T extends 'email' | 'number' | 'url'>(
		type: T,
		message?: string,
	): Field<T>;
	function input<T extends Exclude<InputType, 'email' | 'number' | 'url'>>(
		type: T,
	): Field<T>;
	function input<T extends InputType>(
		type: T,
		messageOrOptions?: string | string[],
	): Field<T> {
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
			type,
			options,
			validity: {
				typeMismatch: message,
			},
		});
	}

	function select(): Field<'select'> {
		return createField({
			type: 'select',
		});
	}

	function textarea(): Field<'textarea'> {
		return createField({
			type: 'textarea',
		});
	}

	function fieldset(): Field<'fieldset'>;
	function fieldset(count: number): Field<'fieldset-array'>;
	function fieldset(
		count?: number,
	): Field<'fieldset'> | Field<'fieldset-array'> {
		// @ts-expect-error
		return createField({
			type: typeof count === 'undefined' ? 'fieldset' : 'fieldset-array',
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
		const message = validate(value ?? '', config);

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

	if (config?.type === 'fieldset' || config?.type === 'fieldset-array') {
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

function validate(value: FormDataEntryValue, config: FieldConfig): string {
	const { constraints } = patchNativeConstraints(config, [
		'valueMissing',
		'badInput',
		'tooShort',
		'tooLong',
		'rangeUnderflow',
		'rangeOverflow',
		'stepMismatch',
		'patternMismatch',
	]);

	for (let constraint of constraints ?? []) {
		if (!constraint.isValid(value)) {
			return constraint.message;
		}
	}

	return '';
}
