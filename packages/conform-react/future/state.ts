import {
	type ValidationAttributes,
	type Serialize,
	appendPathSegment,
	formatPathSegments,
	getPathSegments,
	getRelativePath,
	getValueAtPath,
	serialize as defaultSerialize,
	deepEqual,
} from '@conform-to/dom/future';
import type {
	FieldMetadata,
	FieldName,
	Fieldset,
	FormContext,
	FormMetadata,
	FormState,
	FormAction,
	UnknownIntent,
	ActionHandler,
	BaseMetadata,
	CustomMetadataDefinition,
} from './types';
import { generateUniqueKey, getArrayAtPath, merge } from './util';

export function initializeState<ErrorShape>(
	resetKey?: string,
): FormState<ErrorShape> {
	return {
		resetKey: resetKey ?? generateUniqueKey(),
		listKeys: {},
		clientIntendedValue: null,
		serverIntendedValue: null,
		serverError: null,
		clientError: null,
		touchedFields: [],
	};
}

/**
 * Updates form state based on action type:
 * - Client actions: update intended value and client errors
 * - Server actions: update server errors and clear client errors
 * - Initialize: set initial intended value
 */
export function updateState<ErrorShape>(
	state: FormState<ErrorShape>,
	action: FormAction<
		ErrorShape,
		UnknownIntent | null,
		{
			handlers: Record<string, ActionHandler>;
			reset: () => FormState<ErrorShape>;
		}
	>,
): FormState<ErrorShape> {
	if (action.intendedValue === null) {
		return action.ctx.reset();
	}

	const value = action.intendedValue ?? action.submission.payload;

	// Apply the form error and intended value from the result first
	state =
		action.type === 'client'
			? merge(state, {
					clientIntendedValue:
						action.intendedValue ?? state.clientIntendedValue,
					serverIntendedValue: action.intendedValue
						? null
						: state.serverIntendedValue,
					// Update client error only if the error is different from the previous one to minimize unnecessary re-renders
					clientError:
						typeof action.error !== 'undefined' &&
						!deepEqual(state.clientError, action.error)
							? action.error
							: state.clientError,
					// Reset server error if form value is changed
					serverError:
						typeof action.error !== 'undefined' &&
						!deepEqual(state.serverIntendedValue, value)
							? null
							: state.serverError,
				})
			: merge(state, {
					// Clear client error to avoid showing stale errors
					clientError: null,
					// Update server error if the error is defined.
					// There is no need to check if the error is different as we are updating other states as well
					serverError:
						typeof action.error !== 'undefined'
							? action.error
							: state.serverError,
					// Keep track of the value that the serverError is based on
					serverIntendedValue: !deepEqual(state.serverIntendedValue, value)
						? value
						: state.serverIntendedValue,
				});
	// Validate the whole form if no intent is provided (default submission)
	const intent = action.intent ?? { type: 'validate' };
	const handler = action.ctx.handlers?.[intent.type];

	if (typeof handler?.onUpdate === 'function') {
		if (handler.validatePayload?.(intent.payload) ?? true) {
			return handler.onUpdate(state, {
				...action,
				intent: {
					type: intent.type,
					payload: intent.payload,
				},
			});
		}
	}

	return state;
}

export function getDefaultValue(
	context: FormContext<any>,
	name: string,
	serialize: Serialize = defaultSerialize,
): string | undefined {
	const value = getValueAtPath(
		context.state.serverIntendedValue ??
			context.state.clientIntendedValue ??
			context.defaultValue,
		name,
	);
	const serializedValue = serialize(value);

	if (typeof serializedValue === 'string') {
		return serializedValue;
	}
}

export function getDefaultOptions(
	context: FormContext<any>,
	name: string,
	serialize: Serialize = defaultSerialize,
): string[] | undefined {
	const value = getValueAtPath(
		context.state.serverIntendedValue ??
			context.state.clientIntendedValue ??
			context.defaultValue,
		name,
	);
	const serializedValue = serialize(value);

	if (
		Array.isArray(serializedValue) &&
		serializedValue.every((item) => typeof item === 'string')
	) {
		return serializedValue;
	}

	if (typeof serializedValue === 'string') {
		return [serializedValue];
	}
}

export function isDefaultChecked(
	context: FormContext<any>,
	name: string,
	serialize: Serialize = defaultSerialize,
): boolean {
	const value = getValueAtPath(
		context.state.serverIntendedValue ??
			context.state.clientIntendedValue ??
			context.defaultValue,
		name,
	);
	const serializedValue = serialize(value);

	return serializedValue === 'on';
}

