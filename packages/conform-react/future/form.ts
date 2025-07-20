import type {
	ValidationAttributes,
	FormValue,
	Submission,
} from '@conform-to/dom/future';
import {
	isFieldElement,
	getPathSegments,
	isPlainObject,
	setValueAtPath,
	updateField,
	serialize,
	getValueAtPath,
	appendPathSegment,
	getRelativePath,
	deepEqual,
} from '@conform-to/dom/future';
import {
	addItem,
	configureListIndexUpdate,
	getListValue,
	isNonNullable,
	isOptional,
	isNumber,
	isString,
	mapItems,
	mapKeys,
	insertItem,
	reorderItems,
	removeItem,
	merge,
} from './util';
import type {
	FormContext,
	FormState,
	FormIntent,
	ResetIntent,
	ValidateIntent,
	UpdateIntent,
	ListIntent,
	Fieldset,
	FormAction,
	UnknownIntent,
	FormMetadata,
	DefaultFieldMetadata,
} from './types';

export function updateKeys(
	keys: Record<string, string[]> = {},
	keyToBeRemoved: string,
	updateKey?: (key: string) => string | null,
): Record<string, string[]> {
	const basePath = getPathSegments(keyToBeRemoved);
	return mapKeys(keys, (field) =>
		getRelativePath(field, basePath) !== null
			? null
			: updateKey?.(field) ?? field,
	);
}

export function modify<Data>(
	data: Record<string, Data>,
	name: string,
	value: Data | Record<string, Data>,
): Record<string, Data> {
	if (name === '') {
		if (!isPlainObject(value)) {
			throw new Error('The value must be an object');
		}

		return value;
	}

	return setValueAtPath(data, getPathSegments(name), value, { clone: true });
}

export function serializeIntent(intent: UnknownIntent): string {
	if (!intent.payload) {
		return intent.type;
	}

	return `${intent.type}(${JSON.stringify(intent.payload)})`;
}

export function deserializeIntent(value: string): UnknownIntent {
	let type = value;
	let payload: unknown;
	let serializedPayload: string | undefined;

	const openParenIndex = value.indexOf('(');

	if (openParenIndex > 0 && value[value.length - 1] === ')') {
		type = value.slice(0, openParenIndex);
		serializedPayload = value.slice(openParenIndex + 1, -1);
	}

	if (serializedPayload) {
		try {
			payload = JSON.parse(serializedPayload);
		} catch {
			// Ignore the error
		}
	}

	return {
		type,
		payload,
	};
}

export type FormControl = {
	initializeState<FormShape, ErrorShape>(): FormState<FormShape, ErrorShape>;
	updateState<FormShape, ErrorShape>(
		state: FormState<FormShape, ErrorShape>,
		action: FormAction<
			FormShape,
			ErrorShape,
			{ reset: () => FormState<FormShape, ErrorShape> }
		>,
	): FormState<FormShape, ErrorShape>;
	serializeIntent(intent: FormIntent): string;
	parseIntent(value: string): FormIntent | undefined;
	updateValue(
		value: Record<string, FormValue>,
		intent: FormIntent,
	): Record<string, FormValue> | null;
	getSideEffect<FormShape, ErrorShape>(
		intent: FormIntent,
		state: FormState<FormShape, ErrorShape>,
	): ((formElement: HTMLFormElement) => void) | null;
};

export function applyIntent(
	submission: Submission,
	options?: {
		pendingIntents?: Array<FormIntent>;
	},
): [FormIntent | undefined | null, Record<string, FormValue> | null] {
	if (!submission.intent) {
		return [null, submission.value];
	}

	const pendingIntents = options?.pendingIntents ?? [];
	const intent = control.parseIntent(submission.intent);

	let value: Record<string, FormValue> | null = submission.value;

	for (const pendingIntent of pendingIntents.concat(intent ?? [])) {
		value = control.updateValue(value, pendingIntent);

		if (value === null) {
			break;
		}
	}

	return [intent, value];
}

