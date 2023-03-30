type Required<T> = undefined extends T
	? { required?: false }
	: { required: true };

export type Schema<
	Shape extends Record<string, string | number | boolean | File | File[]>,
> = {
	[Key in keyof Shape]: File[] extends Shape[Key]
		? Required<Shape[Key]> & {
				type: 'file';
				multiple: true;
		  }
		: File extends Shape[Key]
		? Required<Shape[Key]> & {
				type: 'file';
				multiple?: false;
		  }
		: number extends Shape[Key]
		? Required<Shape[Key]> & {
				type: 'number' | 'range';
				required?: boolean;
				min?: number;
				max?: number;
				step?: number;
		  }
		: boolean extends Shape[Key]
		? {
				type: 'checkbox';
				required?: boolean;
				value?: string;
		  }
		: string extends Shape[Key]
		? Required<Shape[Key]> &
				(
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
							step?: string;
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
					  }
				)
		: never;
};

export type SchemaValidity<Shape extends Record<string, string[]>> =
	| {
			payload: Record<string, string | undefined>;
			error: Record<string, string[]>;
	  }
	| {
			payload: Record<string, string | undefined>;
			error: null;
			value: Shape;
	  };

export function ensureSingleValue(
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

export function invariant(
	condition: boolean,
	message: string,
): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

/**
 * Check if the file is empty
 */
export function isEmptyFile(file: File): boolean {
	return file.name === '' && file.size === 0;
}

/**
 * Check URL validity as if url input type
 */
export function isValidURL(url: string): boolean {
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
export function isValidEmail(email: string): boolean {
	return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
		email,
	);
}

/**
 * Check if the text matches the pattern as if pattern input attribute
 */
export function matchPattern(pattern: string, text: string): boolean {
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

	// TODO: ensure pattern will match the whole text
	return new RegExp(patternString).test(text);
}

export function getDateConstraint(
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
			const today = new Date().toISOString().slice(0, 10);
			format = (text) => `${today}T${text}`;
			baseStep = 86400000;
			break;
		case 'time':
			format = (text) => `${text}T00:00:00`;
			baseStep = 1000;
			break;
		case 'datetime-local':
			format = (text) => text;
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

export function validate<Shape extends Record<string, any>>(
	data: FormData | URLSearchParams,
	schema: Schema<Shape>,
): SchemaValidity<Shape> {
	const payload = new Map<keyof Shape, string | undefined>();
	const error = new Map<keyof Shape, string[]>();
	const value = new Map<keyof Shape, any>();

	for (const name in schema) {
		const constraint = schema[name];
		const messages = new Set<string>();
		const validate = (message: string, condition: boolean) => {
			if (!condition) {
				messages.add(message);
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

				validate('required', !constraint.required || text !== '');

				if (text !== '') {
					validate('type', constraint.type !== 'email' || isValidEmail(text));
					validate('type', constraint.type !== 'url' || isValidURL(text));
					validate('minlength', text.length >= (constraint.minLength ?? 0));
					validate(
						'maxlength',
						text.length <= (constraint.maxLength ?? Infinity),
					);
					validate('pattern', matchPattern(constraint.pattern ?? '', text));
				}
				break;
			}
			case 'number':
			case 'range': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				payload.set(name, text);

				validate('required', !constraint.required || text !== '');

				if (text !== '') {
					const number = Number(text);
					const isNumber = !Number.isNaN(number);

					validate('type', isNumber);

					if (isNumber) {
						value.set(name, number);

						validate('min', number >= (constraint.min ?? 0));
						validate('max', number <= (constraint.max ?? Infinity));
						validate('step', number % (constraint.step ?? 1) === 0);
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

				validate('required', !constraint.required || flag);
				break;
			}
			case 'datetime-local':
			case 'date':
			case 'time': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);
				// TODO: validate text format

				payload.set(name, text);

				validate('required', !constraint.required || text !== '');

				if (text !== '') {
					const { date, min, max, step } = getDateConstraint(text, constraint);

					const isValidDate = !Number.isNaN(date.valueOf());

					validate('type', isValidDate);

					if (isValidDate) {
						value.set(name, text);

						validate('min', min === null || date >= min);
						validate('max', max === null || date <= max);
						validate(
							'step',
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
					'required',
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

				validate('required', !constraint.required || text !== '');
				break;
			}
			case 'select': {
				// TODO: implement multiple select validation
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				value.set(name, text);
				payload.set(name, text);

				validate('required', !constraint.required || text !== '');
				break;
			}
			case 'textarea': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				value.set(name, text);
				payload.set(name, text);

				validate('required', !constraint.required || text !== '');

				if (text) {
					validate('minlength', text.length >= (constraint.minLength ?? 0));
					validate(
						'maxlength',
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

				validate('required', !constraint.required || nonEmptyFiles.length > 0);

				if (constraint.multiple || nonEmptyFiles.length > 0) {
					value.set(
						name,
						constraint.multiple ? nonEmptyFiles : nonEmptyFiles[0],
					);
				}
				break;
			}
		}

		if (messages.size > 0) {
			error.set(name, [...messages]);
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
		value: Object.fromEntries(value) as Shape,
	};
}

export function getMessages(
	validity: ValidityState,
	validationMessage?: string,
	delimiter?: string,
): string[] {
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

		if (validity.customError && validationMessage) {
			if (delimiter) {
				messages.push(...validationMessage.split(delimiter));
			} else {
				messages.push(validationMessage);
			}
		}
	}

	return messages;
}