/**
 * Determine if the field is touched
 *
 * This checks if the field is in the list of touched fields,
 * or if there is any child field that is touched, i.e. form / fieldset
 */
export function isTouched(state: FormState<any>, name = '') {
	if (state.touchedFields.includes(name)) {
		return true;
	}

	const paths = getPathSegments(name);

	return state.touchedFields.some(
		(field) => field !== name && getRelativePath(field, paths) !== null,
	);
}

export function getDefaultListKey(
	prefix: string,
	initialValue: Record<string, unknown> | null,
	name: string,
): string[] {
	return getArrayAtPath(initialValue, name).map(
		(_, index) => `${prefix}-${appendPathSegment(name, index)}`,
	);
}

export function getListKey(context: FormContext<any>, name: string): string[] {
	return (
		context.state.listKeys?.[name] ??
		getDefaultListKey(
			context.state.resetKey,
			context.state.serverIntendedValue ??
				context.state.clientIntendedValue ??
				context.defaultValue,
			name,
		)
	);
}

export function getErrors<ErrorShape>(
	state: FormState<ErrorShape>,
	name?: string,
): ErrorShape[] | undefined {
	const error = state.serverError ?? state.clientError;

	if (!error || !isTouched(state, name)) {
		return;
	}

	const errors = name ? error.fieldErrors[name] : error.formErrors;

	if (errors && errors.length > 0) {
		return errors;
	}
}

export function getFieldErrors<ErrorShape>(
	state: FormState<ErrorShape>,
	name?: string,
) {
	const result: Record<string, ErrorShape[]> = {};
	const error = state.serverError ?? state.clientError;

	if (error) {
		const basePath = getPathSegments(name);

		for (const field of Object.keys(error.fieldErrors)) {
			const relativePath = getRelativePath(field, basePath);

			// Only include errors for specified field's children
			if (!relativePath || relativePath.length === 0) {
				continue;
			}

			const error = getErrors(state, field);

			if (typeof error !== 'undefined') {
				result[formatPathSegments(relativePath)] = error;
			}
		}
	}

	return result;
}

export function isValid(state: FormState<any>, name?: string): boolean {
	const error = state.serverError ?? state.clientError;

	// If there is no error, it must be valid
	if (!error) {
		return true;
	}

	const basePath = getPathSegments(name);

	for (const field of Object.keys(error.fieldErrors)) {
		// When checking a specific field, only check that field and its children
		if (name && !getRelativePath(field, basePath)) {
			continue;
		}

		// If the field is not touched, we don't consider its error
		const error = getErrors(state, field);

		if (error) {
			return false;
		}
	}

	// Make sure there is no form error when checking the whole form
	if (!name) {
		return !getErrors(state);
	}

	return true;
}

/**
 * Gets validation constraint for a field, with fallback to parent array patterns.
 * e.g. "array[0].key" falls back to "array[].key" if specific constraint not found.
 */
export function getConstraint(
	context: FormContext<any>,
	name: string,
): ValidationAttributes | undefined {
	let constraint = context.constraint?.[name];

	if (!constraint) {
		const path = getPathSegments(name);

		for (let i = path.length - 1; i >= 0; i--) {
			const segment = path[i];
			// Try searching a less specific path for the constraint
			// e.g. `array[0].anotherArray[1].key` -> `array[0].anotherArray[].key` -> `array[].anotherArray[].key`
			if (typeof segment === 'number') {
				// This overrides the current number segment with an empty string
				// which will be treated as an empty bracket
				path[i] = '';
				break;
			}
		}

		const alternative = formatPathSegments(path);

		if (name !== alternative) {
			constraint = getConstraint(context, alternative);
		}
	}

	return constraint;
}

export function getFormMetadata<ErrorShape>(
	context: FormContext<ErrorShape>,
	options?: {
		serialize?: Serialize;
		customize?: CustomMetadataDefinition;
	},
): FormMetadata<ErrorShape> {
	return {
		key: context.state.resetKey,
		id: context.formId,
		errorId: `${context.formId}-form-error`,
		descriptionId: `${context.formId}-form-description`,
		get errors() {
			return getErrors(context.state);
		},
		get fieldErrors() {
			return getFieldErrors(context.state);
		},
		get touched() {
			return isTouched(context.state);
		},
		get valid() {
			return isValid(context.state);
		},
		get invalid() {
			return !this.valid;
		},
		props: {
			id: context.formId,
			onSubmit: context.handleSubmit,
			onInput: context.handleInput,
			onBlur: context.handleBlur,
			noValidate: true,
		},
		context,
		getField(name) {
			return getField(context, {
				name,
				serialize: options?.serialize,
				customize: options?.customize,
			});
		},
		getFieldset(name) {
			return getFieldset(context, {
				name,
				serialize: options?.serialize,
				customize: options?.customize,
			});
		},
		getFieldList(name) {
			return getFieldList(context, {
				name,
				serialize: options?.serialize,
				customize: options?.customize,
			});
		},
	};
}