function baseUpdate<FormShape, ErrorShape>(
	state: FormState<FormShape, ErrorShape>,
	{
		type,
		result,
	}: FormAction<
		FormShape,
		ErrorShape,
		{
			reset: () => FormState<FormShape, ErrorShape>;
		}
	>,
): FormState<FormShape, ErrorShape> {
	const value = result.value ?? result.submission.value;

	if (type === 'server') {
		return {
			...state,
			submittedValue: value,
			// Update server error if the error is defined.
			// There is no need to check if the error is different as we are updating other states as well
			serverError:
				typeof result.error !== 'undefined' ? result.error : state.serverError,
			// Keep track of the value that the serverError is based on
			serverValidatedValue:
				typeof result.error !== 'undefined'
					? value
					: state.serverValidatedValue,
		};
	}

	return merge(state, {
		// Do not update the initialValue unless there is an intent
		// This is important to prevent unnecessary re-renders with async validation
		submittedValue: !result.intent ? state.submittedValue : value,
		// Update client error only if the error is different from the previous one to minimize unnecessary re-renders
		clientError:
			typeof result.error !== 'undefined' &&
			!deepEqual(state.clientError, result.error)
				? result.error
				: state.clientError,
		// Reset server error if form value is changed
		serverError:
			typeof result.error !== 'undefined' &&
			!deepEqual(state.serverValidatedValue, value)
				? null
				: state.serverError,
	});
}

