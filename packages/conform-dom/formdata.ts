import type {
	FormError,
	FormValue,
	JsonPrimitive,
	Submission,
	SubmissionResult,
} from './types';
import { isGlobalInstance, isSubmitter } from './dom';
import {
	deepEqual,
	isPlainObject,
	serialize as defaultSerialize,
	stripFiles,
} from './util';

export const DEFAULT_INTENT_NAME = '__INTENT__';

/**
 * Construct a form data with the submitter value.
 * It utilizes the submitter argument on the FormData constructor from modern browsers
 * with fallback to append the submitter value in case it is not unsupported.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData#parameters
 */
export function getFormData(
	form: HTMLFormElement,
	submitter?: HTMLElement | null,
): FormData {
	const payload = new FormData(form, submitter);

	if (submitter) {
		if (!isSubmitter(submitter)) {
			throw new TypeError(
				'The submitter must be an input or button element with type submit.',
			);
		}

		if (submitter.name) {
			const entries = payload.getAll(submitter.name);

			// This assumes the submitter value to be always unique, which should be fine in most cases
			if (!entries.includes(submitter.value)) {
				payload.append(submitter.name, submitter.value);
			}
		}
	}

	return payload;
}

/**
 * Convert a string path into an array of segments.
 *
 * @example
 * ```js
 * getPathSegments("object.key");       // → ['object', 'key']
 * getPathSegments("array[0].content"); // → ['array', 0, 'content']
 * getPathSegments("todos[]");          // → ['todos', '']
 * ```
 */
export function getPathSegments(
	path: string | undefined,
): Array<string | number> {
	if (!path) return [];

	const tokenRegex = /([^.[\]]+)|\[(\d*)\]/g;
	const segments: Array<string | number> = [];

	let lastIndex = 0,
		match: RegExpExecArray | null;

	while ((match = tokenRegex.exec(path))) {
		// allow a single “.” between tokens
		if (match.index !== lastIndex) {
			if (!(match.index === lastIndex + 1 && path[lastIndex] === '.')) {
				throw new Error(
					`Invalid path syntax at position ${lastIndex} in "${path}"`,
				);
			}
		}

		const [, key, index] = match;
		if (key !== undefined) {
			if (key === '__proto__' || key === 'constructor') {
				throw new Error(`Invalid path segment "${key}"`);
			}
			segments.push(key);
		} else if (index === '') {
			segments.push('');
		} else {
			const number = Number(index);
			if (!Number.isInteger(number) || number < 0) {
				throw new Error(
					`Invalid path segment: array index must be a non-negative integer, got ${number}`,
				);
			}
			segments.push(number);
		}

		lastIndex = tokenRegex.lastIndex;
	}

	if (lastIndex !== path.length) {
		throw new Error(
			`Invalid path syntax at position ${lastIndex} in "${path}"`,
		);
	}

	return segments;
}

/**
 * Returns a formatted name from the path segments based on the dot and bracket notation.
 *
 * @example
 * ```js
 * formatPathSegments(['object', 'key']); // → "object.key"
 * formatPathSegments(['array', 0, 'content']); // → "array[0].content"
 * formatPathSegments(['todos', '']); // → "todos[]"
 * ```
 */
export function formatPathSegments(
	segments: Readonly<Array<string | number>>,
): string {
	return segments.reduce<string>(
		(path, segment) => appendPathSegment(path, segment),
		'',
	);
}

/**
 * Append one more segment onto an existing path string.
 *
 * - segment = `undefined`  ⇒ no-op
 * - segment = `""`         ⇒ empty brackets "[]"
 * - segment = `number`     ⇒ bracket notation "[n]"
 * - segment = `string`     ⇒ dot-notation ".prop"
 */
export function appendPathSegment(
	path: string | undefined,
	segment: string | number | undefined,
): string {
	// 1) nothing to append
	if (typeof segment === 'undefined') {
		return path ?? '';
	}

	// 2) explicit empty-segment => empty bracket
	if (segment === '') {
		// even as first segment, "[]" is valid
		return `${path}[]`;
	}

	// 3) numeric index => [n]
	if (typeof segment === 'number') {
		return `${path}[${segment}]`;
	}

	// 4) non-empty string => .prop (no leading dot if no base)
	return path ? `${path}.${segment}` : segment;
}