export function getField<FieldShape, ErrorShape = string>(
	context: FormContext<ErrorShape>,
	options: {
		name: FieldName<FieldShape>;
		serialize?: Serialize;
		customize?: CustomMetadataDefinition;
		key?: string;
	},
): FieldMetadata<FieldShape, ErrorShape> {
	const { key, name, serialize = defaultSerialize, customize } = options;
	const id = `${context.formId}-field-${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
	const constraint = getConstraint(context, name);
	const metadata: BaseMetadata<FieldShape, ErrorShape> = {
		key,
		name,
		id,
		descriptionId: `${id}-description`,
		errorId: `${id}-error`,
		formId: context.formId,
		required: constraint?.required,
		minLength: constraint?.minLength,
		maxLength: constraint?.maxLength,
		pattern: constraint?.pattern,
		min: constraint?.min,
		max: constraint?.max,
		step: constraint?.step,
		multiple: constraint?.multiple,
		get defaultValue() {
			return getDefaultValue(context, name, serialize);
		},
		get defaultOptions() {
			return getDefaultOptions(context, name, serialize);
		},
		get defaultChecked() {
			return isDefaultChecked(context, name, serialize);
		},
		get touched() {
			return isTouched(context.state, name);
		},
		get valid() {
			return isValid(context.state, name);
		},
		get invalid() {
			return !this.valid;
		},
		get errors() {
			return getErrors(context.state, name);
		},
		get fieldErrors() {
			return getFieldErrors(context.state, name);
		},
		get ariaInvalid() {
			return !this.valid ? true : undefined;
		},
		get ariaDescribedBy() {
			return !this.valid ? this.errorId : undefined;
		},
		getFieldset() {
			return getFieldset(context, {
				name: name as string,
				serialize,
				customize,
			});
		},
		getFieldList() {
			return getFieldList(context, {
				name: name as string,
				serialize,
				customize,
			});
		},
	};

	if (typeof customize !== 'function') {
		return metadata;
	}

	return new Proxy(metadata, {
		get(target, prop, receiver) {
			if (Reflect.has(target, prop)) {
				return Reflect.get(target, prop, receiver);
			}

			const customMetadata = customize(metadata);

			if (Reflect.has(customMetadata, prop)) {
				return Reflect.get(customMetadata, prop, receiver);
			}

			throw new Error(
				`Property "${String(prop)}" does not exist on field metadata. ` +
					`If you have defined the CustomMetadata interface to include "${String(prop)}", make sure to also implement it through the "defineCustomMetadata" property on <FormOptionsProvider />.`,
			);
		},
	});
}

/**
 * Creates a proxy that dynamically generates field objects when properties are accessed.
 */
export function getFieldset<
	FieldShape = Record<string, any>,
	ErrorShape = string,
>(
	context: FormContext<ErrorShape>,
	options: {
		name?: FieldName<FieldShape>;
		serialize?: Serialize;
		customize?: CustomMetadataDefinition;
	},
): Fieldset<FieldShape, ErrorShape> {
	return new Proxy({} as any, {
		get(target, name, receiver) {
			if (typeof name === 'string') {
				return getField(context, {
					name: appendPathSegment(options?.name, name),
					serialize: options.serialize,
					customize: options.customize,
				});
			}

			return Reflect.get(target, name, receiver);
		},
	});
}

/**
 * Creates an array of field objects for list/array inputs
 */
export function getFieldList<FieldShape = Array<any>, ErrorShape = string>(
	context: FormContext<ErrorShape>,
	options: {
		name: FieldName<FieldShape>;
		serialize?: Serialize;
		customize?: CustomMetadataDefinition;
	},
): FieldMetadata<
	[FieldShape] extends [Array<infer ItemShape> | null | undefined]
		? ItemShape
		: unknown,
	ErrorShape
>[] {
	const keys = getListKey(context, options.name);

	return keys.map((key, index) => {
		return getField<
			[FieldShape] extends [Array<infer ItemShape> | null | undefined]
				? ItemShape
				: unknown,
			ErrorShape
		>(context, {
			name: appendPathSegment(options.name, index),
			serialize: options.serialize,
			customize: options.customize,
			key,
		});
	});
}
