import type {
	FormError,
	FormValue,
	Submission,
	SubmissionResult,
} from 'conform-dom';
import {
	isInput,
	getPaths,
	getValue,
	isPlainObject,
	setValue,
} from 'conform-dom';
import { defaultSerialize, getDefaultListKey } from './metadata';
import {
	addItems,
	configureListIndexUpdate,
	getName,
	getListValue,
	isNonNullable,
	isNumber,
	isOptionalNumber,
	isOptionalString,
	isString,
	mapItems,
	deepEqual,
	mapKeys,
	mergeObjects,
	updateObject,
	insertItem,
	reorderItems,
	removeItem,
	updateFieldValue,
	getChildPaths,
} from './util';

export type DefaultValue<Schema> = Schema extends
	| string
	| number
	| boolean
	| Date
	| File
	| bigint
	| null
	| undefined
	? Schema | null | undefined
	: Schema extends Array<infer Item> | null | undefined
		? Array<DefaultValue<Item>> | null | undefined
		: Schema extends Record<string, any> | null | undefined
			? { [Key in keyof Schema]?: DefaultValue<Schema[Key]> } | null | undefined
			: unknown;

export type FormState<
	Schema,
	ErrorShape,
	CustomState extends Record<string, unknown> = {},
> = {
	initialValue: Record<string, unknown> | null;
	submittedValue: Record<string, FormValue> | null;
	serverError: FormError<Schema, ErrorShape> | null;
	clientError: FormError<Schema, ErrorShape> | null;
	touchedFields: string[];
	keys: Record<string, string[]>;
	custom: CustomState;
};

export function generateKey(): string {
	return Math.floor(Date.now() * Math.random()).toString(36);
}

export function updateKeys(
	keys: Record<string, string[]> = {},
	keyToBeRemoved: string,
	updateKey: (key: string) => string | null,
): Record<string, string[]> {
	return mapKeys(keys, (field) =>
		getChildPaths(keyToBeRemoved, field) !== null ? null : updateKey(field),
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

		return mergeObjects(data, value);
	}

	const paths = getPaths(name);
	const prevValue = getValue(data, paths);
	const nextValue =
		isPlainObject(prevValue) && isPlainObject(value)
			? mergeObjects(prevValue, value)
			: value;

	if (deepEqual(prevValue, nextValue)) {
		return data;
	}

	return setValue(data, paths, nextValue, { clone: true });
}

export type UnknownIntent = {
	type: string;
	payload?: unknown;
};

export type FormIntentHandler<
	Intent extends UnknownIntent | null,
	AdditionalState extends {} = {},
> = {
	isApplicable(intent: UnknownIntent | null): boolean;
	updateState<Schema, ErrorShape, State extends AdditionalState>(
		state: FormState<Schema, ErrorShape, State>,
		ctx: FormAction<Schema, ErrorShape, State, Intent>,
	): FormState<Schema, ErrorShape, State>;
	updateValue?: (
		value: Record<string, FormValue>,
		intent: Intent,
	) => Record<string, FormValue> | null;
	sideEffect?: <Schema, ErrorShape>(
		formElement: HTMLFormElement,
		ctx: {
			intent: Intent;
			state: FormState<Schema, ErrorShape, AdditionalState>;
		},
	) => void;
};

function getFields(result: SubmissionResult): string[] {
	const fields = result.fields;

	// Sometimes we couldn't find out all the fields from the FormData, e.g. unchecked checkboxes
	// But the schema might have an error on those fields, so we need to include them
	if (result.error) {
		for (const name of Object.keys(result.error.fieldError)) {
			// If the error is set as a child of an actual field, exclude it
			// e.g. A multi file input field (name="files") but the error is set on the first file (i.e. files[0])
			if (
				fields.find(
					(field) => field !== name && getChildPaths(field, name) !== null,
				)
			) {
				continue;
			}

			// If the name is not a child of any fields, this could be an unchecked checkbox or an empty multi select
			if (fields.every((field) => getChildPaths(name, field) === null)) {
				fields.push(name);
			}
		}
	}

	return fields;
}

