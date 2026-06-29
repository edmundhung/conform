import {
	type FieldName,
	type SubmissionResult,
	appendPath,
	formatPath,
	parsePath,
	getRelativePath,
	getPathValue,
	normalize,
	deepEqual,
	FormError,
	isPlainObject,
} from '@conform-to/dom/future';
import type {
	FieldMetadata,
	Fieldset,
	FormContext,
	FormMetadata,
	FormState,
	FormAction,
	UnknownIntent,
	IntentHandler,
	BaseFieldMetadata,
	BaseFormMetadata,
	DefineConditionalField,
	ApplyStatus,
	CustomStateHandler,
	FormCustomState,
} from './types';
import {
	appendUniqueItem,
	generateUniqueKey,
	getPathArray,
	merge,
	when,
} from './util';

export function initializeState<
	ErrorShape = any,
	CustomStateHandlers extends Record<
		string,
		CustomStateHandler<any, any, ErrorShape>
	> = {},
>(options?: {
	defaultValue?: Record<string, unknown> | null | undefined;
	resetKey?: string | undefined;
	reset?: boolean | undefined;
	customStateHandlers?: CustomStateHandlers | undefined;
	lastCustomState?: FormCustomState<CustomStateHandlers> | undefined;
}): FormState<ErrorShape, FormCustomState<CustomStateHandlers>> {
	return {
		resetKey: options?.resetKey ?? generateUniqueKey(),
		listKeys: {},
		defaultValue: options?.defaultValue ?? {},
		targetValue: null,
		serverValue: null,
		serverError: null,
		clientError: null,
		touchedFields: [],
		customState: initializeCustomState({
			handlers: options?.customStateHandlers,
			lastState: options?.lastCustomState,
			reset: options?.reset ?? false,
		}),
	};
}

/**
 * Updates form state based on action type:
 * - Client actions: update target value and client errors
 * - Server actions: update server errors and clear client errors, with optional target value
 * - Initialize: set initial server value
 */
export function updateState<
	ErrorShape,
	CustomStateHandlers extends Record<
		string,
		CustomStateHandler<any, any, ErrorShape>
	> = {},
>(
	state: FormState<ErrorShape, FormCustomState<CustomStateHandlers>>,
	action: FormAction<
		ErrorShape,
		UnknownIntent,
		{
			handlers: Record<string, IntentHandler<any, any>>;
			status: ApplyStatus;
			customStateHandlers?: CustomStateHandlers | undefined;
			reset: (
				defaultValue?: Record<string, unknown> | null | undefined,
			) => FormState<ErrorShape, FormCustomState<CustomStateHandlers>>;
		}
	>,
): FormState<ErrorShape, FormCustomState<CustomStateHandlers>> {
	if (action.reset) {
		return action.ctx.reset(action.targetValue);
	}

	const value = action.targetValue ?? action.submission.payload;

	// Apply the form error and target value from the result first
	state =
		action.type === 'client'
			? merge(state, {
					targetValue: action.targetValue ?? state.targetValue,
					serverValue: action.targetValue ? null : state.serverValue,
					// Update client error only if the error is different from the previous one to minimize unnecessary re-renders
					clientError:
						typeof action.error !== 'undefined' &&
						!deepEqual(state.clientError, action.error)
							? action.error
							: state.clientError,
					// Reset server error if form value is changed
					serverError:
						typeof action.error !== 'undefined' &&
						!deepEqual(state.serverValue, value)
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
					listKeys:
						action.type === 'server' && action.targetValue
							? pruneListKeys(state.listKeys, action.targetValue)
							: state.listKeys,
					targetValue:
						action.type === 'server' && action.targetValue
							? action.targetValue
							: state.targetValue,
					// Keep track of the value that the serverError is based on
					serverValue: !deepEqual(state.serverValue, value)
						? value
						: state.serverValue,
				});
	// Validate the whole form if no intent is provided (default submission)
	const intent = action.intent ?? { type: 'validate' };
	const handler = action.ctx.handlers?.[intent.type];

	if (handler && action.type === 'client') {
		if (typeof handler.move === 'function') {
			const handleMove = handler.move;
			state = moveState(state, action.submission.payload, value, (name) =>
				handleMove({
					name,
					payload: intent.payload,
					status: action.ctx.status,
					targetValue: action.targetValue,
				}),
			);
		} else if (typeof handler.resolve === 'function') {
			state = invalidateState(state, action.submission.payload, value);
		}
	}

	if (
		handler &&
		action.type !== 'server' &&
		typeof handler.touch === 'function'
	) {
		let touchedFields = state.touchedFields;

		for (const name of getFields(action)) {
			if (handler.touch({ name, payload: intent.payload })) {
				touchedFields = appendUniqueItem(touchedFields, name);
			}
		}

		state = merge(state, {
			touchedFields,
		});
	}

	return merge(state, {
		customState: updateCustomState(state.customState, action, {
			handlers: action.ctx.customStateHandlers,
		}),
	});
}

