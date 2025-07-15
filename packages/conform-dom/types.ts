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