export function serializeIntent(intent: UnknownIntent): string {
	if (!intent.payload) {
		return intent.type;
	}

	return [intent.type, JSON.stringify(intent.payload)].join('/');
}

export function deserializeIntent(value: string): UnknownIntent {
	const [type = value, stringifiedPayload] = value.split('/');

	let payload = stringifiedPayload;

	if (stringifiedPayload) {
		try {
			payload = JSON.parse(stringifiedPayload);
		} catch {
			// Ignore the error
		}
	}

	return {
		type,
		payload,
	};
}

export type FormControlIntent<Control extends FormControl<any, any>> =
	Control extends FormControl<infer Intent, any> ? Intent : never;

export type FormControlCustomState<Control extends FormControl<any, any>> =
	Control extends FormControl<any, infer CustomState> ? CustomState : never;

export type FormAction<
	Schema,
	ErrorShape,
	CustomState extends {},
	Intent extends UnknownIntent | null = UnknownIntent | null,
> = {
	type: 'server' | 'client';
	result: SubmissionResult<Schema, ErrorShape, Intent>;
	reset: () => FormState<Schema, ErrorShape, CustomState>;
};

export type FormControl<
	Intent extends UnknownIntent = never,
	CustomState extends {} = {},
> = {
	initializeState<Schema, ErrorShape>(): FormState<
		Schema,
		ErrorShape,
		CustomState
	>;
	updateState<Schema, ErrorShape, State extends CustomState>(
		state: FormState<Schema, ErrorShape, State>,
		action: FormAction<Schema, ErrorShape, State, UnknownIntent | null>,
	): FormState<Schema, ErrorShape, State>;
	serializeIntent(intent: UnknownIntent): string;
	deserializeIntent(value: string): UnknownIntent;
	parseIntent(intent: UnknownIntent): Intent | undefined;
	updateValue(
		value: Record<string, FormValue>,
		intent: UnknownIntent,
	): Record<string, FormValue> | null;
	hasSideEffect(intent: UnknownIntent): boolean;
	applySideEffect<Schema, ErrorShape>(
		formElement: HTMLFormElement,
		intent: UnknownIntent,
		state: FormState<Schema, ErrorShape, CustomState>,
	): void;
	extend<
		NewCustomState extends {} = {},
		NewIntent extends UnknownIntent = never,
	>(config: {
		onInitializeState: <Schema, ErrorShape>(
			initialState: FormState<Schema, ErrorShape, CustomState>,
		) => FormState<Schema, ErrorShape, CustomState & NewCustomState>;
		onUpdateState: <
			Schema,
			ErrorShape,
			AdditionalState extends CustomState & NewCustomState,
		>(
			state: FormState<Schema, ErrorShape, AdditionalState>,
			action: FormAction<
				Schema,
				ErrorShape,
				AdditionalState,
				NewIntent | Intent | null
			>,
		) => FormState<Schema, ErrorShape, AdditionalState>;
		onParseIntent?: (intent: UnknownIntent) => Intent | NewIntent | undefined;
		onUpdateValue?: (
			value: Record<string, FormValue>,
			intent: NewIntent | Intent,
		) => Record<string, FormValue> | null | undefined;
		hasSideEffect?: (intent: NewIntent | Intent) => boolean | undefined;
		onApplySideEffect?: <Schema, ErrorShape>(
			formElement: HTMLFormElement,
			intent: NewIntent | Intent,
			state: FormState<Schema, ErrorShape, CustomState & NewCustomState>,
		) => void;
	}): FormControl<Intent | NewIntent, CustomState & NewCustomState>;
};

export function createFormControl<
	Intent extends UnknownIntent,
	AdditionalState extends Record<string, unknown> = {},
>(
	configure: () => FormControl<Intent, AdditionalState>,
): FormControl<Intent, AdditionalState> {
	return configure();
}

