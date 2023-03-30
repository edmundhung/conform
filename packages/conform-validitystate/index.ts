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

				if (constraint.required && text === '') {
					messages.add('required');
				}

				if (text !== '') {
					switch (constraint.type) {
						case 'email':
							if (!isValidEmail(text)) {
								messages.add('type');
							}
							break;
						case 'url':
							if (!isValidURL(text)) {
								messages.add('type');
							}
							break;
					}

					if (
						typeof constraint.minLength !== 'undefined' &&
						text.length < constraint.minLength
					) {
						messages.add('minlength');
					}

					if (
						typeof constraint.maxLength !== 'undefined' &&
						text.length > constraint.maxLength
					) {
						messages.add('maxlength');
					}

					if (
						typeof constraint.pattern !== 'undefined' &&
						!matchPattern(constraint.pattern, text)
					) {
						messages.add('pattern');
					}
				}
				break;
			}
			case 'number':
			case 'range': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				payload.set(name, text);

				if (constraint.required && text === '') {
					messages.add('required');
				}

				if (text !== '') {
					const number = Number(text);

					if (Number.isNaN(number)) {
						messages.add('type');
					} else {
						value.set(name, number);

						if (
							typeof constraint.min !== 'undefined' &&
							number < constraint.min
						) {
							messages.add('min');
						}

						if (
							typeof constraint.max !== 'undefined' &&
							number > constraint.max
						) {
							messages.add('max');
						}

						if (
							typeof constraint.step !== 'undefined' &&
							(number - (constraint.min ?? 0)) % constraint.step !== 0
						) {
							messages.add('step');
						}
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

				if (constraint.required && !flag) {
					messages.add('required');
				}

				break;
			}
			case 'datetime-local':
			case 'date':
			case 'time': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);
				// TODO: validate text format

				payload.set(name, text);

				if (constraint.required && text === '') {
					messages.add('required');
				}

				if (text !== '') {
					let date: Date,
						min: Date | null,
						max: Date | null,
						step: number | null;

					switch (constraint.type) {
						case 'datetime-local': {
							date = new Date(text);
							min = constraint.min ? new Date(constraint.min) : null;
							max = constraint.max ? new Date(constraint.max) : null;
							step =
								typeof constraint.step !== 'undefined'
									? constraint.step * 1000
									: null;
							break;
						}
						case 'date': {
							date = new Date(`${text}T00:00:00`);
							min = constraint.min
								? new Date(`${constraint.min}T00:00:00`)
								: null;
							max = constraint.max
								? new Date(`${constraint.max}T00:00:00`)
								: null;
							step =
								typeof constraint.step !== 'undefined'
									? constraint.step * 86400000
									: null;
							break;
						}
						case 'time': {
							date = new Date(
								`${new Date().toISOString().slice(0, 10)}T${text}`,
							);
							min = constraint.min
								? new Date(
										`${new Date().toISOString().slice(0, 10)}T${
											constraint.min
										}`,
								  )
								: null;
							max = constraint.max
								? new Date(
										`${new Date().toISOString().slice(0, 10)}T${
											constraint.max
										}`,
								  )
								: null;
							step =
								typeof constraint.step !== 'undefined'
									? constraint.step * 1000
									: null;
							break;
						}
					}

					if (Number.isNaN(date.valueOf())) {
						messages.add('type');
					} else {
						value.set(name, text);

						if (min !== null && date < min) {
							messages.add('min');
						}

						if (max !== null && date > max) {
							messages.add('max');
						}

						if (
							step !== null &&
							(date.valueOf() - (min?.valueOf() ?? 0)) % step !== 0
						) {
							messages.add('step');
						}
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

				if (constraint.required && typeof text === 'undefined') {
					messages.add('required');
				}
				break;
			}
			case 'color': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				value.set(name, text);
				payload.set(name, text);

				if (constraint.required && text === '') {
					messages.add('required');
				}

				// TODO: handle color format
				break;
			}
			case 'select': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				value.set(name, text);
				payload.set(name, text);

				if (constraint.required && text === '') {
					messages.add('required');
				}

				// TODO: implement multiple select validation
				break;
			}
			case 'textarea': {
				const text = ensureSingleValue(data, name);

				invariant(typeof text === 'string', `${name} is not a string`);

				value.set(name, text);
				payload.set(name, text);

				if (constraint.required && text === '') {
					messages.add('required');
				}

				if (text) {
					if (constraint.minLength && text.length < constraint.minLength) {
						messages.add('minlength');
					}

					if (constraint.maxLength && text.length > constraint.maxLength) {
						messages.add('maxlength');
					}
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

				if (constraint.required && nonEmptyFiles.length === 0) {
					messages.add('required');
				}

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