/**
 * Returns true if `prefix` is a valid leading path of `name`.
 *
 * @example
 * ```js
 * isPrefix("foo.bar.baz", "foo.bar")        // → true
 * isPrefix("foo.bar[3].baz", "foo.bar[3]")  // → true
 * isPrefix("foo.bar[3].baz", "foo.bar")     // → true
 * isPrefix("foo.bar[3].baz", "foo.baz")     // → false
 * isPrefix("foo", "foo.bar")                // → false
 * ```
 */
export function isPrefix(name: string, prefix: string) {
	return getRelativePath(name, getPathSegments(prefix)) !== null;
}

/**
 * Return the segments of `fullPathStr` that come after the `baseSegments` prefix.
 *
 * @param fullPathStr     Full path as a dot/bracket string
 * @param basePath    Base path, already parsed into segments
 * @returns               The “tail” segments, or `null` if `fullPathStr` isn’t nested under `baseSegments`
 *
 * @example
 * ```js
 * getRelativePath("foo.bar[0].qux", ["foo","bar"])  // → [0, "qux"]
 * getRelativePath("a.b.c.d", ["a","b"])             // → ["c","d"]
 * getRelativePath("foo", ["foo","bar"])             // → null
 * ```
 */
export function getRelativePath(
	name: string,
	basePath: Array<string | number>,
): Array<string | number> | null {
	const fullPath = getPathSegments(name);

	// if full is at least as long *and* starts with the base…
	if (
		fullPath.length >= basePath.length &&
		basePath.every((segment, i) => segment === fullPath[i])
	) {
		return fullPath.slice(basePath.length);
	}

	return null;
}

/**
 * Assign a value to a target object by following the path segments.
 */
export function setValueAtPath<T extends Record<string, any>>(
	target: T,
	pathOrSegments: string | Array<string | number>,
	valueOrFn: unknown | ((current: unknown) => unknown),
	options: { clone?: boolean; silent?: boolean } = {},
): T {
	try {
		// 1) normalize + validate path
		const segments: Array<string | number> =
			typeof pathOrSegments === 'string'
				? getPathSegments(pathOrSegments)
				: pathOrSegments;

		if (segments.length === 0) {
			throw new Error('Cannot set value at the object root');
		}

		if (
			segments.some((segment, i) => segment === '' && i < segments.length - 1)
		) {
			throw new Error(
				`Empty brackets '[]' only allowed at end of path ("${pathOrSegments}")`,
			);
		}

		// 2) clone root if needed
		const result = options.clone ? { ...target } : target;
		let pointer: any = result;

		// 3) drill down, cloning ancestors
		for (let i = 0; i < segments.length - 1; i++) {
			const currentSegment = segments[i] as string | number;
			const nextSegment = segments[i + 1] as string | number;
			let child = pointer[currentSegment];

			if (Array.isArray(child)) {
				child = options.clone ? child.slice() : child;
			} else if (isPlainObject(child)) {
				child = options.clone ? { ...child } : child;
			} else {
				child = typeof nextSegment === 'number' || nextSegment === '' ? [] : {};
			}

			pointer[currentSegment] = child;
			pointer = child;
		}

		// 4) final set or push
		const last = segments[segments.length - 1] as string | number;
		const oldValue = pointer[last];
		const newValue =
			typeof valueOrFn === 'function' ? valueOrFn(oldValue) : valueOrFn;

		if (last === '') {
			if (!Array.isArray(pointer)) {
				throw new Error(`Cannot push to non-array at "${pathOrSegments}"`);
			}
			pointer.push(newValue);
		} else {
			pointer[last] = newValue;
		}

		return result;
	} catch (err) {
		if (options?.silent) {
			return target;
		}

		throw err;
	}
}

/**
 * Retrive the value from a target object by following the path segments.
 */
export function getValueAtPath(
	target: unknown,
	pathOrSegments: string | Array<string | number>,
): unknown {
	let pointer: any = target;

	const segments =
		typeof pathOrSegments === 'string'
			? getPathSegments(pathOrSegments)
			: pathOrSegments;

	for (const segment of segments) {
		if (segment === '') {
			throw new Error(
				`Cannot access empty segment "[]" in "${pathOrSegments}"`,
			);
		}

		if (
			pointer == null ||
			!Object.prototype.hasOwnProperty.call(pointer, segment)
		) {
			return undefined;
		}

		pointer = pointer[segment];
	}

	return pointer;
}

