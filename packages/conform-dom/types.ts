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
export type FormError<FormShape, ErrorShape = string[]> = {
	/**
	 * The error of the form.
	 */
	formErrors: ErrorShape | null;
	/**
	 * The field errors based on the field name.
	 */
	fieldErrors: Record<string, ErrorShape>;
	/**
	 * The form shape is encoded only for type inference. It is always `undefined` at runtime.
	 */
	'~type'?: Serializable<FormShape>;
};

/**
 * The data of a form submission.
 */
export type Submission<
	ValueType extends JsonPrimitive | FormDataEntryValue =
		| JsonPrimitive
		| FormDataEntryValue,
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
 * The result of a submission.
 */
export type SubmissionResult<
	FormShape,
	ErrorShape,
	ValueType extends JsonPrimitive | FormDataEntryValue =
		| JsonPrimitive
		| FormDataEntryValue,
> = {
	/**
	 * The corresponding submission.
	 */
	submission: Submission<ValueType>;
	/**
	 * The intended value of the submission. Defined only when the intended value is different from the submitted value.
	 */
	value?: Record<string, FormValue<ValueType>> | null;
	/**
	 * The error of the result value or submission value.
	 */
	error?: FormError<FormShape, ErrorShape> | null;
};

/**
 * The input attributes with related to the Constraint Validation API
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation
 */
export type ValidationAttributes = {
	required: boolean | undefined;
	minLength: number | undefined;
	maxLength: number | undefined;
	min: string | number | undefined;
	max: string | number | undefined;
	step: string | number | undefined;
	multiple: boolean | undefined;
	pattern: string | undefined;
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