export function getFields<ErrorShape>(
	action: FormAction<ErrorShape, UnknownIntent>,
): string[] {
	let fields = action.submission.fields;

	if (action.error) {
		fields = fields.concat(Object.keys(action.error.fieldErrors));
	}

	const result = new Set(['']);

	for (const field of fields) {
		const paths = parsePath(field);

		for (let index = 1; index <= paths.length; index++) {
			result.add(formatPath(paths.slice(0, index)));
		}
	}

	return Array.from(result);
}

export function getApplyStatus(
	baseTargetValue: Record<string, unknown> | undefined,
	finalTargetValue: Record<string, unknown> | undefined,
): ApplyStatus {
	if (baseTargetValue === finalTargetValue) {
		return 'applied';
	}

	return typeof finalTargetValue === 'undefined' ? 'reverted' : 'modified';
}

/**
 * Fallback state transition for intents that change the payload shape without
 * providing a `move()` mapping. It drops list keys and touched fields under
 * changed paths so stale client state does not point at the wrong fields.
 */
export function invalidateState<
	ErrorShape,
	CustomState extends Record<string, unknown> = Record<string, unknown>,
>(
	state: FormState<ErrorShape, CustomState>,
	previousValue: Record<string, unknown>,
	nextValue: Record<string, unknown>,
): FormState<ErrorShape, CustomState> {
	if (previousValue === nextValue) {
		return state;
	}

	let changedNames: string[] = [];
	const stack: Array<{
		previousValue: unknown;
		nextValue: unknown;
		name: string;
	}> = [{ previousValue, nextValue, name: '' }];

	while (stack.length > 0) {
		const current = stack.pop();

		if (!current) {
			break;
		}

		if (Object.is(current.previousValue, current.nextValue)) {
			continue;
		}

		if (
			Array.isArray(current.previousValue) &&
			Array.isArray(current.nextValue)
		) {
			changedNames = changedNames.concat(current.name);
			continue;
		}

		if (
			isPlainObject(current.previousValue) &&
			isPlainObject(current.nextValue)
		) {
			for (const key of new Set([
				...Object.keys(current.previousValue),
				...Object.keys(current.nextValue),
			])) {
				stack.push({
					previousValue: current.previousValue[key],
					nextValue: current.nextValue[key],
					name: appendPath(current.name, key),
				});
			}

			continue;
		}

		const basePath = parsePath(current.name);

		if (
			changedNames.some(
				(existingName) =>
					getRelativePath(current.name, parsePath(existingName)) !== null,
			)
		) {
			continue;
		}

		changedNames = changedNames
			.filter(
				(existingName) => getRelativePath(existingName, basePath) === null,
			)
			.concat(current.name);
	}

	const basePaths = changedNames.map(parsePath);

	if (basePaths.length === 0) {
		return state;
	}

	let listKeys = state.listKeys;
	let touchedFields = state.touchedFields;

	if (Object.keys(state.listKeys).length > 0) {
		let changed = false;

		const entries = Object.entries(state.listKeys).filter(([name]) => {
			const keep = !basePaths.some(
				(basePath) => getRelativePath(name, basePath) !== null,
			);

			changed ||= !keep;

			return keep;
		});

		if (changed) {
			listKeys = Object.fromEntries(entries);
		}
	}

	if (state.touchedFields.length > 0) {
		let changed = false;

		const nextTouchedFields = state.touchedFields.filter((name) => {
			const keep = !basePaths.some(
				(basePath) => getRelativePath(name, basePath) !== null,
			);

			changed ||= !keep;

			return keep;
		});

		if (changed) {
			touchedFields = nextTouchedFields;
		}
	}

	return merge(state, {
		listKeys,
		touchedFields,
	});
}

/**
 * Preserves list keys and touched fields for intents that can map old field
 * paths to new ones, such as insert, remove, and reorder.
 */
export function moveState<
	ErrorShape,
	CustomState extends Record<string, unknown> = Record<string, unknown>,
