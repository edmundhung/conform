type ValidityKey = Exclude<keyof ValidityState, 'customError' | 'valid'>;

type RequiredField<Constraint extends { type: string }> = Constraint & {
	required: true;
};

type OptionalField<Constraint extends { type: string }> = Constraint & {
	required?: false;
};

type StringConstraint =
	| {
			type: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';
			minLength?: number;
			maxLength?: number;
			pattern?: string;
	  }
	| {
			type: 'datetime-local' | 'date' | 'time';
			min?: string;
			max?: string;
			step?: number;
	  }
	| {
			type: 'select';
			multiple?: false;
	  }
	| {
			type: 'textarea';
			minLength?: number;
			maxLength?: number;
	  }
	| {
			type: 'radio' | 'color';
	  };

type StringArrayConstraint = {
	type: 'select';
	multiple: true;
};

type BooleanConstraint = {
	type: 'checkbox';
	value?: string;
};

type NumberConstraint = {
	type: 'number' | 'range';
	min?: number;
	max?: number;
	step?: number;
};

type FileConstraint = {
	type: 'file';
	multiple?: false;
};

type FileArrayConstraint = {
	type: 'file';
	multiple: true;
};

type FieldConstraint =
	| StringConstraint
	| StringArrayConstraint
	| BooleanConstraint
	| NumberConstraint
	| FileConstraint
	| FileArrayConstraint;

/**
 * A dictionary of field names and corresponding constraints
 *
 * @example
 * ```ts
 * const constraints = {
 *   email: {
 *     type: 'email',
 *     required: true,
 *   },
 *   "password": {
 *     type: 'password',
 *     required: true,
 *   },
 * } satisfies FormConstraints
 * ```
 */
export type FormConstraints = Record<
	string,
	RequiredField<FieldConstraint> | OptionalField<FieldConstraint>
>;

/**
 * Function Arguments of the `formatError` function
 *
 * @example
 * ```ts
 * const formatError = ({ input, formData, value }: FormatErrorArgs) => {
 *   if (input.validity.valueMissing) {
 *     return 'This field is required';
 *   }
 *
 *   return '';
 * };
 * ```
 */
export type FormatErrorArgs<Schema extends FormConstraints = FormConstraints> =
	{
		input: Input;
		formData: FormData;
		value: Partial<InferType<Schema>>;
	};

/**
 * A function that derives the error message for a field
 * based on the ValditiyState, FormData or parsed value. Multiple
 * errors are also supported.
 */
export type FormatErrorFunction<
	Constraints extends FormConstraints = FormConstraints,
	FormError extends string | string[] = string | string[],
> = ({ input, formData, value }: FormatErrorArgs<Constraints>) => FormError;

/**
 * Infer the type of the parsed value based on the schema
 */
export type InferType<Schema extends FormConstraints> = {
	[Key in keyof Schema]: Schema[Key] extends RequiredField<StringConstraint>
		? string
		: Schema[Key] extends OptionalField<StringConstraint>
		? string | undefined
		: Schema[Key] extends RequiredField<StringArrayConstraint>
		? string[]
		: Schema[Key] extends OptionalField<StringArrayConstraint>
		? string[] | undefined
		: Schema[Key] extends RequiredField<NumberConstraint>
		? number
		: Schema[Key] extends OptionalField<NumberConstraint>
		? number | undefined
		: Schema[Key] extends RequiredField<FileConstraint>
		? File
		: Schema[Key] extends OptionalField<BooleanConstraint>
		? File | undefined
		: Schema[Key] extends RequiredField<FileArrayConstraint>
		? File[]
		: Schema[Key] extends OptionalField<FileArrayConstraint>
		? File[] | undefined
		: Schema[Key] extends
				| RequiredField<BooleanConstraint>
				| OptionalField<BooleanConstraint>
		? boolean
		: never;
};

/**
 * A summary of the submission including payload and errors.
 * If there is no error, the parsed value is also included.
 */
export type Submission<Schema extends FormConstraints, FormError> =
	| {
			payload: Record<string, string | string[] | undefined>;
			error: Record<string, FormError | undefined>;
	  }
	| {
			payload: Record<string, string | string[] | undefined>;
			error: null;
			value: InferType<Schema>;
	  };

