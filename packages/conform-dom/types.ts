/**
 * Valid JSON primitive types.
 */
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
 * Form error object that contains both form errors and field errors.
 */
export type FormError<ErrorShape = string> = {
	/**
	 * The error of the form.
	 */
	formErrors: ErrorShape[];
	/**
	 * The field errors based on the field name.
	 */
	fieldErrors: Record<string, ErrorShape[]>;
};

/**
 * Structured data parsed from a form submission.
 */
export type Submission<
	ValueType extends JsonPrimitive | FormDataEntryValue =
		| JsonPrimitive
		| FormDataEntryValue,
> = {
	/**
	 * The submitted values mapped by field name.
	 * Supports nested names like `user.email` or indexed names like `items[0].id`.
	 *
	 * @example
	 * ```json
	 * {
	 *   "username": "johndoe",
	 *   "address": {
	 *     "street": "123 Main St",
	 *     "city": "Anytown"
	 *   },
	 *   "items": [
	 *     { "name": "item1", "quantity": "2" },
	 *     { "name": "item2", "quantity": "5" }
	 *   ]
	 * }
	 * ```
	 */
	payload: Record<string, FormValue<ValueType>>;
	/**
	 * The list of field names present in the FormData or URLSearchParams.
	 */
	fields: string[];
	/**
	 * The submission intent, usually set by the name/value of the button that triggered the submission.
	 */
	intent: string | null;
};

/**
 * The result of a submission.
 */
export type SubmissionResult<
	ErrorShape = string,
	ValueType extends JsonPrimitive | FormDataEntryValue =
		| JsonPrimitive
		| FormDataEntryValue,
> = {
	/**
	 * The original submission data.
	 */
	submission: Submission<ValueType>;
	/**
	 * The target value of the submission. Defined only when the target value is different from the submitted value.
	 */
	targetValue?: Record<string, FormValue<ValueType>>;
	/**
	 * Validation errors for `targetValue` when present, otherwise for the original payload.
	 */
	error?: FormError<ErrorShape> | null;
	/**
	 * Indicates whether the form should be reset to its initial state.
	 */
	reset?: boolean;
};

/** The name of an input field with type information for TypeScript inference. */
export type FieldName<FieldShape> = string & {
	'~shape'?: FieldShape;
};

/**
 * The input attributes related to form field constraints
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation
 */
export type ValidationAttributes = {
	required?: boolean | undefined;
	minLength?: number | undefined;
	maxLength?: number | undefined;
	min?: string | number | undefined;
	max?: string | number | undefined;
	step?: string | number | undefined;
	multiple?: boolean | undefined;
	pattern?: string | undefined;
	accept?: string | undefined;
};

/**
 * A type helper that makes sure the FormError type is serializable.
 * Used only to strip `File` type from the Form Shape at the moment.
 */
export type Serializable<T> = T extends File
	? undefined
	: T extends Array<infer U>
		? Serializable<U>[]
		: T extends object
			? { [K in keyof T]: Serializable<T[K]> }
			: T;

/**
 * Converts an arbitrary value into a {@link SerializedValue}.
 *
 * This function is used to prepare field values for submission,
 * ensuring they are compatible with the browser's `FormData` API.
 *
 * @param value - The original value to serialize.
 * @returns A `SerializedValue` if the input can be represented in `FormData`,
 *          or `undefined` if it cannot be serialized.
 */
export type Serialize = (value: unknown) => SerializedValue | null | undefined;

/**
 * A value that can be serialized into `FormData`.
 *
 * - `string` and `File` are supported natively by `FormData`.
 * - Arrays allow representing multi-value fields.
 */
export type SerializedValue = string | string[] | File | File[];

/**
 * Flatten a discriminated union into a single type with all properties.
 */
export type Combine<
	T,
	K extends PropertyKey = T extends unknown ? keyof T : never,
> = T extends unknown ? T & Partial<Record<Exclude<K, keyof T>, never>> : never;

/**
 * Maps all keys of T (including all keys from discriminated unions) to unknown.
 */
export type UnknownObject<T> = [T] extends [Record<string, any>]
	? { [K in keyof Combine<T>]-?: unknown }
	: never;