>(
	state: FormState<ErrorShape, CustomState>,
	previousValue: Record<string, unknown>,
	nextValue: Record<string, unknown>,
	move: (name: string) => string | null,
): FormState<ErrorShape, CustomState> {
	if (previousValue === nextValue) {
		return state;
	}

	function collectListEntries(
		value: unknown,
		name = '',
		entries: string[] = [],
	): string[] {
		if (Array.isArray(value)) {
			entries.push(name);

			for (let index = 0; index < value.length; index++) {
				collectListEntries(value[index], appendPath(name, index), entries);
			}
		} else if (isPlainObject(value)) {
			for (const [key, childValue] of Object.entries(value)) {
				collectListEntries(childValue, appendPath(name, key), entries);
			}
		}

		return entries;
	}

	function getListEntry(name: string | null): {
		name: string;
		index: number;
	} | null {
		if (name === null) {
			return null;
		}

		const paths = parsePath(name);
		const index = paths[paths.length - 1];

		if (typeof index !== 'number') {
			return null;
		}

		return {
			name: formatPath(paths.slice(0, -1)),
			index,
		};
	}

	const targetSlots: Record<string, Array<string | undefined>> = {};

	const getTargetSlots = (listName: string): Array<string | undefined> =>
		(targetSlots[listName] ??= Array.from<unknown, string | undefined>(
			{ length: getPathArray(nextValue, listName).length },
			() => undefined,
		));

	for (const listName of collectListEntries(previousValue)) {
		const sourceKeys =
			state.listKeys[listName] ??
			getDefaultListKey(state.resetKey, previousValue, listName);

		for (let index = 0; index < sourceKeys.length; index++) {
			const entry = getListEntry(move(appendPath(listName, index)));

			if (!entry) {
				continue;
			}

			const target = getTargetSlots(entry.name);

			if (entry.index >= target.length) {
				continue;
			}

			target[entry.index] ??= sourceKeys[index];
		}
	}

	let touchedFields = state.touchedFields;

	for (const [index, currentName] of state.touchedFields.entries()) {
		const movedName = move(currentName);

		if (movedName === currentName) {
			continue;
		}

		touchedFields = state.touchedFields.slice(0, index);

		if (movedName !== null) {
			touchedFields.push(movedName);
		}

		for (const nextName of state.touchedFields.slice(index + 1)) {
			const movedName = move(nextName);

			if (movedName !== null) {
				touchedFields.push(movedName);
			}
		}

		break;
	}

	let changed = false;

	const result: Record<string, string[]> = {};
	const listNames = new Set([
		...Object.keys(state.listKeys),
		...Object.keys(targetSlots),
	]);

	for (const listName of listNames) {
		const keys = targetSlots[listName];
		const currentKeys = state.listKeys[listName];

		if (!keys) {
			changed = true;
			continue;
		}

		const nextKeys = keys.map((key) => key ?? generateUniqueKey());
		const defaultKeys = getDefaultListKey(state.resetKey, nextValue, listName);

		if (deepEqual(nextKeys, defaultKeys)) {
			changed ||= typeof currentKeys !== 'undefined';
			continue;
		}

		if (currentKeys && deepEqual(currentKeys, nextKeys)) {
			result[listName] = currentKeys;
			continue;
		}

		result[listName] = nextKeys;
		changed = true;
	}

	return merge(state, {
		listKeys: changed ? result : state.listKeys,
		touchedFields,
	});
}

/**
 * Removes list keys where array length has changed to force regeneration.
 * Minimizes UI state loss by only invalidating keys when necessary.
 */
export function pruneListKeys(
	listKeys: Record<string, string[]>,
	targetValue: Record<string, unknown>,
): Record<string, string[]> {
	let result = listKeys;

	for (const [name, keys] of Object.entries(listKeys)) {
		const list = getPathArray(targetValue, name);

		// Reset list keys only if the length has changed
		// to minimize potential UI state loss due to key changes
		if (keys.length !== list.length) {
			// Create a shallow copy to avoid mutating the original object
			if (result === listKeys) {
				result = { ...result };
			}

			// Remove the list key to force regeneration
			delete result[name];
		}
	}

	return result;
}

export function getDefaultPayload(
	context: FormContext<any>,
	name: string,
): unknown {
	const value = getPathValue(
		context.state.serverValue ??
			context.state.targetValue ??
			context.state.defaultValue,
		name,
	);

	if (value === null) {
		return null;
	}

	return normalize(value, {
		serialize: context.serialize,
		stripEmptyValue: false,
		name,
	});
}