function ensureSingleValue(
	data: FormData | URLSearchParams,
	name: string,
): FormDataEntryValue {
	invariant(data.has(name), `${name} is missing`);

	const [text, ...rest] = data.getAll(name);

	invariant(rest.length === 0, `${name} is not configured for multiple values`);

	return text;
}

function invariant(condition: boolean, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

/**
 * Check if the file is empty
 */
function isEmptyFile(file: File): boolean {
	return file.name === '' && file.size === 0;
}

/**
 * Check URL validity as if url input type
 */
function isValidURL(url: string): boolean {
	try {
		new URL(url);
	} catch (e) {
		return false;
	}

	return true;
}

/**
 * Check email validity as if email input type
 * @see https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
 */
function isValidEmail(email: string): boolean {
	return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
		email,
	);
}

/**
 * Check if the text matches the pattern as if pattern input attribute
 */
function matchPattern(pattern: string, text: string): boolean {
	if (pattern === '') {
		return text === '';
	}

	let patternString = pattern;

	if (!pattern.startsWith('^')) {
		patternString = `^${patternString}`;
	}

	if (!pattern.endsWith('$')) {
		patternString = `${patternString}$`;
	}

	return new RegExp(patternString).test(text);
}

function getDateConstraint(
	text: string,
	constraint: {
		type: 'datetime-local' | 'date' | 'time';
		min?: string;
		max?: string;
		step?: number;
	},
) {
	let format: (text: string) => string, baseStep: number;

	switch (constraint.type) {
		case 'date':
			invariant(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(text), 'Invalid date');
			format = (date) => `${date}T00:00:00Z`;
			baseStep = 24 * 60 * 60 * 1000;
			break;
		case 'time':
			invariant(/^[0-9]{2}:[0-9]{2}$/.test(text), 'Invalid time');
			const today = new Date().toISOString().slice(0, 10);
			format = (time) => `${today}T${time}Z`;
			baseStep = 1000;
			break;
		case 'datetime-local':
			invariant(
				/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(text),
				'Invalid datetime',
			);
			format = (datetime) => `${datetime}Z`;
			baseStep = 1000;
			break;
	}

	return {
		date: new Date(format(text)),
		min: constraint.min ? new Date(format(constraint.min)) : null,
		max: constraint.max ? new Date(format(constraint.max)) : null,
		step:
			typeof constraint.step !== 'undefined'
				? constraint.step * baseStep
				: null,
	};
}

export interface Input {
	name: string;
	value: string | string[];
	validity: ValidityState;
	type: string;
	required?: boolean;
	min?: number | string;
	max?: number | string;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	multiple?: boolean;
}

