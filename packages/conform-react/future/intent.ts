import type { FormValue, Submission } from '@conform-to/dom/future';
import {
	getPathSegments,
	isPlainObject,
	appendPathSegment,
	getRelativePath,
} from '@conform-to/dom/future';
import {
	createPathIndexUpdater,
	getArrayAtPath,
	generateUniqueKey,
	isUndefined,
	isOptional,
	isNumber,
	isString,
	appendUniqueItem,
	compactMap,
	merge,
	updateValueAtPath,
	transformKeys,
	isNullable,
} from './util';
import type { ActionHandler, IntentDispatcher, UnknownIntent } from './types';
import { getDefaultListKey, initializeState } from './state';

/**
 * Serializes intent to string format: "type" or "type(payload)".
 */
export function serializeIntent<Intent extends UnknownIntent = UnknownIntent>(
	intent: Intent,
): string {
	if (!intent.payload) {
		return intent.type;
	}

	return `${intent.type}(${JSON.stringify(intent.payload)})`;
}

/**
 * Parses serialized intent string back to intent object.
 */
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

/**
 * Applies intent transformation to submission payload.
 * Returns modified payload or null for reset intent.
 */
export function applyIntent(
	submission: Submission,
	options?: {
		handlers?: Record<string, ActionHandler>;
	},
): Record<string, FormValue> | null {
	if (!submission.intent) {
		return submission.payload;
	}

	const intent = deserializeIntent(submission.intent);
	const handlers: Record<string, ActionHandler> =
		options?.handlers ?? actionHandlers;
	const handler = handlers[intent.type];

	if (
		handler &&
		handler.onApply &&
		(handler.validatePayload?.(intent.payload) ?? true)
	) {
		return handler.onApply(submission.payload, intent.payload);
	}

	return submission.payload;
}

export function insertItem<Item>(
	list: Array<Item>,
	item: Item,
	index: number,
): void {
	list.splice(index, 0, item);
}

export function removeItem(list: Array<unknown>, index: number): void {
	list.splice(index, 1);
}

export function reorderItems(
	list: Array<unknown>,
	fromIndex: number,
	toIndex: number,
): void {
	list.splice(toIndex, 0, ...list.splice(fromIndex, 1));
}

/**
 * Updates list keys by removing child keys and optionally transforming remaining keys.
 */
export function updateListKeys(
	keys: Record<string, string[]> = {},
	keyToBeRemoved: string,
	updateKey?: (key: string) => string | null,
): Record<string, string[]> {
	const basePath = getPathSegments(keyToBeRemoved);
	return transformKeys(keys, (field) =>
		getRelativePath(field, basePath) !== null
			? null
			: updateKey?.(field) ?? field,
	);
}

/**
 * Built-in action handlers for form intents:
 * - reset: clears form data
 * - validate: marks fields as touched for validation display
 * - update: updates specific field values
 * - insert/remove/reorder: manages array field operations
 */