export function getDefaultValue(
	context: FormContext<any>,
	name: string,
): string {
	const value = getPathValue(
		context.state.serverValue ??
			context.state.targetValue ??
			context.state.defaultValue,
		name,
	);
	const serializedValue = context.serialize(value, {
		name,
	});

	if (typeof serializedValue === 'string') {
		return serializedValue;
	}

	return '';
}

export function getDefaultOptions(
	context: FormContext<any>,
	name: string,
): string[] {
	const value = getPathValue(
		context.state.serverValue ??
			context.state.targetValue ??
			context.state.defaultValue,
		name,
	);
	const serializedValue = context.serialize(value, { name });

	if (
		Array.isArray(serializedValue) &&
		serializedValue.every((item) => typeof item === 'string')
	) {
		return serializedValue;
	}

	if (typeof serializedValue === 'string') {
		return [serializedValue];
	}

	return [];
}

export function isDefaultChecked(
	context: FormContext<any>,
	name: string,
): boolean {
	const value = getPathValue(
		context.state.serverValue ??
			context.state.targetValue ??
			context.state.defaultValue,
		name,
	);
	const serializedValue = context.serialize(value, { name });

	if (typeof serializedValue === 'string') {
		return serializedValue === context.serialize(true, { name });
	}

	return false;
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

	const paths = parsePath(name);

	return state.touchedFields.some(
		(field) => field !== name && getRelativePath(field, paths) !== null,
	);
}

export function getDefaultListKey(
	prefix: string,
	initialValue: Record<string, unknown> | null,
	name: string,
): string[] {
	return getPathArray(initialValue, name).map(
		(_, index) => `${prefix}-${appendPath(name, index)}`,
	);
}

export function getListKey(context: FormContext<any>, name: string): string[] {
	return (
		context.state.listKeys?.[name] ??
		getDefaultListKey(
			context.state.resetKey,
			context.state.serverValue ??
				context.state.targetValue ??
				context.state.defaultValue,
			name,
		)
	);
}

export function getErrors<ErrorShape>(
	state: FormState<ErrorShape>,
	name?: string,
): ErrorShape | undefined {
	const error = state.serverError ?? state.clientError;

	if (!error || !isTouched(state, name)) {
		return;
	}

	const errors = name ? error.fieldErrors[name] : error.formErrors;

	if (errors != null) {
		return errors;
	}
}

export function getFieldErrors<ErrorShape>(
	state: FormState<ErrorShape>,
	name?: string,
) {
	const result: Record<string, ErrorShape> = {};
	const error = state.serverError ?? state.clientError;

	if (error) {
		const basePath = parsePath(name);

		for (const field of Object.keys(error.fieldErrors)) {
			const relativePath = getRelativePath(field, basePath);

			// Only include errors for specified field's children
			if (!relativePath || relativePath.length === 0) {
				continue;
			}

			const error = getErrors(state, field);

			if (typeof error !== 'undefined') {
				result[formatPath(relativePath)] = error;
			}
		}
	}

	return result;
}

/**
 * Checks if fieldErrors contains any errors at the given name or any child path.
 */
export function hasFieldError<ErrorShape>(
	error: FormError<ErrorShape>,
	name: string,
): boolean {
	const basePath = parsePath(name);

	return Object.entries(error.fieldErrors).some(
		([field, fieldError]) =>
			getRelativePath(field, basePath) !== null && fieldError !== null,
	);
}