export const control: FormControl = {
	initializeState() {
		return {
			keys: {},
			submittedValue: null,
			serverValidatedValue: null,
			serverError: null,
			clientError: null,
			touchedFields: [],
		};
	},
	updateState(state, action) {
		const { type, result, ctx } = action;
		const intent = result.intent;

		if (result.value === null) {
			return ctx.reset();
		}

		// `sumission.value` might not be correct if there are pending intents
		// This is why we use previous submittedValue if it is available
		const submittedValue = state.submittedValue ?? result.submission.value;
		const value = result.value ?? result.submission.value;

		if (intent === null || intent?.type === 'validate') {
			const name = intent?.payload ?? '';

			let touchedFields = state.touchedFields;

			if (name === '') {
				let fields = Array.from(result.submission.fields);

				// Sometimes we couldn't find out all the fields from the FormData, e.g. unchecked checkboxes
				// But the schema might have an error on those fields, so we need to include them
				if (result.error) {
					for (const name of Object.keys(result.error.fieldErrors)) {
						fields = addItem(fields, name);
					}
				}

				if (!deepEqual(state.touchedFields, fields)) {
					touchedFields = fields;
				}
			} else {
				touchedFields = addItem(state.touchedFields, name);
			}

			return merge(state, {
				...baseUpdate(state, action),
				// We don't want to update the submittedValue when it is a client-side validation
				// As validate happens much more frequently than other intents, this will prevent unnecessary re-renders
				submittedValue: type !== 'server' ? state.submittedValue : value,
				touchedFields,
			});
		}

		if (intent?.type === 'update') {
			let keys = state.keys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				const name = appendPathSegment(
					intent.payload.name,
					intent.payload.index,
				);
				// Remove all child keys
				keys = name === '' ? {} : updateKeys(state.keys, name);
			}

			return {
				...baseUpdate(state, action),
				keys,
			};
		}

		if (intent?.type === 'insert') {
			const list = getListValue(submittedValue, intent.payload.name);
			const index = intent.payload.index ?? list.length;
			const updateListIndex = configureListIndexUpdate(
				intent.payload.name,
				(currentIndex) =>
					index <= currentIndex ? currentIndex + 1 : currentIndex,
			);
			const touchedFields = addItem(
				mapItems(state.touchedFields, updateListIndex),
				intent.payload.name,
			);

			let keys = state.keys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				const listKeys = Array.from(
					state.keys[intent.payload.name] ??
						getDefaultListKey(submittedValue, intent.payload.name),
				);

				insertItem(listKeys, new Date().toISOString(), index);

				keys = {
					// Remove all child keys
					...updateKeys(
						state.keys,
						appendPathSegment(intent.payload.name, index),
						updateListIndex,
					),
					// Update existing list keys
					[intent.payload.name]: listKeys,
				};
			}

			return {
				...baseUpdate(state, action),
				keys,
				touchedFields,
			};
		}

		if (intent?.type === 'remove') {
			const updateListIndex = configureListIndexUpdate(
				intent.payload.name,
				(currentIndex) => {
					if (intent.payload.index === currentIndex) {
						return null;
					}

					return intent.payload.index < currentIndex
						? currentIndex - 1
						: currentIndex;
				},
			);
			const touchedFields = addItem(
				mapItems(state.touchedFields, updateListIndex),
				intent.payload.name,
			);

			let keys = state.keys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				const listKeys = Array.from(
					state.keys[intent.payload.name] ??
						getDefaultListKey(submittedValue, intent.payload.name),
				);

				removeItem(listKeys, intent.payload.index);

				keys = {
					// Remove all child keys
					...updateKeys(
						state.keys,
						appendPathSegment(intent.payload.name, intent.payload.index),
						updateListIndex,
					),
					// Update existing list keys
					[intent.payload.name]: listKeys,
				};
			}

			return {
				...baseUpdate(state, action),
				keys,
				touchedFields,
			};
		}

		if (intent?.type === 'reorder') {
			const updateListIndex = configureListIndexUpdate(
				intent.payload.name,
				(currentIndex) => {
					if (intent.payload.from === intent.payload.to) {
						return currentIndex;
					}

					if (currentIndex === intent.payload.from) {
						return intent.payload.to;
					}

					if (intent.payload.from < intent.payload.to) {
						return currentIndex > intent.payload.from &&
							currentIndex <= intent.payload.to
							? currentIndex - 1
							: currentIndex;
					}

					return currentIndex >= intent.payload.to &&
						currentIndex < intent.payload.from
						? currentIndex + 1
						: currentIndex;
				},
			);
			const touchedFields = addItem(
				mapItems(state.touchedFields, updateListIndex),
				intent.payload.name,
			);

			let keys = state.keys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				const listKeys = Array.from(
					state.keys[intent.payload.name] ??
						getDefaultListKey(submittedValue, intent.payload.name),
				);

				reorderItems(listKeys, intent.payload.from, intent.payload.to);

				keys = {
					// Remove all child keys
					...updateKeys(
						state.keys,
						appendPathSegment(intent.payload.name, intent.payload.from),
						updateListIndex,
					),
					// Update existing list keys
					[intent.payload.name]: listKeys,
				};
			}

			return {
				...baseUpdate(state, action),
				keys,
				touchedFields,
			};
		}

		return baseUpdate(state, action);
	},
	serializeIntent(intent) {
		return serializeIntent(intent);
	},
	parseIntent(value) {
		const intent = deserializeIntent(value);

		if (intent.type === 'reset') {
			return intent as ResetIntent;
		} else if (
			intent.type === 'validate' &&
			isOptional(intent.payload, isString)
		) {
			return intent as ValidateIntent;
		} else if (
			intent.type === 'update' &&
			isPlainObject(intent.payload) &&
			isOptional(intent.payload.name, isString) &&
			isNonNullable(intent.payload.value) &&
			isOptional(intent.payload.index, isNumber)
		) {
			return intent as UpdateIntent;
		} else if (
			(intent.type === 'insert' &&
				isPlainObject(intent.payload) &&
				isString(intent.payload.name) &&
				isOptional(intent.payload.index, isNumber)) ||
			(intent.type === 'remove' &&
				isPlainObject(intent.payload) &&
				isString(intent.payload.name) &&
				isNumber(intent.payload.index)) ||
			(intent.type === 'reorder' &&
				isPlainObject(intent.payload) &&
				isString(intent.payload.name) &&
				isNumber(intent.payload.from) &&
				isNumber(intent.payload.to))
		) {
			return intent as ListIntent;
		}
	},
	updateValue(value, intent) {
		if (intent.type === 'reset') {
			return null;
		}

		if (intent.type === 'update') {
			return modify(
				value,
				appendPathSegment(intent.payload.name, intent.payload.index),
				intent.payload.value,
			);
		}

		switch (intent.type) {
			case 'insert': {
				const list = Array.from<any>(getListValue(value, intent.payload.name));
				insertItem(
					list,
					intent.payload.defaultValue,
					intent.payload.index ?? list.length,
				);
				return modify(value, intent.payload.name, list);
			}
			case 'remove': {
				const list = Array.from<any>(getListValue(value, intent.payload.name));
				removeItem(list, intent.payload.index);
				return modify(value, intent.payload.name, list);
			}
			case 'reorder': {
				const list = Array.from<any>(getListValue(value, intent.payload.name));
				reorderItems(list, intent.payload.from, intent.payload.to);
				return modify(value, intent.payload.name, list);
			}
		}

		return value;
	},
	getSideEffect(intent) {
		if (intent.type === 'reset') {
			return (formElement) => formElement.reset();
		}

		if (intent.type === 'update') {
			return (formElement) => {
				const name = appendPathSegment(
					intent.payload.name,
					intent.payload.index,
				);
				const basePath = getPathSegments(name);

				for (const element of formElement.elements) {
					if (isFieldElement(element)) {
						const paths = getRelativePath(element.name, basePath);

						if (paths) {
							updateField(element, {
								value:
									serialize(getValueAtPath(intent.payload.value, paths)) ?? '',
							});

							// Update the element attribute to notify that this is changed by Conform
							element.dataset.conform = new Date().toISOString();
						}
					}
				}
			};
		}

		return null;
	},
};

/**
 * Determine if the field is validated
 *
 * This checks if the field is in the list of touched fields,
 * or if there is any child field that is validated, i.e. form / fieldset
 */
