import type { FormValue, Submission } from '@conform-to/dom/future';
import {
	getPathSegments,
	isPlainObject,
	setValueAtPath,
	appendPathSegment,
	getRelativePath,
	deepEqual,
	isFieldElement,
	getValueAtPath,
	updateField,
	serialize,
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
	generateUniqueKey,
} from './util';
import type {
	FormState,
	FormIntent,
	ResetIntent,
	ValidateIntent,
	UpdateIntent,
	InsertIntent,
	RemoveIntent,
	ReorderIntent,
	FormAction,
	UnknownIntent,
} from './types';
import { getDefaultListKey } from './metadata';

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

export function serializeIntent<Intent extends UnknownIntent = UnknownIntent>(
	intent: Intent,
): string {
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

export function isResetIntent(intent: UnknownIntent): intent is ResetIntent {
	return intent.type === 'reset';
}

export function isValidateIntent(
	intent: UnknownIntent,
): intent is ValidateIntent {
	return intent.type === 'validate' && isOptional(intent.payload, isString);
}

export function isUpdateIntent(intent: UnknownIntent): intent is UpdateIntent {
	return (
		intent.type === 'update' &&
		isPlainObject(intent.payload) &&
		isOptional(intent.payload.name, isString) &&
		isNonNullable(intent.payload.value) &&
		isOptional(intent.payload.index, isNumber)
	);
}

export function isInsertIntent(intent: UnknownIntent): intent is InsertIntent {
	return (
		intent.type === 'insert' &&
		isPlainObject(intent.payload) &&
		isString(intent.payload.name) &&
		isOptional(intent.payload.index, isNumber)
	);
}

export function isRemoveIntent(intent: UnknownIntent): intent is RemoveIntent {
	return (
		intent.type === 'remove' &&
		isPlainObject(intent.payload) &&
		isString(intent.payload.name) &&
		isNumber(intent.payload.index)
	);
}

export function isReorderIntent(
	intent: UnknownIntent,
): intent is ReorderIntent {
	return (
		intent.type === 'reorder' &&
		isPlainObject(intent.payload) &&
		isString(intent.payload.name) &&
		isNumber(intent.payload.from) &&
		isNumber(intent.payload.to)
	);
}

export function parseIntent(value: string): FormIntent | undefined {
	const intent = deserializeIntent(value);

	if (
		isResetIntent(intent) ||
		isValidateIntent(intent) ||
		isUpdateIntent(intent) ||
		isInsertIntent(intent) ||
		isRemoveIntent(intent) ||
		isReorderIntent(intent)
	) {
		return intent;
	}
}

export function applyIntent(
	submission: Submission,
): [FormIntent | undefined | null, Record<string, FormValue> | null] {
	if (!submission.intent) {
		return [null, submission.value];
	}

	const intent = parseIntent(submission.intent);
	const value = intent
		? updateValue(submission.value, intent)
		: submission.value;

	return [intent, value];
}

export function updateValue(
	value: Record<string, FormValue>,
	intent: FormIntent | null | undefined,
): Record<string, FormValue> | null {
	switch (intent?.type) {
		case 'reset': {
			return null;
		}
		case 'update': {
			return modify(
				value,
				appendPathSegment(intent.payload.name, intent.payload.index),
				intent.payload.value,
			);
		}
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
}

export function initializeState<FormShape, ErrorShape>(): FormState<
	FormShape,
	ErrorShape
> {
	return {
		key: generateUniqueKey(),
		listKeys: {},
		intendedValue: null,
		serverValidatedValue: null,
		serverError: null,
		clientError: null,
		touchedFields: [],
	};
}

export function updateState<FormShape, ErrorShape>(
	state: FormState<FormShape, ErrorShape>,
	action: FormAction<
		FormShape,
		ErrorShape,
		{ reset: () => FormState<FormShape, ErrorShape> }
	>,
): FormState<FormShape, ErrorShape> {
	const { type, result, ctx } = action;
	const intent = result.intent;

	if (result.value === null) {
		return ctx.reset();
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

		if (type === 'client') {
			return merge(state, {
				intendedValue: result.value ?? state.intendedValue,
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

		return merge(state, {
			intendedValue: type === 'initialize' ? value : state.intendedValue,
			// Update server error if the error is defined.
			// There is no need to check if the error is different as we are updating other states as well
			serverError:
				typeof result.error !== 'undefined' ? result.error : state.serverError,
			// Keep track of the value that the serverError is based on
			serverValidatedValue:
				typeof result.error !== 'undefined'
					? value
					: state.serverValidatedValue,
		});
	}

	if (type !== 'server') {
		// `sumission.value` might not be correct if there are pending intents
		// This is why we use previous intendedValue if it is available
		const intendedValue = state.intendedValue ?? result.submission.value;

		if (!intent || intent.type === 'validate') {
			const name = intent?.payload ?? '';
			const basePath = getPathSegments(name);

			let touchedFields = addItem(state.touchedFields, name);

			for (const field of result.submission.fields) {
				// Add all child fields to the touched fields too
				if (getRelativePath(field, basePath) !== null) {
					touchedFields = addItem(touchedFields, field);
				}
			}

			// We couldn't find out all the fields from the FormData, e.g. unchecked checkboxes.
			// If this happens during the initialize stage, we can at least include missing
			// required fields based on the form error
			if (type === 'initialize' && name === '' && result.error) {
				for (const name of Object.keys(result.error.fieldErrors)) {
					touchedFields = addItem(touchedFields, name);
				}
			}

			return merge(state, {
				...baseUpdate(state, action),
				touchedFields,
			});
		}

		if (intent.type === 'update') {
			let keys = state.listKeys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				// TODO: Do we really need to update the keys here?
				const name = appendPathSegment(
					intent.payload.name,
					intent.payload.index,
				);
				// Remove all child keys
				keys = name === '' ? {} : updateKeys(state.listKeys, name);
			}

			const basePath = getPathSegments(intent.payload.name);
			let touchedFields = state.touchedFields;

			for (const field of result.submission.fields) {
				if (
					basePath.length === 0 ||
					getRelativePath(field, basePath) !== null
				) {
					touchedFields = addItem(touchedFields, field);
				}
			}

			return {
				...baseUpdate(state, action),
				listKeys: keys,
				touchedFields,
			};
		}

		if (intent.type === 'insert') {
			const list = getListValue(intendedValue, intent.payload.name);
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

			let keys = state.listKeys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				const listKeys = Array.from(
					state.listKeys[intent.payload.name] ??
						getDefaultListKey(state.key, intendedValue, intent.payload.name),
				);

				insertItem(listKeys, generateUniqueKey(), index);

				keys = {
					// Remove all child keys
					...updateKeys(
						state.listKeys,
						appendPathSegment(intent.payload.name, index),
						updateListIndex,
					),
					// Update existing list keys
					[intent.payload.name]: listKeys,
				};
			}

			return {
				...baseUpdate(state, action),
				listKeys: keys,
				touchedFields,
			};
		}

		if (intent.type === 'remove') {
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

			let keys = state.listKeys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				const listKeys = Array.from(
					state.listKeys[intent.payload.name] ??
						getDefaultListKey(state.key, intendedValue, intent.payload.name),
				);

				removeItem(listKeys, intent.payload.index);

				keys = {
					// Remove all child keys
					...updateKeys(
						state.listKeys,
						appendPathSegment(intent.payload.name, intent.payload.index),
						updateListIndex,
					),
					// Update existing list keys
					[intent.payload.name]: listKeys,
				};
			}

			return {
				...baseUpdate(state, action),
				listKeys: keys,
				touchedFields,
			};
		}

		if (intent.type === 'reorder') {
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

			let keys = state.listKeys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				const listKeys = Array.from(
					state.listKeys[intent.payload.name] ??
						getDefaultListKey(state.key, intendedValue, intent.payload.name),
				);

				reorderItems(listKeys, intent.payload.from, intent.payload.to);

				keys = {
					// Remove all child keys
					...updateKeys(
						state.listKeys,
						appendPathSegment(intent.payload.name, intent.payload.from),
						updateListIndex,
					),
					// Update existing list keys
					[intent.payload.name]: listKeys,
				};
			}

			return {
				...baseUpdate(state, action),
				listKeys: keys,
				touchedFields,
			};
		}
	}

	return baseUpdate(state, action);
}

export function updateFormValue(
	form: HTMLFormElement,
	intendedValue: Record<string, unknown>,
): void {
	for (const element of form.elements) {
		if (isFieldElement(element) && element.name) {
			const value = getValueAtPath(intendedValue, element.name);

			if (typeof value !== 'undefined') {
				updateField(element, {
					value: serialize(value),
				});

				element.dataset.conform = generateUniqueKey();
			}
		}
	}
}
