import { INTENT as DEFAULT_INTENT_NAME } from '../submission';
import { isGlobalInstance, isPlainObject, setValue } from '../formdata';
import { FormValue, Submission } from './types';
import { deepEqual } from './util';

export {
	getFormData,
	getValue,
	setValue,
	getPaths,
	formatPaths,
} from '../formdata';

/**
 * A default serializer function for form values.
 */
export function serialize(value: unknown): FormDataEntryValue | undefined {
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
	const serializeFn = options?.serialize ?? serialize;

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

		return serializeFn(value, serialize);
	}

	return !deepEqual(normalize(formValue), normalize(defaultValue));
}