export function isValidated(state: FormState<any, any>, name = '') {
	if (state.touchedFields.includes(name)) {
		return true;
	}

	const paths = getPathSegments(name);

	return state.touchedFields.some(
		(field) => field !== name && getRelativePath(field, paths) !== null,
	);
}

export function getSerializedValue(
	valueObject: unknown,
	name: string,
	serializeFn: (value: unknown) => string | string[] | undefined = serialize,
): string | string[] | undefined {
	const value = getValueAtPath(valueObject, name);

	return serializeFn(value);
}

export function getErrors<ErrorShape>(
	state: FormState<any, ErrorShape>,
	name?: string,
): ErrorShape | undefined {
	const error = state.serverError ?? state.clientError;

	if (!error || !isValidated(state, name)) {
		return;
	}

	return (name ? error.fieldErrors[name] : error.formErrors) ?? undefined;
}

export function getDefaultListKey(
	formValue: Record<string, unknown> | null,
	name: string,
): string[] {
	return getListValue(formValue, name).map((_, index) =>
		appendPathSegment(name, index),
	);
}

export function createFormMetadata<
	FormShape,
	ErrorShape,
	FormProps extends React.DetailedHTMLProps<
		React.FormHTMLAttributes<HTMLFormElement>,
		HTMLFormElement
	>,
>(
	context: FormContext<FormShape, ErrorShape>,
	props: FormProps,
): FormMetadata<ErrorShape, FormProps> {
	return {
		id: context.formId,
		get errors() {
			return getErrors(context.state);
		},
		get fieldErrors() {
			const result: Record<string, ErrorShape> = {};

			for (const name of context.state.touchedFields) {
				const error = getErrors(context.state, name);

				if (typeof error !== 'undefined') {
					result[name] = error;
				}
			}

			return result;
		},
		get touched() {
			return isValidated(context.state);
		},
		get invalid() {
			return typeof this.errors !== 'undefined';
		},
		props,
	};
}

export function createFieldset<
	FormShape,
	ErrorShape,
	Metadata extends Record<string, unknown>,
>(
	context: FormContext<FormShape, ErrorShape>,
	options: {
		name?: string;
		serialize?: (value: unknown) => string | string[] | undefined;
		defineFieldMetadata?: (
			name: string,
			metadata: DefaultFieldMetadata<ErrorShape>,
			context: FormContext<FormShape, ErrorShape>,
		) => Metadata;
	},
): Fieldset<FormShape, Metadata> {
	const initialValue =
		context.state.submittedValue ?? context.defaultValue ?? {};
	const defaultValidationAttributes: ValidationAttributes = {
		required: undefined,
		minLength: undefined,
		maxLength: undefined,
		pattern: undefined,
		min: undefined,
		max: undefined,
		step: undefined,
		multiple: undefined,
	};

	function createField(name: string, key?: string) {
		const defaultMetadata: DefaultFieldMetadata<ErrorShape> = {
			...defaultValidationAttributes,
			...context.constraint?.[name],
			id: `${context.formId}-${name}`,
			descriptionId: `${context.formId}-${name}-description`,
			errorId: `${context.formId}-${name}-error`,
			get defaultValue() {
				const value = getSerializedValue(initialValue, name, options.serialize);

				return typeof value === 'string' ? value : value?.[0];
			},
			get defaultOptions() {
				const value = getSerializedValue(initialValue, name, options.serialize);

				return typeof value === 'string' ? [value] : value;
			},
			get defaultChecked() {
				const value = getSerializedValue(initialValue, name, options.serialize);

				return value === 'on';
			},
			get validated() {
				return isValidated(context.state, name);
			},
			get invalid() {
				return typeof getErrors(context.state, name) !== 'undefined';
			},
			get errors() {
				return getErrors(context.state, name);
			},
		};
		const metadata =
			options.defineFieldMetadata?.(name, defaultMetadata, context) ??
			defaultMetadata;

		return Object.assign(metadata, {
			key,
			name,
			getFieldset() {
				return createFieldset(context, {
					...options,
					name,
				});
			},
			getFieldList() {
				const keys =
					context.state.keys?.[name] ?? getDefaultListKey(initialValue, name);

				return keys.map((key, index) => {
					return createField(appendPathSegment(name, index), key);
				});
			},
		});
	}

	return new Proxy({} as any, {
		get(target, name, receiver) {
			if (typeof name !== 'string') {
				return Reflect.get(target, name, receiver);
			}

			return createField(appendPathSegment(options?.name, name));
		},
	});
}
