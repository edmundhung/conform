import type { FormError, FormValue, Submission } from 'conform-dom';
import {
	isInput,
	formatPaths,
	getPaths,
	getValue,
	isPlainObject,
	setValue,
	updateField,
} from 'conform-dom';
import { getDefaultValue, defaultSerialize } from './metadata';
import {
	addItems,
	configureListIndexUpdate,
	formatName,
	getList,
	isNonNullable,
	isNumber,
	isOptionalNumber,
	isOptionalString,
	isString,
	mapItems,
	deepEqual,
	flatten,
	isPrefix,
	mapKeys,
	mergeObjects,
	updateObject,
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
	defaultValue: DefaultValue<Schema> | null;
	serverError: FormError<Schema, ErrorShape> | null;
	clientError: FormError<Schema, ErrorShape> | null;
	initialValue: Record<string, FormValue>;
	submittedValue: Record<string, FormValue> | null;
	touchedFields: string[];
	keys: Record<string, string>;
} & State;

export function generateKey(): string {
	return Math.floor(Date.now() * Math.random()).toString(36);
}

export function initializeElement(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	config: {
		initialValue: Record<string, unknown>;
		isResetting?: boolean;
	},
): void {
	// Skip elements that are already initialized
	if (!config.isResetting && element.dataset.conform) {
		return;
	}

	const defaultValue = getDefaultValue(config.initialValue, element.name);

	updateField(element, {
		defaultValue,
		value: !config.isResetting ? defaultValue : undefined,
	});

	element.dataset.conform = generateKey();
}

export function getKeys(
	defaultValue: unknown,
	prevkeys: Record<string, string> = {},
	prefix: string = '',
): Record<string, string> {
	const arrayByName = flatten(
		defaultValue,
		(value) => (Array.isArray(value) ? value : null),
		prefix,
	);
	const result = Object.entries(arrayByName).reduce<Record<string, string>>(
		(result, [name, array]) => {
			const paths = getPaths(name);

			for (let i = 0; i < array.length; i++) {
				result[formatPaths(paths.concat(i))] = generateKey();
			}

			return result;
		},
		prefix
			? mapKeys(prevkeys, (key) => (!isPrefix(key, prefix) ? key : null))
			: prevkeys,
	);

	return result;
}