export const actionHandlers: {
	[Type in keyof IntentDispatcher]: IntentDispatcher[Type] extends (
		payload: any,
	) => void
		? ActionHandler<IntentDispatcher[Type]>
		: never;
} = {
	reset: {
		validatePayload(options) {
			return (
				isOptional(options, isPlainObject) &&
				(isUndefined(options?.defaultValue) ||
					isNullable(options?.defaultValue, isPlainObject))
			);
		},
		onApply(_, options) {
			const { defaultValue } = options ?? {};

			return defaultValue ?? (defaultValue === null ? {} : null);
		},
		onUpdate(_, { intent }) {
			const defaultValue = intent.payload?.defaultValue;

			return merge(initializeState(), {
				serverIntendedValue:
					defaultValue ?? (defaultValue === null ? {} : null),
			});
		},
	},
	validate: {
		validatePayload(name) {
			return isOptional(name, isString);
		},
		onUpdate(state, { submission, intent, error }) {
			const name = intent.payload ?? '';
			const basePath = getPathSegments(name);
			const allFields = error
				? // Consider fields / fieldset with errors as touched too
					submission.fields.concat(Object.keys(error.fieldErrors))
				: submission.fields;

			let touchedFields = appendUniqueItem(state.touchedFields, name);

			for (const field of allFields) {
				// Add all child fields to the touched fields too
				if (getRelativePath(field, basePath) !== null) {
					touchedFields = appendUniqueItem(touchedFields, field);
				}
			}

			return merge(state, {
				touchedFields,
			});
		},
	},
	update: {
		validatePayload(options) {
			return (
				isPlainObject(options) &&
				isOptional(options.name, isString) &&
				isOptional(options.index, isNumber) &&
				!isUndefined(options.value)
			);
		},
		onApply(value, options) {
			const name = appendPathSegment(options.name, options.index);
			const newValue = options.value ?? (name === '' ? {} : null);
			return updateValueAtPath(value, name, newValue as any);
		},
		onUpdate(state, { type, submission, intent }) {
			if (type === 'server') {
				return state;
			}

			let listKeys = state.listKeys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				// TODO: Do we really need to update the keys here?
				const name = appendPathSegment(
					intent.payload.name,
					intent.payload.index,
				);
				// Remove all child keys
				listKeys = name === '' ? {} : updateListKeys(state.listKeys, name);
			}

			const basePath = getPathSegments(intent.payload.name);
			let touchedFields = state.touchedFields;

			for (const field of submission.fields) {
				if (
					basePath.length === 0 ||
					getRelativePath(field, basePath) !== null
				) {
					touchedFields = appendUniqueItem(touchedFields, field);
				}
			}

			return {
				...state,
				listKeys,
				touchedFields,
			};
		},
	},
	insert: {
		validatePayload(options) {
			return (
				isPlainObject(options) &&
				isString(options.name) &&
				isOptional(options.index, isNumber)
			);
		},
		onApply(value, options) {
			const list = Array.from(getArrayAtPath(value, options.name));
			insertItem(list, options.defaultValue, options.index ?? list.length);
			return updateValueAtPath(value, options.name, list);
		},
		onUpdate(state, { type, submission, intent }) {
			if (type === 'server') {
				return state;
			}

			const currentValue = submission.payload;
			const list = getArrayAtPath(currentValue, intent.payload.name);
			const index = intent.payload.index ?? list.length;
			const updateListIndex = createPathIndexUpdater(
				intent.payload.name,
				(currentIndex) =>
					index <= currentIndex ? currentIndex + 1 : currentIndex,
			);
			const touchedFields = appendUniqueItem(
				compactMap(state.touchedFields, updateListIndex),
				intent.payload.name,
			);

			let keys = state.listKeys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				const listKeys = Array.from(
					state.listKeys[intent.payload.name] ??
						getDefaultListKey(
							state.resetKey,
							currentValue,
							intent.payload.name,
						),
				);

				insertItem(listKeys, generateUniqueKey(), index);

				keys = {
					// Remove all child keys
					...updateListKeys(
						state.listKeys,
						appendPathSegment(intent.payload.name, index),
						updateListIndex,
					),
					// Update existing list keys
					[intent.payload.name]: listKeys,
				};
			}

			return {
				...state,
				listKeys: keys,
				touchedFields,
			};
		},
	},
	remove: {
		validatePayload(options) {
			return (
				isPlainObject(options) &&
				isString(options.name) &&
				isNumber(options.index)
			);
		},
		onApply(value, options) {
			const list = Array.from(getArrayAtPath(value, options.name));
			removeItem(list, options.index);
			return updateValueAtPath(value, options.name, list);
		},
		onUpdate(state, { type, submission, intent }) {
			if (type === 'server') {
				return state;
			}

			const currentValue = submission.payload;
			const updateListIndex = createPathIndexUpdater(
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
			const touchedFields = appendUniqueItem(
				compactMap(state.touchedFields, updateListIndex),
				intent.payload.name,
			);

			let keys = state.listKeys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				const listKeys = Array.from(
					state.listKeys[intent.payload.name] ??
						getDefaultListKey(
							state.resetKey,
							currentValue,
							intent.payload.name,
						),
				);

				removeItem(listKeys, intent.payload.index);

				keys = {
					// Remove all child keys
					...updateListKeys(
						state.listKeys,
						appendPathSegment(intent.payload.name, intent.payload.index),
						updateListIndex,
					),
					// Update existing list keys
					[intent.payload.name]: listKeys,
				};
			}

			return {
				...state,
				listKeys: keys,
				touchedFields,
			};
		},
	},
	reorder: {
		validatePayload(options) {
			return (
				isPlainObject(options) &&
				isString(options.name) &&
				isNumber(options.from) &&
				isNumber(options.to)
			);
		},
		onApply(value, options) {
			const list = Array.from(getArrayAtPath(value, options.name));
			reorderItems(list, options.from, options.to);
			return updateValueAtPath(value, options.name, list);
		},
		onUpdate(state, { type, submission, intent }) {
			if (type === 'server') {
				return state;
			}

			const currentValue = submission.payload;
			const updateListIndex = createPathIndexUpdater(
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
			const touchedFields = appendUniqueItem(
				compactMap(state.touchedFields, updateListIndex),
				intent.payload.name,
			);

			let keys = state.listKeys;

			// Update the keys only for client updates to avoid double updates if there is no client validation
			if (type === 'client') {
				const listKeys = Array.from(
					state.listKeys[intent.payload.name] ??
						getDefaultListKey(
							state.resetKey,
							currentValue,
							intent.payload.name,
						),
				);

				reorderItems(listKeys, intent.payload.from, intent.payload.to);

				keys = {
					// Remove all child keys
					...updateListKeys(
						state.listKeys,
						appendPathSegment(intent.payload.name, intent.payload.from),
						updateListIndex,
					),
					// Update existing list keys
					[intent.payload.name]: listKeys,
				};
			}

			return {
				...state,
				listKeys: keys,
				touchedFields,
			};
		},
	},
};
