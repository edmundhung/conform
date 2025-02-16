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
import { getDefaultListKey } from './metadata';
import {
	addItem,
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
	insertItem,
	reorderItems,
	removeItem,
	updateFieldValue,
	getChildPaths,
	generateKey,
	serialize,
	mutate,
} from './util';

export type DefaultValue<FormShape> = FormShape extends
	| string
	| number
	| boolean
	| Date
	| File
	| bigint
	| null
	| undefined
	? FormShape | null | undefined
	: FormShape extends Array<infer Item> | null | undefined
		? Array<DefaultValue<Item>> | null | undefined
		: FormShape extends Record<string, any> | null | undefined
			?
					| { [Key in keyof FormShape]?: DefaultValue<FormShape[Key]> }
					| null
					| undefined
			: unknown;

export type FormState<FormShape, ErrorShape> = {
	submittedValue: Record<string, unknown> | null;
	serverValidatedValue: Record<string, unknown> | null;
	serverError: FormError<FormShape, ErrorShape> | null;
	clientError: FormError<FormShape, ErrorShape> | null;
	touchedFields: string[];
	keys: Record<string, string[]>;
};

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

export type FormAction<FormShape, ErrorShape, Context> = {
	type: 'server' | 'client' | 'client-async';
	result: SubmissionResult<FormShape, ErrorShape, FormIntent>;
	ctx: Context;
};

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

export type FieldName<FieldShape> = string & {
	'~field'?: FieldShape;
};

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
		value: FormValue<string | number | boolean | null>;
	};
};

export type ListIntent =
	| {
			type: 'insert';
			payload: {
				name: FieldName<any[]>;
				index?: number;
				defaultValue?: FormValue<string | number | boolean | null>;
			};
	  }
	| {
			type: 'remove';
			payload: {
				name: FieldName<any[]>;
				index: number;
			};
	  }
	| {
			type: 'reorder';
			payload: {
				name: FieldName<any[]>;
				from: number;
				to: number;
			};
	  };

export type FormIntent =
	| ResetIntent
	| ValidateIntent
	| UpdateIntent
	| ListIntent;

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

	return mutate(state, {
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
				const fields = Array.from(result.submission.fields);

				// Sometimes we couldn't find out all the fields from the FormData, e.g. unchecked checkboxes
				// But the schema might have an error on those fields, so we need to include them
				if (result.error) {
					for (const name of Object.keys(result.error.fieldErrors)) {
						// If the error is set as a child of an actual field, exclude it
						// e.g. A multi file input field (name="files") but the error is set on the first file (i.e. files[0])
						if (
							fields.find(
								(field) =>
									field !== name && getChildPaths(field, name) !== null,
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

				if (!deepEqual(state.touchedFields, fields)) {
					touchedFields = fields;
				}
			} else {
				touchedFields = addItem(state.touchedFields, name);
			}

			return mutate(state, {
				...baseUpdate(state, action),
				// We don't want to update the submittedValue when it is a client-side validation
				// As validate happens much more frequently than other intents, this will prevent unnecessary re-renders
				submittedValue: type !== 'server' ? state.submittedValue : value,
				touchedFields,
			});
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

			// Update the keys only for client updates to avoid double updates if the validation is server-side
			if (type === 'client') {
				const listKeys = Array.from(
					state.keys[intent.payload.name] ??
						getDefaultListKey(submittedValue, intent.payload.name),
				);

				insertItem(listKeys, generateKey(), index);

				keys = {
					// Remove all child keys
					...updateKeys(
						state.keys,
						getName(intent.payload.name, index),
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

			// Update the keys only for client updates to avoid double updates if the validation is server-side
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
						getName(intent.payload.name, intent.payload.index),
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

			// Update the keys only for client updates to avoid double updates if the validation is server-side
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
						getName(intent.payload.name, intent.payload.from),
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
		} else if (intent.type === 'validate' && isOptionalString(intent.payload)) {
			return intent as ValidateIntent;
		} else if (
			intent.type === 'update' &&
			isPlainObject(intent.payload) &&
			isOptionalString(intent.payload.name) &&
			isNonNullable(intent.payload.value) &&
			isOptionalNumber(intent.payload.index)
		) {
			return intent as UpdateIntent;
		} else if (
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
	updateValue(value, intent) {
		if (intent.type === 'reset') {
			return null;
		}

		if (intent.type === 'update') {
			return modify(
				value,
				getName(intent.payload.name, intent.payload.index),
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
				const name = getName(intent.payload.name, intent.payload.index);
				const parentPaths = getPaths(name);

				for (const element of formElement.elements) {
					if (isInput(element)) {
						const paths = getChildPaths(parentPaths, element.name);

						if (paths) {
							updateFieldValue(element, {
								value: serialize(getValue(intent.payload.value, paths)),
							});

							// Update the element attribute to notify that this is changed by Conform
							element.dataset.conform = generateKey();
						}
					}
				}
			};
		}

		return null;
	},
};
