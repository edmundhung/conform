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
	State extends Record<string, unknown> = {},
> = {
	updatedValue: Record<string, unknown> | null;
	submittedValue: Record<string, FormValue> | null;
	serverError: FormError<Schema, ErrorShape> | null;
	clientError: FormError<Schema, ErrorShape> | null;
	touchedFields: string[];
	keys: Record<string, string[]>;
} & State;

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
	updateState<Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape, AdditionalState>,
		ctx: {
			type: 'server' | 'client';
			result: SubmissionResult<Schema, ErrorShape, Intent>;
			reset: () => FormState<Schema, ErrorShape, AdditionalState>;
		},
	): FormState<Schema, ErrorShape, AdditionalState>;
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

export const validateIntentHandler: FormIntentHandler<{
	type: 'validate';
	payload?: string;
} | null> = {
	isApplicable(intent) {
		return (
			intent === null ||
			(intent.type === 'validate' && isOptionalString(intent.payload))
		);
	},
	updateState(state, { result }) {
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

		if (state.touchedFields.includes(name)) {
			return state;
		}

		return {
			...state,
			touchedFields: state.touchedFields.concat(name),
		};
	},
};

export const resetIntentHandler: FormIntentHandler<{ type: 'reset' }> = {
	isApplicable(intent) {
		return intent !== null && intent.type === 'reset';
	},
	updateState(_, { reset }) {
		return reset();
	},
	updateValue() {
		return null;
	},
	sideEffect(formElement) {
		formElement.reset();
	},
};

export const updateIntentHandler: FormIntentHandler<{
	type: 'update';
	payload: {
		name?: string;
		index?: number;
		value: FormValue<string>;
	};
}> = {
	isApplicable(intent) {
		return (
			intent !== null &&
			intent.type === 'update' &&
			isPlainObject(intent.payload) &&
			isOptionalString(intent.payload.name) &&
			isNonNullable(intent.payload.value) &&
			isOptionalNumber(intent.payload.index)
		);
	},
	updateState(state, { type, result }) {
		if (type === 'server') {
			return state;
		}

		return {
			...state,
			updatedValue: result.value ?? result.submittedValue,
		};
	},
	updateValue(value, intent) {
		return modify(
			value,
			getName(intent.payload.name, intent.payload.index),
			intent.payload.value,
		);
	},
	sideEffect(formElement, { intent }) {
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
	},
};

export const listIntentHandler: FormIntentHandler<
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
	  }
> = {
	isApplicable(intent) {
		if (intent) {
			switch (intent.type) {
				case 'insert':
					return (
						isPlainObject(intent.payload) &&
						isString(intent.payload.name) &&
						isOptionalNumber(intent.payload.index)
					);
				case 'remove':
					return (
						isPlainObject(intent.payload) &&
						isString(intent.payload.name) &&
						isNumber(intent.payload.index)
					);
				case 'reorder':
					return (
						isPlainObject(intent.payload) &&
						isString(intent.payload.name) &&
						isNumber(intent.payload.from) &&
						isNumber(intent.payload.to)
					);
			}
		}

		return false;
	},
	updateState(state, { type, result }) {
		const intent = result.intent;
		const formValue = state.updatedValue ?? result.submittedValue;

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
					updatedValue: result.value ?? result.submittedValue,
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
					updatedValue: result.value ?? result.submittedValue,
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
					updatedValue: result.value ?? result.submittedValue,
					touchedFields,
				};
			}
		}
	},
	updateValue(value, intent) {
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
	},
};

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

export type FormControlIntent<Control extends FormControl<any>> =
	Control extends FormControl<infer Intent, any> ? Intent : never;

export type FormControlAdditionalState<Control extends FormControl<any>> =
	Control extends FormControl<any, infer AdditionalState>
		? AdditionalState
		: never;

export type FormControl<
	Intent extends UnknownIntent,
	AdditionalState extends {} = {},
> = {
	initializeState<Schema, ErrorShape>(
		lastResult?: SubmissionResult<
			Schema,
			ErrorShape,
			UnknownIntent | null
		> | null,
	): FormState<Schema, ErrorShape, AdditionalState>;
	updateState<Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape, AdditionalState>,
		ctx: {
			type: 'server' | 'client';
			result: SubmissionResult<Schema, ErrorShape, UnknownIntent | null>;
			reset: () => FormState<Schema, ErrorShape, AdditionalState>;
		},
	): FormState<Schema, ErrorShape, AdditionalState>;
	serializeIntent(intent: UnknownIntent): string;
	deserializeIntent(value: string): UnknownIntent;
	parseIntent(intent: UnknownIntent): Intent | null;
	updateValue(
		value: Record<string, FormValue>,
		intent: Intent,
	): Record<string, FormValue> | null;
	hasSideEffect(intent: Intent): boolean;
	applySideEffect<Schema, ErrorShape>(
		formElement: HTMLFormElement,
		intent: Intent,
		state: FormState<Schema, ErrorShape, AdditionalState>,
	): void;
};