export function isValid(state: FormState<any>, name?: string): boolean {
	const error = state.serverError ?? state.clientError;

	// If there is no error, it must be valid
	if (!error) {
		return true;
	}

	const basePath = parsePath(name);

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

export function getFormMetadata<
	ErrorShape,
	CustomFormMetadata extends Record<string, unknown> = {},
	CustomFieldMetadata extends Record<string, unknown> = {},
	CustomState extends Record<string, unknown> = {},
>(
	context: FormContext<ErrorShape, CustomState>,
	options?: {
		extendFormMetadata?:
			| ((
					metadata: BaseFormMetadata<ErrorShape, CustomState>,
			  ) => CustomFormMetadata)
			| undefined;
		extendFieldMetadata?:
			| (<FieldShape>(
					metadata: BaseFieldMetadata<FieldShape, ErrorShape>,
					ctx: {
						form: BaseFormMetadata<ErrorShape, CustomState>;
						when: DefineConditionalField;
					},
			  ) => CustomFieldMetadata)
			| undefined;
	},
): FormMetadata<
	ErrorShape,
	CustomFormMetadata,
	CustomFieldMetadata,
	CustomState
> {
	const metadata: BaseFormMetadata<ErrorShape, CustomState> = {
		key: context.state.resetKey,
		id: context.formId,
		errorId: `${context.formId}-form-error`,
		descriptionId: `${context.formId}-form-description`,
		defaultValue: context.state.defaultValue,
		get customState() {
			return context.state.customState;
		},
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
				extendFieldMetadata: options?.extendFieldMetadata,
			});
		},
		getFieldset(name) {
			return getFieldset(context, {
				name,
				extendFieldMetadata: options?.extendFieldMetadata,
			});
		},
		getFieldList(name) {
			return getFieldList(context, {
				name,
				extendFieldMetadata: options?.extendFieldMetadata,
			});
		},
	};

	const customMetadata = options?.extendFormMetadata?.(metadata) ?? {};
	const descriptors = Object.getOwnPropertyDescriptors(customMetadata);
	const extended = Object.create(metadata);
	Object.defineProperties(extended, descriptors);

	return extended as FormMetadata<
		ErrorShape,
		CustomFormMetadata,
		CustomFieldMetadata,
		CustomState
	>;
}

export function getField<
	FieldShape,
	ErrorShape = string,
	CustomFieldMetadata extends Record<string, unknown> = {},