export function modify<Data>(
	data: Record<string, Data>,
	name: string,
	value: Data | Record<string, Data>,
	overwrite = true,
): Record<string, Data> {
	if (name === '') {
		if (!isPlainObject(value)) {
			throw new Error('The value must be an object');
		}

		return mergeObjects(data, value, overwrite);
	}

	const paths = getPaths(name);
	const prevValue = getValue(data, paths);
	const nextValue =
		isPlainObject(prevValue) && isPlainObject(value)
			? mergeObjects(prevValue, value, overwrite)
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
			result: Submission<Intent, Schema, ErrorShape>;
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

function getFields(submission: Submission<UnknownIntent | null>): string[] {
	const fields = submission.fields;

	// Sometimes we couldn't find out all the fields from the FormData, e.g. unchecked checkboxes
	// But the schema might have an error on those fields, so we need to include them
	if (submission.error) {
		for (const name of Object.keys(submission.error.fieldError)) {
			// If the error is set as a child of an actual field, exclude it
			// e.g. A multi file input field (name="files") but the error is set on the first file (i.e. files[0])
			if (fields.find((field) => name !== field && isPrefix(name, field))) {
				continue;
			}

			// If the name is not a child of any fields, this could be an unchecked checkbox or an empty multi select
			if (fields.every((field) => !isPrefix(field, name))) {
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
			intent !== null &&
			intent.type === 'validate' &&
			isOptionalString(intent.payload)
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
		return intent === null || intent.type === 'reset';
	},
	updateState(_, { reset }) {
		return reset();
	},
	updateValue() {
		return null;
	},
	sideEffect(formElement) {
		// for (const element of formElement.elements) {
		//     if (isInput(element)) {
		//         initializeElement(element, {
		//             initialValue: state.initialValue,
		//             isResetting: true,
		//         });
		//     }
		// }
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

		const intent = result.intent;
		const initialValue = modify(
			state.initialValue,
			formatName(intent.payload.name, intent.payload.index),
			intent.payload.value,
			false,
		);

		if (state.initialValue === initialValue) {
			return state;
		}

		return {
			...state,
			initialValue,
		};
	},
	updateValue(value, intent) {
		return modify(
			value,
			formatName(intent.payload.name, intent.payload.index),
			intent.payload.value,
		);
	},
	sideEffect(formElement, { intent }) {
		const flattenedValue = flatten(
			intent.payload.value,
			(value) => value,
			formatName(intent.payload.name, intent.payload.index),
		);

		for (const element of formElement.elements) {
			if (isInput(element)) {
				updateField(element, {
					value: defaultSerialize(flattenedValue[element.name]),
				});

				// Update the element attribute to notify that this is changed by Conform
				element.dataset.conform = generateKey();
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

		switch (intent.type) {
			case 'insert': {
				const list = getList(state.initialValue, intent.payload.name);
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

				list.splice(index, 0, intent.payload.defaultValue);

				const itemName = formatName(intent.payload.name, index);

				return {
					...state,
					keys: {
						...getKeys(
							intent.payload.defaultValue,
							mapKeys(state.keys, updateListIndex),
							itemName,
						),
						[itemName]: generateKey(),
					},
					initialValue: modify(
						state.initialValue,
						intent.payload.name,
						list,
						false,
					),
					touchedFields,
				};
			}
			case 'remove': {
				const list = getList(state.initialValue, intent.payload.name);
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

				list.splice(intent.payload.index, 1);

				return {
					...state,
					keys: mapKeys(state.keys, updateListIndex),
					initialValue: modify(
						state.initialValue,
						intent.payload.name,
						list,
						false,
					),
					touchedFields,
				};
			}
			case 'reorder': {
				const list = getList(state.initialValue, intent.payload.name);
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

				list.splice(
					intent.payload.to,
					0,
					...list.splice(intent.payload.from, 1),
				);

				return {
					...state,
					keys: mapKeys(state.keys, updateListIndex),
					initialValue: modify(
						state.initialValue,
						intent.payload.name,
						list,
						false,
					),
					touchedFields,
				};
			}
		}
	},
	updateValue(value, intent) {
		switch (intent.type) {
			case 'insert': {
				const list = getList(value, intent.payload.name);
				list.splice(
					intent.payload.index ?? list.length,
					0,
					intent.payload.defaultValue,
				);

				return modify(value, intent.payload.name, list);
			}
			case 'remove': {
				const list = getList(value, intent.payload.name);
				list.splice(intent.payload.index, 1);
				return modify(value, intent.payload.name, list);
			}
			case 'reorder': {
				const list = getList(value, intent.payload.name);
				list.splice(
					intent.payload.to,
					0,
					...list.splice(intent.payload.from, 1),
				);
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
	initializeState<Schema, ErrorShape>(options: {
		result?: Submission<UnknownIntent | null, Schema, ErrorShape> | null;
		defaultValue?: DefaultValue<Schema>;
	}): FormState<Schema, ErrorShape, AdditionalState>;
	updateState<Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape, AdditionalState>,
		ctx: {
			type: 'server' | 'client';
			result: Submission<UnknownIntent | null, Schema, ErrorShape>;
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

export function applyIntent<Schema, ErrorShape>(
	submission:
		| Submission<string | null>
		| Submission<string | null, Schema, ErrorShape>,
	options?: {
		control?: undefined;
		pendingIntents?: Array<FormControlIntent<typeof defaultFormControl>>;
	},
): Submission<
	FormControlIntent<typeof defaultFormControl> | null,
	Schema,
	ErrorShape
>;
export function applyIntent<Intent extends UnknownIntent, Schema, ErrorShape>(
	submission:
		| Submission<string | null>
		| Submission<string | null, Schema, ErrorShape>,
	options: {
		control: FormControl<Intent, any>;
		pendingIntents?: Array<Intent>;
	},
): Submission<Intent | null, Schema, ErrorShape>;
export function applyIntent<Intent extends UnknownIntent, Schema, ErrorShape>(
	submission:
		| Submission<string | null>
		| Submission<string | null, Schema, ErrorShape>,
	options?: {
		control?: FormControl<
			Intent | FormControlIntent<typeof defaultFormControl>,
			any
		>;
		pendingIntents?: Array<
			Intent | FormControlIntent<typeof defaultFormControl>
		>;
	},
): Submission<
	Intent | FormControlIntent<typeof defaultFormControl> | null,
	Schema,
	ErrorShape
> {
	const { control = defaultFormControl, pendingIntents = [] } = options ?? {};

	const unknownIntent = submission.intent
		? control.deserializeIntent(submission.intent)
		: null;
	const intent = unknownIntent ? control.parseIntent(unknownIntent) : null;

	let value: Record<string, FormValue> | null = submission.value;

	for (const pendingIntent of pendingIntents.concat(intent ?? [])) {
		if (value === null) {
			break;
		}

		value = control.updateValue(value, pendingIntent);
	}

	return {
		...submission,
		error: undefined,
		value,
		intent,
	};
}

export const defaultFormControl = createFormControl<DefaultFormIntent>(() => {
	const intentHandlers: Array<FormIntentHandler<any>> = [
		validateIntentHandler,
		resetIntentHandler,
		updateIntentHandler,
		listIntentHandler,
	];
	return {
		initializeState<Schema, ErrorShape>({
			defaultValue,
			result,
		}: {
			defaultValue?: DefaultValue<Schema>;
			result?: Submission<DefaultFormIntent | null, Schema, ErrorShape>;
		}) {
			const initialValue = result?.value ?? defaultValue ?? {};

			let state: FormState<Schema, ErrorShape> = {
				keys: getKeys(initialValue),
				defaultValue: defaultValue ?? null,
				initialValue: initialValue,
				submittedValue: result?.value ?? null,
				serverError: result?.error ?? null,
				clientError: null,
				touchedFields: [],
			};

			if (!result) {
				return state;
			}

			for (const handler of intentHandlers) {
				if (handler.isApplicable(result.intent)) {
					state = handler.updateState(state, {
						type: 'server',
						result,
						reset: () => state,
					});
				}
			}

			return state;
		},
		updateState(state, { type, result, reset }) {
			let newState = updateObject(state, {
				clientError:
					type === 'client' &&
					typeof result.error !== 'undefined' &&
					!deepEqual(state.clientError, result.error)
						? result.error
						: state.clientError,
				serverError:
					type === 'client' &&
					typeof result.error !== 'undefined' &&
					!deepEqual(state.submittedValue, result.value)
						? null
						: type === 'server' &&
							  typeof result.error !== 'undefined' &&
							  !deepEqual(state.serverError, result.error)
							? result.error
							: state.serverError,
				submittedValue: type === 'server' ? result.value : state.submittedValue,
			});

			if (type === 'server' || !result.intent) {
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
