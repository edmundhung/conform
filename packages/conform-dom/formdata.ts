import { INTENT as DEFAULT_INTENT_NAME } from './submission';

/**
 * Construct a form data with the submitter value.
 * It utilizes the submitter argument on the FormData constructor from modern browsers
 * with fallback to append the submitter value in case it is not unsupported.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData#parameters
 */
export function getFormData(
	form: HTMLFormElement,
	submitter?: HTMLInputElement | HTMLButtonElement | null,
): FormData {
	const payload = new FormData(form, submitter);

	if (submitter && submitter.type === 'submit' && submitter.name !== '') {
		const entries = payload.getAll(submitter.name);

		// This assumes the submitter value to be always unique, which should be fine in most cases
		if (!entries.includes(submitter.value)) {
			payload.append(submitter.name, submitter.value);
		}
	}

	return payload;
}

/**
 * Returns the paths from a name based on the JS syntax convention
 * @example
 * ```js
 * const paths = getPaths('todos[0].content'); // ['todos', 0, 'content']
 * ```
 */
export function getPaths(name: string | undefined): Array<string | number> {
	if (!name) {
		return [];
	}

	return name
		.split(/\.|(\[\d*\])/)
		.reduce<Array<string | number>>((result, segment) => {
			if (
				typeof segment !== 'undefined' &&
				segment !== '' &&
				segment !== '__proto__' &&
				segment !== 'constructor' &&
				segment !== 'prototype'
			) {
				if (segment.startsWith('[') && segment.endsWith(']')) {
					const index = segment.slice(1, -1);

					result.push(Number(index));
				} else {
					result.push(segment);
				}
			}
			return result;
		}, []);
}

/**
 * Returns a formatted name from the paths based on the JS syntax convention
 * @example
 * ```js
 * const name = formatPaths(['todos', 0, 'content']); // "todos[0].content"
 * ```
 */
export function formatPaths(paths: Array<string | number>): string {
	return paths.reduce<string>((name, path) => {
		if (typeof path === 'number') {
			return `${name}[${Number.isNaN(path) ? '' : path}]`;
		}

		if (name === '' || path === '') {
			return [name, path].join('');
		}

		return [name, path].join('.');
	}, '');
}

/**
 * Format based on a prefix and a path
 */
export function formatName(prefix: string | undefined, path?: string | number) {
	return typeof path !== 'undefined'
		? formatPaths([...getPaths(prefix), path])
		: prefix ?? '';
}

/**
 * Check if a name match the prefix paths
 */
export function isPrefix(name: string, prefix: string) {
	const paths = getPaths(name);
	const prefixPaths = getPaths(prefix);

	return (
		paths.length >= prefixPaths.length &&
		prefixPaths.every((path, index) => paths[index] === path)
	);
}

/**
 * Compare the parent and child paths to get the relative paths
 * Returns null if the child paths do not start with the parent paths
 */
export function getChildPaths(
	parentNameOrPaths: string | Array<string | number>,
	childName: string,
) {
	const parentPaths =
		typeof parentNameOrPaths === 'string'
			? getPaths(parentNameOrPaths)
			: parentNameOrPaths;
	const childPaths = getPaths(childName);

	if (
		childPaths.length >= parentPaths.length &&
		parentPaths.every((path, index) => childPaths[index] === path)
	) {
		return childPaths.slice(parentPaths.length);
	}

	return null;
}

/**
 * Assign a value to a target object by following the paths
 */
export function setValue(
	target: Record<string, any>,
	name: string,
	valueFn: (currentValue?: unknown) => unknown,
) {
	const paths = getPaths(name);
	const length = paths.length;
	const lastIndex = length - 1;

	let index = -1;
	let pointer = target;

	while (pointer != null && ++index < length) {
		const key = paths[index] as string | number;
		const nextKey = paths[index + 1];
		const newValue =
			index != lastIndex
				? Object.prototype.hasOwnProperty.call(pointer, key) &&
					pointer[key] !== null
					? pointer[key]
					: typeof nextKey === 'number'
						? []
						: {}
				: valueFn(pointer[key]);

		if (canAddProperty(pointer, key)) {
			pointer[key] = newValue;
		}
		pointer = pointer[key];
	}
}