export function applyIntent(
	submission: Submission,
	options?: {
		control?: undefined;
		pendingIntents?: Array<FormControlIntent<typeof baseControl>>;
	},
): [
	FormControlIntent<typeof baseControl> | undefined | null,
	Record<string, FormValue> | null,
];
export function applyIntent<Intent extends UnknownIntent>(
	submission: Submission,
	options: {
		control: FormControl<Intent, any>;
		pendingIntents?: Array<Intent>;
	},
): [Intent | undefined | null, Record<string, FormValue> | null];
export function applyIntent<Intent extends UnknownIntent>(
	submission: Submission,
	options?: {
		control?: FormControl<Intent | FormControlIntent<typeof baseControl>, any>;
		pendingIntents?: Array<Intent | FormControlIntent<typeof baseControl>>;
	},
): [
	Intent | FormControlIntent<typeof baseControl> | undefined | null,
	Record<string, FormValue> | null,
] {
	const { control = baseControl, pendingIntents = [] } = options ?? {};

	if (!submission.intent) {
		return [null, submission.value];
	}

	const intent = control.parseIntent(
		control.deserializeIntent(submission.intent),
	);

	let value: Record<string, FormValue> | null = submission.value;

	for (const pendingIntent of pendingIntents.concat(intent ?? [])) {
		value = control.updateValue(value, pendingIntent);

		if (value === null) {
			break;
		}
	}

	return [intent, value];
}

export type ResetIntent = {
	type: 'reset';
};

export type ValidateIntent = {
	type: 'validate';
	payload?: string;
};

export type UpdateIntent = {
	type: 'update';
	payload: {
		name?: string;
		index?: number;
		value: FormValue<string>;
	};
};

export type ListIntent =
	| {
			type: 'insert';
			payload: {
				name: string;
				index?: number;
				defaultValue?: unknown;
			};
	  }
	| {
			type: 'remove';
			payload: {
				name: string;
				index: number;
			};
	  }
	| {
			type: 'reorder';
			payload: {
				name: string;
				from: number;
				to: number;
			};
	  };

export const bareControl: FormControl = {
	initializeState() {
		return {
			keys: {},
			initialValue: null,
			submittedValue: null,
			serverError: null,
			clientError: null,
			touchedFields: [],
			custom: {},
		};
	},
	updateState(state, { type, result, reset }) {
		if (result.value === null) {
			return reset();
		}

		return updateObject(state, {
			clientError:
				type === 'client' &&
				typeof result.error !== 'undefined' &&
				!deepEqual(state.clientError, result.error)
					? result.error
					: state.clientError,
			serverError:
				type === 'server'
					? // Update server error only if the error is different from the previous one
						result.error
						? !deepEqual(state.serverError, result.error)
							? result.error
							: state.serverError
						: null
					: // Reset server error only if the submitted value is different
						typeof result.error !== 'undefined' &&
						  !deepEqual(
								state.submittedValue,
								result.value ?? result.submittedValue,
						  )
						? null
						: state.serverError,
			submittedValue:
				type === 'server'
					? result.value ?? result.submittedValue
					: state.submittedValue,
			initialValue:
				type === 'server'
					? result.value ?? result.submittedValue
					: state.initialValue,
		});
	},
	deserializeIntent(value) {
		return deserializeIntent(value);
	},
	serializeIntent(intent) {
		return serializeIntent(intent);
	},
	parseIntent() {
		return;
	},
	updateValue(value) {
		return value;
	},
	hasSideEffect() {
		return false;
	},
	applySideEffect() {
		return;
	},
	extend({
		onInitializeState,
		onUpdateState,
		onParseIntent,
		onUpdateValue,
		hasSideEffect,
		onApplySideEffect,
	}) {
		const control = Object.assign({}, this);

		return {
			...this,
			initializeState: <Schema, ErrorShape>() => {
				const initialState = control.initializeState<Schema, ErrorShape>();
				return onInitializeState(initialState);
			},
			updateState: (state, action) => {
				const resultState = control.updateState(state, action);
				const intent = action.result.intent
					? onParseIntent?.(action.result.intent) ??
						control.parseIntent(action.result.intent)
					: null;

				if (typeof intent === 'undefined') {
					return resultState;
				}

				return onUpdateState(resultState, {
					type: action.type,
					reset: action.reset,
					result: {
						...action.result,
						intent,
					},
				});
			},
			parseIntent: (intent) => {
				return onParseIntent?.(intent) ?? control.parseIntent(intent);
			},
			updateValue: (value, intent) => {
				if (typeof onUpdateValue === 'function') {
					const updatedIntent =
						onParseIntent?.(intent) ?? control.parseIntent(intent);

					if (updatedIntent) {
						const result = onUpdateValue(value, updatedIntent);

						// If the result is defined, return it (overrides the default behavior)
						if (typeof result !== 'undefined') {
							return result;
						}
					}
				}

				// Otherwise, use the default behavior
				return control.updateValue(value, intent);
			},
			hasSideEffect: (intent) => {
				const updatedIntent =
					onParseIntent?.(intent) ?? control.parseIntent(intent);

				if (typeof updatedIntent === 'undefined') {
					return false;
				}

				return (
					hasSideEffect?.(updatedIntent) ?? control.hasSideEffect(updatedIntent)
				);
			},
			applySideEffect(formElement, intent, state) {
				const updatedIntent =
					onParseIntent?.(intent) ?? control.parseIntent(intent);

				if (typeof updatedIntent !== 'undefined') {
					control.applySideEffect(formElement, updatedIntent, state);
					onApplySideEffect?.(formElement, updatedIntent, state);
				}
			},
		};
	},
};

