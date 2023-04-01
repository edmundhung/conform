type ValidityKey = Exclude<keyof ValidityState, 'customError' | 'valid'>;

type RequiredField<Schema extends { type: string }> = Schema & {
	required: true;
};

type OptionalField<Schema extends { type: string }> = Schema & {
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

export type FormSchema = Record<
	string,
	RequiredField<FieldConstraint> | OptionalField<FieldConstraint>
>;

export type Submission<Schema extends FormSchema, ErrorType> =
	| {
			payload: Record<string, string | string[] | undefined>;
			error: Record<string, ErrorType | undefined>;
	  }
	| {
			payload: Record<string, string | string[] | undefined>;
			error: null;
			value: {
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
					: Schema[Key] extends RequiredField<BooleanConstraint>
					? boolean
					: Schema[Key] extends OptionalField<BooleanConstraint>
					? boolean | undefined
					: any;
			};
	  };

function ensureSingleValue(
	data: FormData | URLSearchParams,
	name: string,
): FormDataEntryValue {
	if (!data.has(name)) {
		throw new Error(`${name} is missing`);
	}

	const [text, ...rest] = data.getAll(name);

	if (rest.length > 1) {
		throw new Error(`${name} is not configured for multiple values`);
	}

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
			format = (date) => `${date}T00:00:00`;
			baseStep = 86400000;
			break;
		case 'time':
			invariant(/^[0-9]{2}:[0-9]{2}$/.test(text), 'Invalid time');
			const today = new Date().toISOString().slice(0, 10);
			format = (time) => `${today}T${time}`;
			baseStep = 1000;
			break;
		case 'datetime-local':
			invariant(
				/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(text),
				'Invalid datetime',
			);
			format = (datetime) => datetime;
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

export function parse<Schema extends FormSchema, ErrorType = string[]>(
	data: FormData | URLSearchParams,
	config: {
		schema: Schema;
		formatValidity?: (validity: ValidityState) => ErrorType;
	},
): Submission<Schema, ErrorType> {
	const payload = new Map<keyof Schema, string | string[] | undefined>();
	const error = new Map<keyof Schema, ErrorType>();
	const value = new Map<keyof Schema, any>();
	// @ts-expect-error FIXME: handle default error type
	const format: (validity: ValidityState) => ErrorType =
		config.formatValidity ?? formatValidity;

	for (const name in config.schema) {
		const constraint = config.schema[name];
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
		const validate = (key: ValidityKey, condition: boolean) => {
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
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				payload.set(name, text);
				value.set(name, text);

				validate('valueMissing', !constraint.required || text !== '');

				if (text !== '') {
					validate(
						'typeMismatch',
						constraint.type !== 'email' || isValidEmail(text),
					);
					validate(
						'typeMismatch',
						constraint.type !== 'url' || isValidURL(text),
					);
					validate('tooShort', text.length >= (constraint.minLength ?? 0));
					validate(
						'tooLong',
						text.length <= (constraint.maxLength ?? Infinity),
					);
					validate(
						'patternMismatch',
						!constraint.pattern || matchPattern(constraint.pattern ?? '', text),
					);
				}
				break;
			}
			case 'number':
			case 'range': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				payload.set(name, text);

				validate('valueMissing', !constraint.required || text !== '');

				if (text !== '') {
					const number = Number(text);
					const isNumber = !Number.isNaN(number);

					validate('badInput', isNumber);

					if (isNumber) {
						const { min = 0, max = Infinity, step = 1 } = constraint;
						value.set(name, number);

						validate('rangeUnderflow', number >= min);
						validate('rangeOverflow', number <= max);
						validate('stepMismatch', (number - min) % step === 0);
					}
				}
				break;
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
					payload.set(name, item);
				}

				const flag = typeof item !== 'undefined';

				value.set(name, flag);

				validate('valueMissing', !constraint.required || flag);
				break;
			}
			case 'datetime-local':
			case 'date':
			case 'time': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				payload.set(name, text);

				validate('valueMissing', !constraint.required || text !== '');

				if (text !== '') {
					const { date, min, max, step } = getDateConstraint(text, constraint);

					const isValidDate = !Number.isNaN(date.valueOf());

					validate('typeMismatch', isValidDate);

					if (isValidDate) {
						value.set(name, text);

						validate('rangeUnderflow', min === null || date >= min);
						validate('rangeOverflow', max === null || date <= max);
						validate(
							'stepMismatch',
							step === null ||
								(date.valueOf() - (min?.valueOf() ?? 0)) % step === 0,
						);
					}
				}
				break;
			}
			case 'radio': {
				const text = data.has(name) ? ensureSingleValue(data, name) : undefined;

				if (typeof text !== 'undefined') {
					invariant(typeof text === 'string', `${name} is not a string`);

					value.set(name, text);
					payload.set(name, text);
				}

				validate(
					'valueMissing',
					!constraint.required || typeof text !== 'undefined',
				);
				break;
			}
			case 'color': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);
				invariant(/^#[0-9a-f]{6}$/i.test(text), `${name} is not a valid color`);

				value.set(name, text);
				payload.set(name, text);

				validate('valueMissing', !constraint.required || text !== '');
				break;
			}
			case 'select': {
				const options = constraint.multiple
					? data.getAll(name)
					: ensureSingleValue(data, name);
				const isArray = Array.isArray(options);

				if (isArray) {
					invariant(
						options.every(
							(option): option is string => typeof option === 'string',
						),
						`${name} is not a string`,
					);
				} else {
					invariant(typeof options === 'string', `${name} is not a string`);
				}

				payload.set(name, options);
				value.set(name, options);

				if (constraint.required) {
					if (isArray) {
						validate('valueMissing', options.length > 0);
					} else {
						validate('valueMissing', options !== '');
					}
				}
				break;
			}
			case 'textarea': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				value.set(name, text);
				payload.set(name, text);

				validate('valueMissing', !constraint.required || text !== '');

				if (text) {
					validate('tooShort', text.length >= (constraint.minLength ?? 0));
					validate(
						'tooLong',
						text.length <= (constraint.maxLength ?? Infinity),
					);
				}
				break;
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

				validate(
					'valueMissing',
					!constraint.required || nonEmptyFiles.length > 0,
				);

				if (constraint.multiple || nonEmptyFiles.length > 0) {
					value.set(
						name,
						constraint.multiple ? nonEmptyFiles : nonEmptyFiles[0],
					);
				}
				break;
			}
		}

		if (!validity.valid) {
			error.set(name, format(validity));
		}
	}

	if (error.size > 0) {
		return {
			payload: Object.fromEntries(payload),
			error: Object.fromEntries(error),
		};
	}

	return {
		payload: Object.fromEntries(payload),
		error: null,
		value: Object.fromEntries(value) as any,
	};
}

export function formatValidity(validity: ValidityState): string[] {
	const messages = [] as string[];

	if (validity.valueMissing) {
		messages.push('required');
	} else {
		if (validity.typeMismatch || validity.badInput) {
			messages.push('type');
		}

		if (validity.rangeOverflow) {
			messages.push('max');
		}

		if (validity.rangeUnderflow) {
			messages.push('min');
		}

		if (validity.stepMismatch) {
			messages.push('step');
		}

		if (validity.tooShort) {
			messages.push('minlength');
		}

		if (validity.tooLong) {
			messages.push('maxlength');
		}

		if (validity.patternMismatch) {
			messages.push('pattern');
		}
	}

	return messages;
}