/**
 * Parse `FormData` or `URLSearchParams` into a submission object.
 * This function structures the form values based on the naming convention.
 * It also includes all the field names and extracts the intent from the submission.
 *
 * @see https://conform.guide/api/react/future/parseSubmission
 * @example
 * ```ts
 * const formData = new FormData();
 *
 * formData.append('email', 'test@example.com');
 * formData.append('password', 'secret');
 *
 * parseSubmission(formData)
 * // {
 * //   payload: { email: 'test@example.com', password: 'secret' },
 * //   fields: ['email', 'password'],
 * //   intent: null,
 * // }
 *
 * // If you have an intent field
 * formData.append('intent', 'login');
 * parseSubmission(formData, { intentName: 'intent' })
 * // {
 * //   payload: { email: 'test@example.com', password: 'secret' },
 * //   fields: ['email', 'password'],
 * //   intent: 'login',
 * // }
 * ```
 */
export function parseSubmission(
	formData: FormData | URLSearchParams,
	options?: {
		/**
		 * The name of the submit button field that indicates the submission intent.
		 * Defaults to `__INTENT__`.
		 */
		intentName?: string;
		/**
		 * A function to exclude specific form fields from being parsed.
		 * Return `true` to skip the entry.
		 */
		skipEntry?: (name: string) => boolean;
	},
): Submission {
	const intentName = options?.intentName ?? DEFAULT_INTENT_NAME;
	const submission: Submission = {
		payload: {},
		fields: [],
		intent: null,
	};

	for (const name of new Set(formData.keys())) {
		if (name !== intentName && !options?.skipEntry?.(name)) {
			const value = formData.getAll(name);
			setValueAtPath(
				submission.payload,
				name,
				value.length > 1 ? value : value[0],
				{
					silent: true, // Avoid errors if the path is invalid
				},
			);
			submission.fields.push(name);
		}
	}

	if (intentName) {
		// We take the first value of the intent field if it exists.
		const intent = formData.get(intentName);

		if (typeof intent === 'string') {
			submission.intent = intent;
		}
	}

	return submission;
}

/**
 * Creates a SubmissionResult object from a submission, adding validation results and intended values.
 * This function will remove all files in the submission payload by default since
 * file inputs cannot be initialized with files.
 * You can specify `keepFiles: true` to keep the files if needed.
 *
 * @see https://conform.guide/api/react/future/report
 * @example
 * ```ts
 * // Report the submission with the field errors
 * report(submission, {
 *  error: {
 *    fieldErrors: {
 *      email: ['Invalid email format'],
 *      password: ['Password is required'],
 *    },
 * })
 *
 * // Report the submission with a form error
 * report(submission, {
 *   error: {
 *     formErrors: ['Invalid credentials'],
 *   },
 * })
 *
 * // Reset the form
 * report(submission, {
 *   reset: true,
 * })
 * ```
 */
export function report<ErrorShape = string>(
	submission: Submission,
	options?: {
		keepFiles?: false;
		error?: Partial<FormError<ErrorShape>> | null;
		intendedValue?: Record<string, FormValue> | null;
		hideFields?: string[];
		reset?: boolean;
	},
): SubmissionResult<
	ErrorShape,
	Exclude<JsonPrimitive | FormDataEntryValue, File>
>;
export function report<ErrorShape = string>(
	submission: Submission,
	options: {
		keepFiles: true;
		error?: Partial<FormError<ErrorShape>> | null;
		intendedValue?: Record<string, FormValue> | null;
		hideFields?: string[];
		reset?: boolean;
	},
): SubmissionResult<ErrorShape>;
export function report<ErrorShape = string>(
	submission: Submission,
	options: {
		/**
		 * Controls whether file objects are preserved in the submission payload.
		 * Defaults to `false` - files are stripped since they cannot be used to initialize file inputs.
		 */
		keepFiles?: boolean;
		/**
		 * Error information to include in the result.
		 * Set to `null` to indicate validation passed with no errors.
		 */
		error?: Partial<FormError<ErrorShape>> | null;
		/**
		 * The intended form values to track what the form should contain
		 * vs. what was actually submitted.
		 */
		intendedValue?: Record<string, FormValue> | null;
		/**
		 * Array of field names to hide from the result by setting them to `undefined`.
		 * Primarily used for sensitive data like passwords that should not be sent back to the client.
		 */
		hideFields?: string[];
		/**
		 * When `true`, indicates the form should be reset to its initial state.
		 */
		reset?: boolean;
	} = {},
): SubmissionResult<ErrorShape> {
	const intendedValue = options.reset
		? null
		: typeof options.intendedValue === 'undefined' ||
			  submission.payload === options.intendedValue
			? undefined
			: options.intendedValue && !options.keepFiles
				? stripFiles(options.intendedValue)
				: options.intendedValue;
	const error = !options.error
		? options.error
		: {
				formErrors: options.error.formErrors ?? [],
				fieldErrors: options.error.fieldErrors ?? {},
			};

	if (options.hideFields) {
		for (const name of options.hideFields) {
			const path = getPathSegments(name);

			setValueAtPath(submission.payload, path, undefined);
			if (intendedValue) {
				setValueAtPath(intendedValue, path, undefined);
			}
		}
	}

	return {
		submission: options.keepFiles
			? submission
			: {
					...submission,
					payload: stripFiles(submission.payload),
				},
		intendedValue,
		error,
	};
}