export const baseControl = bareControl
	.extend<{}, ResetIntent>({
		onParseIntent(intent) {
			if (intent.type === 'reset') {
				return intent as ResetIntent;
			}
		},
		onInitializeState(initialState) {
			return initialState;
		},
		onUpdateState(state, { result, reset }) {
			if (result.intent?.type === 'reset') {
				return reset();
			}

			return state;
		},
		onUpdateValue(_, intent) {
			if (intent.type === 'reset') {
				return null;
			}
		},
		hasSideEffect(intent) {
			if (intent.type === 'reset') {
				return true;
			}
		},
		onApplySideEffect(formElement, intent) {
			if (intent.type === 'reset') {
				formElement.reset();
			}
		},
	})
	.extend<{}, ValidateIntent>({
		onParseIntent(intent) {
			if (intent.type === 'validate' && isOptionalString(intent.payload)) {
				return intent as ValidateIntent;
			}
		},
		onInitializeState(initialState) {
			return initialState;
		},
		onUpdateState(state, { result }) {
			if (result.intent === null || result.intent.type === 'validate') {
				const name = result.intent?.payload ?? '';

				if (name === '') {
					const fields = getFields(result);

					return {
						...state,
						touchedFields: deepEqual(state.touchedFields, fields)
							? state.touchedFields
							: fields,
					};
				}

				if (!state.touchedFields.includes(name)) {
					return {
						...state,
						touchedFields: state.touchedFields.concat(name),
					};
				}
			}

			return state;
		},
	})
	.extend<{}, UpdateIntent>({
		onParseIntent(intent) {
			if (
				intent.type === 'update' &&
				isPlainObject(intent.payload) &&
				isOptionalString(intent.payload.name) &&
				isNonNullable(intent.payload.value) &&
				isOptionalNumber(intent.payload.index)
			) {
				return intent as UpdateIntent;
			}
		},
		onInitializeState(initialState) {
			return initialState;
		},
		onUpdateState(state, { result }) {
			if (result.intent?.type === 'update') {
				return {
					...state,
					initialValue: result.value ?? result.submittedValue,
				};
			}

			return state;
		},
		onUpdateValue(value, intent) {
			if (intent.type === 'update') {
				return modify(
					value,
					getName(intent.payload.name, intent.payload.index),
					intent.payload.value,
				);
			}
		},
		hasSideEffect(intent) {
			if (intent.type === 'update') {
				return true;
			}
		},
		onApplySideEffect(formElement, intent) {
			if (intent.type === 'update') {
				const name = getName(intent.payload.name, intent.payload.index);
				const parentPaths = getPaths(name);

				for (const element of formElement.elements) {
					if (isInput(element)) {
						const paths = getChildPaths(parentPaths, element.name);

						if (paths) {
							updateFieldValue(element, {
								value: defaultSerialize(getValue(intent.payload.value, paths)),
							});

							// Update the element attribute to notify that this is changed by Conform
							element.dataset.conform = generateKey();
						}
					}
				}
			}
		},
	})
	.extend<{}, ListIntent>({
		onParseIntent(intent) {
			if (
				(intent.type === 'insert' &&
					isPlainObject(intent.payload) &&
					isString(intent.payload.name) &&
					isOptionalNumber(intent.payload.index)) ||
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
		onInitializeState(initialState) {
			return initialState;
		},
		onUpdateState(state, { type, result }) {
			const intent = result.intent;
			const formValue = state.initialValue ?? result.submittedValue;

			if (intent) {
				switch (intent.type) {
					case 'insert': {
						const list = getListValue(formValue, intent.payload.name);
						const index = intent.payload.index ?? list.length;
						const updateListIndex = configureListIndexUpdate(
							intent.payload.name,
							(currentIndex) =>
								index <= currentIndex ? currentIndex + 1 : currentIndex,
						);
						const touchedFields = addItems(
							mapItems(state.touchedFields, updateListIndex),
							[intent.payload.name],
						);

						if (type === 'server') {
							return {
								...state,
								touchedFields,
							};
						}
						const listKeys = Array.from(
							state.keys[intent.payload.name] ??
								getDefaultListKey(formValue, intent.payload.name),
						);
						const itemName = getName(intent.payload.name, index);

						insertItem(listKeys, generateKey(), index);

						return {
							...state,
							keys: {
								// Remove all child keys
								...updateKeys(state.keys, itemName, updateListIndex),
								// Update existing list keys
								[intent.payload.name]: listKeys,
							},
							initialValue: result.value ?? result.submittedValue,
							touchedFields,
						};
					}
					case 'remove': {
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
						const touchedFields = addItems(
							mapItems(state.touchedFields, updateListIndex),
							[intent.payload.name],
						);

						if (type === 'server') {
							return {
								...state,
								touchedFields,
							};
						}

						const listKeys = Array.from(
							state.keys[intent.payload.name] ??
								getDefaultListKey(formValue, intent.payload.name),
						);

						removeItem(listKeys, intent.payload.index);

						return {
							...state,
							keys: {
								// Remove all child keys
								...updateKeys(
									state.keys,
									getName(intent.payload.name, intent.payload.index),
									updateListIndex,
								),
								// Update existing list keys
								[intent.payload.name]: listKeys,
							},
							initialValue: result.value ?? result.submittedValue,
							touchedFields,
						};
					}
					case 'reorder': {
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
						const touchedFields = addItems(
							mapItems(state.touchedFields, updateListIndex),
							[intent.payload.name],
						);

						if (type === 'server') {
							return {
								...state,
								touchedFields,
							};
						}

						const listKeys = Array.from(
							state.keys[intent.payload.name] ??
								getDefaultListKey(formValue, intent.payload.name),
						);

						reorderItems(listKeys, intent.payload.from, intent.payload.to);

						return {
							...state,
							keys: {
								// Remove all child keys
								...updateKeys(
									state.keys,
									getName(intent.payload.name, intent.payload.from),
									updateListIndex,
								),
								// Update existing list keys
								[intent.payload.name]: listKeys,
							},
							initialValue: result.value ?? result.submittedValue,
							touchedFields,
						};
					}
				}
			}

			return state;
		},
		onUpdateValue(value, intent) {
			switch (intent.type) {
				case 'insert': {
					const list = Array.from<any>(
						getListValue(value, intent.payload.name),
					);
					insertItem(
						list,
						intent.payload.defaultValue,
						intent.payload.index ?? list.length,
					);
					return modify(value, intent.payload.name, list);
				}
				case 'remove': {
					const list = Array.from<any>(
						getListValue(value, intent.payload.name),
					);
					removeItem(list, intent.payload.index);
					return modify(value, intent.payload.name, list);
				}
				case 'reorder': {
					const list = Array.from<any>(
						getListValue(value, intent.payload.name),
					);
					reorderItems(list, intent.payload.from, intent.payload.to);
					return modify(value, intent.payload.name, list);
				}
			}
		},
	});
