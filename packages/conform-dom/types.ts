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
	 * The intended value of the submission. Defined only when the intended value is different from the submitted value.
	 */
	intendedValue?: Record<string, FormValue<ValueType>> | null;
	/**
	 * Validation errors for `intendedValue` when present, otherwise for the original payload.
	 */
	error?: FormError<ErrorShape> | null;
};

/**
 * The input attributes with related to the Constraint Validation API
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation
 */
export type ValidationAttributes = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: string | number;
	max?: string | number;
	step?: string | number;
	multiple?: boolean;
	pattern?: string;
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
export type Serialize = (value: unknown) => SerializedValue | undefined;

/**
 * A value that can be serialized into `FormData`.
 *
 * - `string` and `File` are supported natively by `FormData`.
 * - Arrays allow representing multi-value fields.
 */
export type SerializedValue = string | string[] | File | File[];