/**
 * A utility function that checks whether the current form data differs from the default values.
 *
 * @see https://conform.guide/api/react/future/isDirty
 * @example Enable a submit button only if the form is dirty
 *
 * ```tsx
 * const dirty = useFormData(
 *   formRef,
 *   (formData) => isDirty(formData, { defaultValue }) ?? false,
 * );
 *
 * return (
 *   <button type="submit" disabled={!dirty}>
 *     Save changes
 *   </button>
 * );
 * ```
 */
export function isDirty(
	/**
	 * The current form data to compare. It can be:
	 *
	 * - A `FormData` object
	 * - A `URLSearchParams` object
	 * - A plain object that was parsed from form data (i.e. `submission.payload`)
	 */
	formData: FormData | URLSearchParams | FormValue | null,
	options?: {
		/**
		 * An object representing the default values of the form to compare against.
		 * Defaults to an empty object if not provided.
		 */
		defaultValue?: unknown;
		/**
		 * The name of the submit button that triggered the submission.
		 * It will be excluded from the dirty comparison.
		 */
		intentName?: string;
		/**
		 * A function to serialize values in defaultValue before comparing them to the form data.
		 * If not provided, a default serializer is used that behaves as follows:
		 *
		 * - string / File:
		 *   - Returned as-is
		 * - boolean:
		 *   - true → 'on'
		 *   - false → undefined
		 * - number / bigint:
		 *   - Converted to string using `.toString()`
		 * - Date:
		 *   - Converted to ISO string using `.toISOString()`
		 */
		serialize?: (
			value: unknown,
			defaultSerialize: (
				value: unknown,
			) => string | string[] | File | File[] | undefined,
		) => string | string[] | File | File[] | undefined;
		/**
		 * A function to exclude specific fields from the comparison.
		 * Useful for ignoring hidden inputs like CSRF tokens or internal fields added by frameworks
		 * (e.g. Next.js uses hidden inputs to support server actions).
		 *
		 * @example
		 * ```ts
		 * isDirty(formData, {
		 *   skipEntry: (name) => name === 'csrf-token',
		 * });
		 * ```
		 */
		skipEntry?: (name: string) => boolean;
	},
): boolean | undefined {
	if (!formData) {
		return;
	}

	const formValue =
		formData instanceof FormData || formData instanceof URLSearchParams
			? parseSubmission(formData, {
					intentName: options?.intentName,
					skipEntry: options?.skipEntry,
				}).payload
			: formData;
	const defaultValue = options?.defaultValue;
	const serialize = (value: unknown) => {
		if (options?.serialize) {
			return options.serialize(value, defaultSerialize);
		}

		return defaultSerialize(value);
	};

	function normalize(data: unknown): unknown {
		const value = serialize(data) ?? data;

		// Removes empty strings, so that bpth empty string and undefined are treated as the same
		if (value === '') {
			return undefined;
		}

		if (isGlobalInstance(value, 'File')) {
			// Remove empty File as well, which happens if no File was selected
			if (value.name === '' && value.size === 0) {
				return undefined;
			}

			// If the value is a File, no need to serialize it
			return value;
		}

		if (Array.isArray(value)) {
			if (value.length === 0) {
				return undefined;
			}

			const array = value.map(normalize);

			if (
				array.length === 1 &&
				(typeof array[0] === 'string' || array[0] === undefined)
			) {
				return array[0];
			}

			return array;
		}

		if (isPlainObject(value)) {
			const entries = Object.entries(value).reduce<Array<[string, unknown]>>(
				(list, [key, value]) => {
					const normalizedValue = normalize(value);

					if (typeof normalizedValue !== 'undefined') {
						list.push([key, normalizedValue]);
					}

					return list;
				},
				[],
			);

			if (entries.length === 0) {
				return undefined;
			}

			return Object.fromEntries(entries);
		}

		return value;
	}

	return !deepEqual(normalize(formValue), normalize(defaultValue));
}