function parseField(
	data: FormData | URLSearchParams,
	name: string,
	constraint: RequiredField<StringConstraint> | OptionalField<StringConstraint>,
): { payload: string; value: string };
function parseField(
	data: FormData | URLSearchParams,
	name: string,
	constraint:
		| RequiredField<StringConstraint | StringArrayConstraint>
		| OptionalField<StringConstraint | StringArrayConstraint>,
): { payload: string | string[]; value: string | string[] };
function parseField(
	data: FormData | URLSearchParams,
	name: string,
	constraint:
		| RequiredField<BooleanConstraint>
		| OptionalField<BooleanConstraint>,
): { payload: string | undefined; value: boolean };
function parseField(
	data: FormData | URLSearchParams,
	name: string,
	constraint: RequiredField<NumberConstraint> | OptionalField<NumberConstraint>,
): { payload: string; value: number | undefined };
function parseField(
	data: FormData | URLSearchParams,
	name: string,
	constraint:
		| RequiredField<FileConstraint | FileArrayConstraint>
		| OptionalField<FileConstraint | FileArrayConstraint>,
): { payload: File[] | File | undefined; value: File[] | File | undefined };
function parseField(
	data: FormData | URLSearchParams,
	name: string,
	constraint: RequiredField<FieldConstraint> | OptionalField<FieldConstraint>,
): {
	payload: string | string[] | File[] | File | undefined;
	value: string | string[] | number | boolean | File[] | File | undefined;
};
function parseField(
	data: FormData | URLSearchParams,
	name: string,
	constraint: RequiredField<FieldConstraint> | OptionalField<FieldConstraint>,
) {
	switch (constraint.type) {
		case 'text':
		case 'email':
		case 'password':
		case 'url':
		case 'tel':
		case 'search':
		case 'datetime-local':
		case 'date':
		case 'time':
		case 'textarea': {
			const text = ensureSingleValue(data, name);

			invariant(typeof text === 'string', `${name} is not a string`);

			return {
				payload: text,
				value: text,
			};
		}
		case 'number':
		case 'range': {
			const text = ensureSingleValue(data, name);

			invariant(typeof text === 'string', `${name} is not a string`);

			return {
				payload: text,
				value: text !== '' && !isNaN(Number(text)) ? Number(text) : undefined,
			};
		}
		case 'checkbox': {
			const item = data.has(name) ? ensureSingleValue(data, name) : undefined;
			const checkboxValue = constraint.value ?? 'on';

			if (typeof item !== 'undefined') {
				invariant(typeof item === 'string', `${name} is not a string`);
				invariant(
					item === checkboxValue,
					`Expect ${name} to be configured with ${checkboxValue} but recevied ${item}`,
				);
			}

			return {
				payload: item,
				value: typeof item !== 'undefined',
			};
		}
		case 'radio': {
			const text = data.has(name) ? ensureSingleValue(data, name) : undefined;

			if (typeof text !== 'undefined') {
				invariant(typeof text === 'string', `${name} is not a string`);
			}

			return {
				payload: text,
				value: text,
			};
		}
		case 'color': {
			const text = ensureSingleValue(data, name);

			invariant(typeof text === 'string', `${name} is not a string`);
			invariant(/^#[0-9a-f]{6}$/i.test(text), `${name} is not a valid color`);

			return {
				payload: text,
				value: text,
			};
		}
		case 'select': {
			const options = constraint.multiple
				? data.getAll(name)
				: ensureSingleValue(data, name);

			if (Array.isArray(options)) {
				invariant(
					options.every(
						(option): option is string => typeof option === 'string',
					),
					`${name} is not a string`,
				);
			} else {
				invariant(typeof options === 'string', `${name} is not a string`);
			}

			return {
				payload: options,
				value: options,
			};
		}
		case 'file': {
			let files = constraint.multiple
				? data.getAll(name)
				: [ensureSingleValue(data, name)];

			// This is a workaround for a bug on @remix-run/web-fetch
			// @see https://github.com/remix-run/web-std-io/pull/28
			if (files.length === 1 && files[0] === '') {
				files = [new File([], '')];
			}

			invariant(
				files.every((file): file is File => file instanceof File),
				`${name} is not a file`,
			);

			const nonEmptyFiles = files.filter((file) => !isEmptyFile(file));
			// This ensures both payload and value to be undefined if no file is provided
			const result =
				constraint.multiple && nonEmptyFiles.length > 0
					? nonEmptyFiles
					: nonEmptyFiles.at(0);

			return {
				payload: result,
				value: result,
			};
		}
	}
}

/**
 * A function to parse FormData or URLSearchParams based on
 * the constraints and an optional error formatter
 *
 * @see https://conform.guide/api/validitystate#parse
 */
export function parse<
	Constraints extends FormConstraints,
	FormError extends string | string[] = string[],
>(
	data: FormData | URLSearchParams,
	schema: {
		constraints: Constraints;
		formatError?: FormatErrorFunction<Constraints, FormError>;
	},
): Submission<Constraints, FormError> {
	const payloadMap = new Map<keyof Constraints, string | string[]>();
	const controlMap = new Map<keyof Constraints, Input>();
	const errorMap = new Map<keyof Constraints, FormError>();
	const valueMap = new Map<keyof Constraints, unknown>();
	const format =
		schema.formatError ??
		(defaultFormatError as FormatErrorFunction<Constraints, FormError>);

	for (const name in schema.constraints) {
		const constraint = schema.constraints[name];
		const validity: ValidityState = {
			valueMissing: false,
			badInput: false,
			typeMismatch: false,
			patternMismatch: false,
			tooShort: false,
			tooLong: false,
			rangeUnderflow: false,
			rangeOverflow: false,
			stepMismatch: false,
			customError: false,
			valid: true,
		};
		const report = (key: ValidityKey, condition: boolean) => {
			if (!condition) {
				// @ts-expect-error - ValidityState is immutable
				validity[key] = true;
				// @ts-expect-error - ValidityState is immutable
				validity.valid = false;
			}
		};

		switch (constraint.type) {
			case 'text':
			case 'email':
			case 'password':
			case 'url':
			case 'tel':
			case 'search': {
				const { payload, value } = parseField(data, name, constraint);

				payloadMap.set(name, payload);
				valueMap.set(name, value);

				report('valueMissing', !constraint.required || payload !== '');

				if (payload !== '') {
					report(
						'typeMismatch',
						constraint.type === 'email'
							? isValidEmail(payload)
							: constraint.type === 'url'
							? isValidURL(payload)
							: true,
					);
					report('tooShort', payload.length >= (constraint.minLength ?? 0));
					report(
						'tooLong',
						payload.length <= (constraint.maxLength ?? Infinity),
					);
					report(
						'patternMismatch',
						!constraint.pattern || matchPattern(constraint.pattern, payload),
					);
				}
				break;
			}
			case 'number':
			case 'range': {
				const { payload, value } = parseField(data, name, constraint);

				payloadMap.set(name, payload);

				report('valueMissing', !constraint.required || payload !== '');

				if (payload !== '') {
					const isNumber = typeof value !== 'undefined';

					report('badInput', isNumber);

					if (isNumber) {
						const { min = 0, max = Infinity, step = 1 } = constraint;
						valueMap.set(name, value);

						report('rangeUnderflow', value >= min);
						report('rangeOverflow', value <= max);
						report('stepMismatch', (value - min) % step === 0);
					}
				}
				break;
			}
			case 'checkbox': {
				const { payload, value } = parseField(data, name, constraint);

				if (typeof payload !== 'undefined') {
					payloadMap.set(name, payload);
				}

				valueMap.set(name, value);

				report('valueMissing', !constraint.required || value);
				break;
			}
			case 'datetime-local':
			case 'date':
			case 'time': {
				const { payload, value } = parseField(data, name, constraint);

				payloadMap.set(name, payload);

				report('valueMissing', !constraint.required || payload !== '');

				if (payload !== '') {
					const { date, min, max, step } = getDateConstraint(
						payload,
						constraint,
					);
					const isValidDate = !Number.isNaN(date.valueOf());

					report('typeMismatch', isValidDate);

					if (isValidDate) {
						valueMap.set(name, value);

						report('rangeUnderflow', min === null || date >= min);
						report('rangeOverflow', max === null || date <= max);
						report(
							'stepMismatch',
							step === null ||
								(date.valueOf() - (min?.valueOf() ?? 0)) % step === 0,
						);
					}
				}
				break;
			}
			case 'radio': {
				const { payload, value } = parseField(data, name, constraint);

				if (typeof payload !== 'undefined') {
					payloadMap.set(name, payload);
					valueMap.set(name, value);
				}

				report(
					'valueMissing',
					!constraint.required || typeof payload !== 'undefined',
				);
				break;
			}
			case 'color': {
				const { payload, value } = parseField(data, name, constraint);

				invariant(typeof payload === 'string', `${name} is not a string`);
				invariant(
					/^#[0-9a-f]{6}$/i.test(payload),
					`${name} is not a valid color`,
				);

				payloadMap.set(name, payload);
				valueMap.set(name, value);

				report('valueMissing', !constraint.required || payload !== '');
				break;
			}
			case 'select': {
				const { payload, value } = parseField(data, name, constraint);

				payloadMap.set(name, payload);
				valueMap.set(name, value);

				if (constraint.required) {
					if (Array.isArray(value)) {
						report('valueMissing', value.length > 0);
					} else {
						report('valueMissing', value !== '');
					}
				}
				break;
			}
			case 'textarea': {
				const { payload, value } = parseField(data, name, constraint);

				payloadMap.set(name, payload);
				valueMap.set(name, value);

				report('valueMissing', !constraint.required || payload !== '');

				if (payload) {
					report('tooShort', payload.length >= (constraint.minLength ?? 0));
					report(
						'tooLong',
						payload.length <= (constraint.maxLength ?? Infinity),
					);
				}
				break;
			}
			case 'file': {
				const { payload, value } = parseField(data, name, constraint);

				report(
					'valueMissing',
					!constraint.required || typeof payload !== 'undefined',
				);

				if (value) {
					valueMap.set(name, value);
				}
				break;
			}
		}

		controlMap.set(name, {
			name,
			value: payloadMap.get(name) ?? '',
			validity,
			...constraint,
		});
	}

	const value = Object.fromEntries(valueMap) as InferType<Constraints>;

	for (const [name, input] of controlMap) {
		const error = format({ input, formData: data as FormData, value });

		if (Array.isArray(error) ? error.length > 0 : error !== '') {
			errorMap.set(name, error);
		}
	}

	if (errorMap.size > 0) {
		return {
			payload: Object.fromEntries(payloadMap),
			error: Object.fromEntries(errorMap),
		};
	}

	return {
		payload: Object.fromEntries(payloadMap),
		error: null,
		value,
	};
}

/**
 * Validate a form based on the given schema and error formatter.
 * Error will be set to the form element using the `setCustomValidity` method.
 *
 * @see https://conform.guide/api/validitystate#validate
 */
export function validate<Constraints extends FormConstraints>(
	form: HTMLFormElement,
	schema: {
		constraints: Constraints;
		formatError: FormatErrorFunction<Constraints>;
	},
): void {
	const formData = new FormData(form);
	const value = Object.keys(schema.constraints).reduce<
		Partial<InferType<Constraints>>
	>((result, name) => {
		const constraint = schema.constraints[name];
		const field = parseField(formData, name, constraint);

		if (typeof field.value !== 'undefined') {
			// @ts-expect-error Tests will prove that the type is valid :)
			result[name] = field.value;
		}

		return result;
	}, {});

	for (const element of form.elements) {
		const input = element as
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLButtonElement;

		if (input.name && input.willValidate) {
			const error = ([] as string[]).concat(
				schema.formatError({ input, value, formData }),
			);

			input.setCustomValidity(error.join(String.fromCharCode(31, 32)));
		}
	}
}

/**
 * The default error formatter used by parse to represent error by all failed validation attributes.
 *
 * @see https://conform.guide/api/validitystate#defaultformaterror
 * @example
 * ```json
 * ["required", "type", "min", "max", "step", "minlength", "maxlength", "pattern"]
 * ```
 */

export function defaultFormatError<
	T extends FormConstraints = FormConstraints,
>({ input }: FormatErrorArgs<T>): string[] {
	const messages = [] as string[];

	if (input.validity.valueMissing) {
		messages.push('required');
	}

	if (input.validity.typeMismatch || input.validity.badInput) {
		messages.push('type');
	}

	if (input.validity.rangeOverflow) {
		messages.push('max');
	}

	if (input.validity.rangeUnderflow) {
		messages.push('min');
	}

	if (input.validity.stepMismatch) {
		messages.push('step');
	}

	if (input.validity.tooShort) {
		messages.push('minlength');
	}

	if (input.validity.tooLong) {
		messages.push('maxlength');
	}

	if (input.validity.patternMismatch) {
		messages.push('pattern');
	}

	return messages;
}

/**
 * Get the actual error messages stored on the `validationMessage` property.
 *
 * @see https://conform.guide/api/validitystate#geterror
 * @example
 * ```ts
 * const error = getError(input.validationMessage);
 * ```
 */
export function getError(validationMessage: string): string[] {
	return validationMessage
		? validationMessage.split(String.fromCharCode(31, 32))
		: [];
}