function canAddProperty(
	obj: Object | Array<unknown>,
	property: string | number,
): boolean {
	const propertyStr =
		typeof property === 'number' ? property.toString() : property;
	if (Object.prototype.hasOwnProperty.call(obj, propertyStr)) {
		const descriptor = Object.getOwnPropertyDescriptor(obj, propertyStr);
		if (descriptor && !descriptor.writable) {
			return false;
		}
	}
	if (!Object.isExtensible(obj)) {
		return false;
	}
	if (Object.isSealed(obj) && !(propertyStr in obj)) {
		return false;
	}
	if (Object.isFrozen(obj) && !(propertyStr in obj)) {
		return false;
	}
	return true;
}

/**
 * Retrive the value from a target object by following the paths
 */
export function getValue(target: unknown, name: string): unknown {
	let pointer = target;

	for (const path of getPaths(name)) {
		if (typeof pointer === 'undefined' || pointer == null) {
			break;
		}

		if (!Object.prototype.hasOwnProperty.call(pointer, path)) {
			return;
		}

		if (isPlainObject(pointer) && typeof path === 'string') {
			pointer = pointer[path];
		} else if (Array.isArray(pointer) && typeof path === 'number') {
			pointer = pointer[path];
		} else {
			return;
		}
	}

	return pointer;
}

/**
 * Check if the value is a plain object
 */
export function isPlainObject(
	obj: unknown,
): obj is Record<string | number | symbol, unknown> {
	return (
		!!obj &&
		obj.constructor === Object &&
		Object.getPrototypeOf(obj) === Object.prototype
	);
}

type GlobalConstructors = {
	[K in keyof typeof globalThis]: (typeof globalThis)[K] extends new (
		...args: any
	) => any
		? K
		: never;
}[keyof typeof globalThis];

export function isGlobalInstance<ClassName extends GlobalConstructors>(
	obj: unknown,
	className: ClassName,
): obj is InstanceType<(typeof globalThis)[ClassName]> {
	const Ctor = globalThis[className];
	return typeof Ctor === 'function' && obj instanceof Ctor;
}

/**
 * Normalize value by removing empty object or array, empty string and null values
 */
export function normalize<Type extends Record<string, unknown>>(
	value: Type,
	acceptFile?: boolean,
): Type | undefined;
export function normalize<Type extends Array<unknown>>(
	value: Type,
	acceptFile?: boolean,
): Type | undefined;
export function normalize(
	value: unknown,
	acceptFile?: boolean,
): unknown | undefined;
export function normalize<
	Type extends Record<string, unknown> | Array<unknown>,
>(
	value: Type,
	acceptFile = true,
): Record<string, unknown> | Array<unknown> | undefined {
	if (isPlainObject(value)) {
		const obj = Object.keys(value)
			.sort()
			.reduce<Record<string, unknown>>((result, key) => {
				const data = normalize(value[key], acceptFile);

				if (typeof data !== 'undefined') {
					result[key] = data;
				}

				return result;
			}, {});

		if (Object.keys(obj).length === 0) {
			return;
		}

		return obj;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return undefined;
		}

		return value.map((item) => normalize(item, acceptFile));
	}

	if (
		(typeof value === 'string' && value === '') ||
		value === null ||
		(isGlobalInstance(value, 'File') && (!acceptFile || value.size === 0))
	) {
		return;
	}

	return value;
}

/**
 * Flatten a tree into a dictionary
 */
export function flatten(
	data: unknown,
	options: {
		resolve?: (data: unknown) => unknown;
		prefix?: string;
	} = {},
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const resolve = options.resolve ?? ((data) => data);

	function process(data: unknown, prefix: string) {
		const value = normalize(resolve(data));

		if (typeof value !== 'undefined') {
			result[prefix] = value;
		}

		if (Array.isArray(data)) {
			for (let i = 0; i < data.length; i++) {
				process(data[i], `${prefix}[${i}]`);
			}
		} else if (isPlainObject(data)) {
			for (const [key, value] of Object.entries(data)) {
				process(value, prefix ? `${prefix}.${key}` : key);
			}
		}
	}

	if (data) {
		process(data, options.prefix ?? '');
	}

	return result;
}