export function createFormControl<
	Intent extends UnknownIntent,
	AdditionalState extends Record<string, unknown> = {},
>(
	configure: () => FormControl<Intent, AdditionalState>,
): FormControl<Intent, AdditionalState> {
	return configure();
}

export type DefaultFormIntent =
	| {
			type: 'validate';
			payload?: string;
	  }
	| {
			type: 'update';
			payload: {
				name?: string;
				index?: number;
				value: FormValue<string>;
			};
	  }
	| {
			type: 'reset';
	  }
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

export function applyIntent(
	submission: Submission,
	options?: {
		control?: undefined;
		pendingIntents?: Array<FormControlIntent<typeof defaultFormControl>>;
	},
): [
	FormControlIntent<typeof defaultFormControl> | null,
	Record<string, FormValue> | null,
];
export function applyIntent<Intent extends UnknownIntent>(
	submission: Submission,
	options: {
		control: FormControl<Intent, any>;
		pendingIntents?: Array<Intent>;
	},
): [Intent | null, Record<string, FormValue> | null];
export function applyIntent<Intent extends UnknownIntent>(
	submission: Submission,
	options?: {
		control?: FormControl<
			Intent | FormControlIntent<typeof defaultFormControl>,
			any
		>;
		pendingIntents?: Array<
			Intent | FormControlIntent<typeof defaultFormControl>
		>;
	},
): [
	Intent | FormControlIntent<typeof defaultFormControl> | null,
	Record<string, FormValue> | null,
] {
	const { control = defaultFormControl, pendingIntents = [] } = options ?? {};

	if (!submission.intent) {
		return [null, submission.value];
	}

	const intent = control.parseIntent(
		control.deserializeIntent(submission.intent),
	);

	let value: Record<string, FormValue> | null = submission.value;

	for (const pendingIntent of pendingIntents.concat(intent ?? [])) {
		if (value === null) {
			break;
		}

		value = control.updateValue(value, pendingIntent);
	}

	return [intent, value];
}

export const defaultFormControl = createFormControl<DefaultFormIntent>(() => {
	const intentHandlers: Array<FormIntentHandler<any>> = [
		validateIntentHandler,
		resetIntentHandler,
		updateIntentHandler,
		listIntentHandler,
	];
	return {
		initializeState<Schema, ErrorShape>(
			result?: SubmissionResult<Schema, ErrorShape, DefaultFormIntent | null>,
		) {
			let state: FormState<Schema, ErrorShape> = {
				keys: {},
				updatedValue: result?.value ?? result?.submittedValue ?? null,
				submittedValue: result?.value ?? result?.submittedValue ?? null,
				serverError: result?.error ?? null,
				clientError: null,
				touchedFields: [],
			};

			if (result) {
				for (const handler of intentHandlers) {
					if (handler.isApplicable(result.intent)) {
						state = handler.updateState(state, {
							type: 'server',
							result,
							reset: () => state,
						});
					}
				}
			}

			return state;
		},
		updateState(state, { type, result, reset }) {
			if (result.value === null) {
				return reset();
			}

			let newState = updateObject(state, {
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
				updatedValue:
					type === 'client' && result.intent === null
						? result.value ?? result.submittedValue
						: state.updatedValue,
			});

			if (type === 'server') {
				return newState;
			}

			for (const handler of intentHandlers) {
				if (handler.isApplicable(result.intent)) {
					newState = handler.updateState(newState, {
						type,
						result,
						reset,
					});
				}
			}

			return updateObject(state, newState);
		},
		deserializeIntent(value) {
			return deserializeIntent(value);
		},
		serializeIntent(intent) {
			return serializeIntent(intent);
		},
		parseIntent(intent) {
			for (const handler of intentHandlers) {
				if (handler.isApplicable(intent)) {
					return intent as DefaultFormIntent;
				}
			}

			return null;
		},
		updateValue(value, intent) {
			let result: Record<string, FormValue> = value;

			for (const handler of intentHandlers) {
				if (
					typeof handler.updateValue === 'function' &&
					handler.isApplicable(intent)
				) {
					const nextValue = handler.updateValue(result, intent);

					if (nextValue === null) {
						return null;
					}

					result = nextValue;
				}
			}

			return result;
		},
		hasSideEffect(intent) {
			for (const handler of intentHandlers) {
				if (
					typeof handler.sideEffect === 'function' &&
					handler.isApplicable(intent)
				) {
					return true;
				}
			}

			return false;
		},
		applySideEffect(formElement, intent, state) {
			for (const handler of intentHandlers) {
				if (
					typeof handler.sideEffect === 'function' &&
					handler.isApplicable(intent)
				) {
					handler.sideEffect(formElement, { intent, state });
				}
			}
		},
	};
});