>(
	context: FormContext<ErrorShape, any>,
	options: {
		name: FieldName<FieldShape>;
		extendFieldMetadata?:
			| (<F>(
					metadata: BaseFieldMetadata<F, ErrorShape>,
					ctx: {
						form: BaseFormMetadata<ErrorShape, any>;
						when: DefineConditionalField;
					},
			  ) => CustomFieldMetadata)
			| undefined;
		form?: BaseFormMetadata<ErrorShape, any> | undefined;
		key?: string | undefined;
	},
): FieldMetadata<FieldShape, ErrorShape, CustomFieldMetadata> {
	const {
		key,
		name,
		extendFieldMetadata,
		form = getFormMetadata(context, {
			extendFieldMetadata,
		}),
	} = options;
	const id = `${context.formId}-field-${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
	const constraint = context.constraint?.[name];
	const metadata: BaseFieldMetadata<FieldShape, ErrorShape> = {
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
		accept: constraint?.accept,
		get defaultValue() {
			return getDefaultValue(context, name);
		},
		get defaultOptions() {
			return getDefaultOptions(context, name);
		},
		get defaultChecked() {
			return isDefaultChecked(context, name);
		},
		get defaultPayload() {
			return getDefaultPayload(context, name);
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
				extendFieldMetadata,
			});
		},
		// @ts-expect-error The return type includes CustomFieldMetadata which BaseFieldMetadata
		// doesn't account for. This is a type-level limitation; runtime behavior is correct.
		getFieldList() {
			return getFieldList(context, {
				name,
				extendFieldMetadata,
			});
		},
	};

	const customMetadata = extendFieldMetadata?.(metadata, { form, when }) ?? {};
	const descriptors = Object.getOwnPropertyDescriptors(customMetadata);
	const extended = Object.create(metadata);
	Object.defineProperties(extended, descriptors);

	return extended as FieldMetadata<FieldShape, ErrorShape, CustomFieldMetadata>;
}

/**
 * Creates a proxy that dynamically generates field objects when properties are accessed.
 */
export function getFieldset<
	FieldShape = Record<string, any>,
	ErrorShape = string,
	CustomFieldMetadata extends Record<string, unknown> = {},
>(
	context: FormContext<ErrorShape, any>,
	options: {
		name?: FieldName<FieldShape> | undefined;
		extendFieldMetadata?:
			| (<F>(
					metadata: BaseFieldMetadata<F, ErrorShape>,
					ctx: {
						form: BaseFormMetadata<ErrorShape, any>;
						when: DefineConditionalField;
					},
			  ) => CustomFieldMetadata)
			| undefined;
		form?: BaseFormMetadata<ErrorShape, any> | undefined;
	},
): Fieldset<FieldShape, ErrorShape, CustomFieldMetadata> {
	return new Proxy({} as any, {
		get(target, name, receiver) {
			if (typeof name === 'string') {
				options.form ??= getFormMetadata(context, {
					extendFieldMetadata: options?.extendFieldMetadata,
				});

				return getField(context, {
					name: appendPath(options?.name, name),
					extendFieldMetadata: options.extendFieldMetadata,
					form: options.form,
				});
			}

			return Reflect.get(target, name, receiver);
		},
	});
}

/**
 * Creates an array of field objects for list/array inputs
 */
export function getFieldList<
	FieldShape = Array<any>,
	ErrorShape = string,
	CustomFieldMetadata extends Record<string, unknown> = {},
>(
	context: FormContext<ErrorShape, any>,
	options: {
		name: FieldName<FieldShape>;
		extendFieldMetadata?:
			| (<F>(
					metadata: BaseFieldMetadata<F, ErrorShape>,
					ctx: {
						form: BaseFormMetadata<ErrorShape, any>;
						when: DefineConditionalField;
					},
			  ) => CustomFieldMetadata)
			| undefined;
	},
): FieldMetadata<
	[FieldShape] extends [Array<infer ItemShape> | null | undefined]
		? ItemShape
		: unknown,
	ErrorShape,
	CustomFieldMetadata
>[] {
	const keys = getListKey(context, options.name);

	return keys.map((key, index) => {
		return getField<
			[FieldShape] extends [Array<infer ItemShape> | null | undefined]
				? ItemShape
				: unknown,
			ErrorShape,
			CustomFieldMetadata
		>(context, {
			name: appendPath(options.name, index),
			extendFieldMetadata: options.extendFieldMetadata,
			key,
		});
	});
}

export function defineCustomState<
	State,
	CustomIntentHandlers extends Record<string, IntentHandler<any, any>> = {},
	ErrorShape = any,
>(
	definition: CustomStateHandler<State, CustomIntentHandlers, ErrorShape>,
): CustomStateHandler<State, CustomIntentHandlers, ErrorShape> {
	return definition;
}

export function mergeCustomStateHandlers<
	GlobalCustomState extends
		| Record<string, CustomStateHandler<any, any, any>>
		| undefined,
	InlineCustomState extends
		| Record<string, CustomStateHandler<any, any, any>>
		| undefined,
>(
	globalCustomState: GlobalCustomState,
	inlineCustomState: InlineCustomState,
): GlobalCustomState & InlineCustomState {
	if (globalCustomState && inlineCustomState) {
		for (const key of Object.keys(inlineCustomState)) {
			if (key in globalCustomState) {
				throw new Error(`Duplicate custom state key "${key}"`);
			}
		}
	}

	return {
		...globalCustomState,
		...inlineCustomState,
	};
}

export function initializeCustomState<
	ErrorShape,
	CustomStateHandlers extends Record<
		string,
		CustomStateHandler<any, any, ErrorShape>
	>,
>(options: {
	handlers: CustomStateHandlers | undefined;
	lastState?: FormCustomState<CustomStateHandlers> | undefined;
	reset: boolean;
}): FormCustomState<CustomStateHandlers> {
	return Object.fromEntries(
		Object.entries(options.handlers ?? {}).map(([key, handler]) => [
			key,
			handler.initialize({
				lastState: options.lastState?.[key],
				reset: options.reset,
			}),
		]),
	) as FormCustomState<CustomStateHandlers>;
}

export function updateCustomState<
	ErrorShape,
	CustomStateHandlers extends Record<
		string,
		CustomStateHandler<any, any, ErrorShape>
	>,
>(
	state: FormCustomState<CustomStateHandlers>,
	action: FormAction<ErrorShape, UnknownIntent>,
	options: {
		handlers: CustomStateHandlers | undefined;
		lastState?: FormCustomState<CustomStateHandlers> | undefined;
	},
): FormCustomState<CustomStateHandlers> {
	if (!options.handlers) {
		return state;
	}

	if (action.reset) {
		return initializeCustomState({
			handlers: options.handlers,
			lastState: options.lastState ?? state,
			reset: true,
		});
	}

	return Object.fromEntries(
		Object.entries(options.handlers).map(([key, handler]) => {
			let nextState = state[key];

			if (action.type !== 'server' && handler.handleIntent) {
				nextState = handler.handleIntent(nextState, {
					intent: action.intent,
					submission: action.submission,
				});
			}

			if (handler.handleResult) {
				nextState = handler.handleResult(nextState, {
					intent: action.intent,
					submission: action.submission,
					error: action.error,
					phase: action.type === 'client' ? 'client' : 'server',
				});
			}

			return [key, nextState];
		}),
	) as FormCustomState<CustomStateHandlers>;
}