export function deepEqual(left: unknown, right: unknown): boolean {
	if (Object.is(left, right)) {
		return true;
	}

	if (left == null || right == null) {
		return false;
	}

	// Compare plain objects
	if (isPlainObject(left) && isPlainObject(right)) {
		const prevKeys = Object.keys(left);
		const nextKeys = Object.keys(right);

		if (prevKeys.length !== nextKeys.length) {
			return false;
		}

		for (const key of prevKeys) {
			if (
				!Object.prototype.hasOwnProperty.call(right, key) ||
				!deepEqual(left[key], right[key])
			) {
				return false;
			}
		}

		return true;
	}

	// Compare arrays
	if (Array.isArray(left) && Array.isArray(right)) {
		if (left.length !== right.length) {
			return false;
		}

		for (let i = 0; i < left.length; i++) {
			if (!deepEqual(left[i], right[i])) {
				return false;
			}
		}

		return true;
	}

	return false;
}

export type JsonPrimitive = string | number | boolean | null;

/**
 * The form value of a submission. This is usually constructed from a FormData or URLSearchParams.
 * It may contains JSON primitives if the value is updated based on a form intent.
 */
export type FormValue<
	Type extends JsonPrimitive | FormDataEntryValue =
		| JsonPrimitive
		| FormDataEntryValue,
> = Type | FormValue<Type | null>[] | { [key: string]: FormValue<Type> };

/**
 * The data of a form submission.
 */
export type Submission<
	ValueType extends FormDataEntryValue = FormDataEntryValue,
> = {
	/**
	 * The form value structured following the naming convention.
	 */
	value: Record<string, FormValue<ValueType>>;
	/**
	 * The field names that are included in the FormData or URLSearchParams.
	 */
	fields: string[];
	/**
	 * The intent of the submission. This is usally included by specifying a name and value on a submit button.
	 */
	intent: string | null;
};

/**
 * Parse `FormData` or `URLSearchParams` into a submission object.
 * This function structures the form values based on the naming convention.
 * It also includes all the field names and the intent if the `intentName` option is provided.
 *
 * @example
 * ```ts
 * const formData = new FormData();
 *
 * formData.append('email', 'test@example.com');
 * formData.append('password', 'secret');
 *
 * parseSubmission(formData)
 * // {
 * //   value: { email: 'test@example.com', password: 'secret' },
 * //   fields: ['email', 'password'],
 * //   intent: null,
 * // }
 *
 * // If you have an intent field
 * formData.append('intent', 'login');
 * parseSubmission(formData, { intentName: 'intent' })
 * // {
 * //   value: { email: 'test@example.com', password: 'secret' },
 * //   fields: ['email', 'password'],
 * //   intent: 'login',
 * // }
 * ```
 */
export function parseSubmission(
	formData: FormData | URLSearchParams,
	options?: {
		/**
		 * The name of the submit button that triggered the form submission.
		 * Used to extract the submission's intent.
		 */
		intentName?: string;
		/**
		 * A filter function that excludes specific entries from being parsed.
		 * Return `true` to skip the entry.
		 */
		skipEntry?: (name: string) => boolean;
	},
): Submission {
	const intentName = options?.intentName ?? DEFAULT_INTENT_NAME;
	const submission: Submission = {
		value: {},
		fields: [],
		intent: null,
	};

	for (const name of new Set(formData.keys())) {
		if (name !== intentName && !options?.skipEntry?.(name)) {
			const value = formData.getAll(name);
			setValue(submission.value, name, () =>
				value.length > 1 ? value : value[0],
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

export type ParseSubmissionOptions = Required<
	Parameters<typeof parseSubmission>
>[1];

export function defaultSerialize(
	value: unknown,
): FormDataEntryValue | undefined {
	if (typeof value === 'string' || isGlobalInstance(value, 'File')) {
		return value;
	}

	if (typeof value === 'boolean') {
		return value ? 'on' : undefined;
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	return value?.toString();
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
	formData: FormData | URLSearchParams | FormValue<FormDataEntryValue> | null,
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
			defaultSerialize: (value: unknown) => FormDataEntryValue | undefined,
		) => FormDataEntryValue | undefined;
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
				}).value
			: formData;
	const defaultValue = options?.defaultValue;
	const serialize = options?.serialize ?? defaultSerialize;

	function normalize(value: unknown): unknown {
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

		// If the value is null or undefined, treat it as undefined
		if (value == null) {
			return undefined;
		}

		// Removes empty strings, so that bpth empty string and undefined are treated as the same
		if (typeof value === 'string' && value === '') {
			return undefined;
		}

		// Remove empty File as well, which happens if no File was selected
		if (
			isGlobalInstance(value, 'File') &&
			value.name === '' &&
			value.size === 0
		) {
			return undefined;
		}

		return serialize(value, defaultSerialize);
	}

	return !deepEqual(normalize(formValue), normalize(defaultValue));
}
