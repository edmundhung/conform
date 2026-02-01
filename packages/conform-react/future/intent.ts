import type {
	FormValue,
	Submission,
	SubmissionResult,
} from '@conform-to/dom/future';
import {
	getPathSegments,
	getValueAtPath,
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
import type { IntentHandler, IntentDispatcher, UnknownIntent } from './types';
import { getDefaultListKey } from './state';

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
export function resolveIntent(
	submission: Submission,
	options?: {
		handlers?: Record<string, IntentHandler>;
	},
): Record<string, FormValue> | undefined {
	if (!submission.intent) {
		return submission.payload;
	}

	const intent = deserializeIntent(submission.intent);
	const handlers: Record<string, IntentHandler> =
		options?.handlers ?? intentHandlers;
	const handler = handlers[intent.type];

	if (handler?.resolve && (handler.validate?.(intent.payload) ?? true)) {
		return handler.resolve(submission.payload, intent.payload);
	}

	return submission.payload;
}

/**
 * Resolves an intent after validation by calling the handler's onResolve.
 * Mutates the result with updated value/error and returns whether the intent was cancelled.
 */
export function applyIntent<ErrorShape>(
	result: SubmissionResult<ErrorShape>,
	intent: UnknownIntent | null,
	options?: {
		handlers?: Record<string, IntentHandler>;
	},
): SubmissionResult<ErrorShape> {
	if (intent) {
		const handlers: Record<string, IntentHandler> =
			options?.handlers ?? intentHandlers;
		const handler = handlers[intent.type];

		if (handler?.apply && (handler.validate?.(intent.payload) ?? true)) {
			return handler.apply(result, intent.payload);
		}
	}

	return result;
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
export const intentHandlers: {
	[Type in keyof IntentDispatcher]: IntentDispatcher[Type] extends (
		payload: any,
	) => void
		? IntentHandler<IntentDispatcher[Type]>
		: never;
} = {
	reset: {
		validate(options) {
			return (
				isOptional(options, isPlainObject) &&
				(isUndefined(options?.defaultValue) ||
					isNullable(options?.defaultValue, isPlainObject))
			);
		},
		resolve(_, options) {
			if (options?.defaultValue === null) {
				return {};
			}

			return options?.defaultValue;
		},
		apply(result) {
			return {
				...result,
				reset: true,
			};
		},
	},
	validate: {
		validate(name) {
			return isOptional(name, isString);
		},
		update(state, { submission, intent, error }) {
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
		validate(options) {
			return (
				isPlainObject(options) &&
				isOptional(options.name, isString) &&
				isOptional(options.index, isNumber) &&
				!isUndefined(options.value)
			);
		},
		resolve(value, options) {
			const name = appendPathSegment(options.name, options.index);
			return updateValueAtPath(
				value,
				name,
				options.value ?? (name === '' ? {} : null),
			) as Record<string, FormValue>;
		},
		update(state, { type, submission, intent }) {
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
		validate(options) {
			return (
				isPlainObject(options) &&
				isString(options.name) &&
				isOptional(options.index, isNumber) &&
				isOptional(options.from, isString) &&
				isOptional(options.onInvalid, (mode) => mode === 'revert')
			);
		},
		resolve(value, options) {
			let result = value;
			let itemValue = options.defaultValue;

			if (options.from !== undefined) {
				itemValue = getValueAtPath(result, options.from);
				result = updateValueAtPath(result, options.from, '');
			}

			const list = Array.from(getArrayAtPath(result, options.name));
			insertItem(list, itemValue, options.index ?? list.length);
			return updateValueAtPath(result, options.name, list);
		},
		apply(result, options) {
			// Warn if validation result is not yet available
			if (
				typeof result.error === 'undefined' &&
				(options.onInvalid || options.from)
			) {
				// eslint-disable-next-line no-console
				console.warn(
					'intent.insert() with `onInvalid` or `from` requires the validation result to be available synchronously. ' +
						'These options are ignored because the error is not yet known.',
				);
				return result;
			}

			const arrayErrors = result.error?.fieldErrors[options.name];

			if (options.onInvalid === 'revert' && arrayErrors?.length) {
				return {
					...result,
					targetValue: undefined,
				};
			}

			if (options.from !== undefined) {
				const index =
					options.index ??
					getArrayAtPath(result.submission.payload, options.name).length;
				const insertedItemPath = appendPathSegment(options.name, index);
				const insertedItemErrors = result.error?.fieldErrors[insertedItemPath];

				if (insertedItemErrors?.length) {
					const fromErrors = result.error?.fieldErrors[options.from] ?? [];

					return {
						...result,
						targetValue: undefined,
						error: {
							formErrors: result.error?.formErrors ?? [],
							fieldErrors: {
								...result.error?.fieldErrors,
								[options.from]: [...fromErrors, ...insertedItemErrors],
								[insertedItemPath]: [],
							},
						},
					};
				}
			}

			return result;
		},
		update(state, { type, submission, intent, ctx }) {
			if (type === 'server') {
				return state;
			}

			const from = intent.payload.from;
			const index =
				intent.payload.index ??
				getArrayAtPath(submission.payload, intent.payload.name).length;
			const updateListIndex = createPathIndexUpdater(
				intent.payload.name,
				(currentIndex) =>
					index <= currentIndex ? currentIndex + 1 : currentIndex,
			);

			let touchedFields = state.touchedFields;
			let listKeys = state.listKeys;

			if (!ctx.cancelled) {
				touchedFields = compactMap(state.touchedFields, updateListIndex);

				// Update the keys only for client updates to avoid double updates if there is no client validation
				if (type === 'client') {
					const selectedListKeys = Array.from(
						state.listKeys[intent.payload.name] ??
							getDefaultListKey(
								state.resetKey,
								submission.payload,
								intent.payload.name,
							),
					);

					insertItem(selectedListKeys, generateUniqueKey(), index);

					listKeys = {
						// Remove all child keys
						...updateListKeys(
							state.listKeys,
							appendPathSegment(intent.payload.name, index),
							updateListIndex,
						),
						// Update existing list keys
						[intent.payload.name]: selectedListKeys,
					};
				}
			}

			touchedFields = appendUniqueItem(touchedFields, intent.payload.name);

			if (from !== undefined) {
				touchedFields = appendUniqueItem(touchedFields, from);
			}

			return {
				...state,
				listKeys,
				touchedFields,
			};
		},
	},
	remove: {
		validate(options) {
			return (
				isPlainObject(options) &&
				isString(options.name) &&
				isNumber(options.index) &&
				isOptional(options.onInvalid, (v) => v === 'revert' || v === 'insert')
			);
		},
		resolve(value, options) {
			const list = Array.from(getArrayAtPath(value, options.name));
			removeItem(list, options.index);
			return updateValueAtPath(value, options.name, list);
		},
		apply(result, options) {
			// Warn if validation result is not yet available
			if (typeof result.error === 'undefined' && options.onInvalid) {
				if (process.env.NODE_ENV !== 'production') {
					// eslint-disable-next-line no-console
					console.warn(
						'intent.remove() with `onInvalid` requires the validation result to be available synchronously. ' +
							'This option is ignored because the error is not yet known.',
					);
				}
				return result;
			}

			if (result.targetValue && result.error?.fieldErrors[options.name]) {
				switch (options.onInvalid) {
					case 'revert':
						return {
							...result,
							targetValue: undefined,
						};
					case 'insert': {
						const list = Array.from(
							getArrayAtPath(result.targetValue, options.name),
						);
						insertItem(list, options.defaultValue, list.length);
						return {
							...result,
							targetValue: updateValueAtPath(
								result.targetValue,
								options.name,
								list,
							),
						};
					}
				}
			}

			return result;
		},
		update(state, { type, submission, intent, ctx }) {
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

			let touchedFields = state.touchedFields;
			let listKeys = state.listKeys;

			// If onInvalid is 'insert', we still remove the item and then insert a new item at the end
			if (!ctx.cancelled || intent.payload.onInvalid === 'insert') {
				touchedFields = compactMap(touchedFields, updateListIndex);

				// Update the keys only for client updates to avoid double updates if there is no client validation
				if (type === 'client') {
					const selectedListKeys = Array.from(
						state.listKeys[intent.payload.name] ??
							getDefaultListKey(
								state.resetKey,
								currentValue,
								intent.payload.name,
							),
					);

					removeItem(selectedListKeys, intent.payload.index);

					listKeys = {
						// Remove all child keys
						...updateListKeys(
							state.listKeys,
							appendPathSegment(intent.payload.name, intent.payload.index),
							updateListIndex,
						),
						// Update existing list keys
						[intent.payload.name]: selectedListKeys,
					};

					if (ctx.cancelled) {
						const index = selectedListKeys.length;

						insertItem(selectedListKeys, generateUniqueKey(), index);

						listKeys = {
							// Remove all child keys
							...updateListKeys(
								state.listKeys,
								appendPathSegment(intent.payload.name, index),
								updateListIndex,
							),
							// Update existing list keys
							[intent.payload.name]: selectedListKeys,
						};
					}
				}
			}

			touchedFields = appendUniqueItem(touchedFields, intent.payload.name);

			return {
				...state,
				listKeys: listKeys,
				touchedFields,
			};
		},
	},
	reorder: {
		validate(options) {
			return (
				isPlainObject(options) &&
				isString(options.name) &&
				isNumber(options.from) &&
				isNumber(options.to)
			);
		},
		resolve(value, options) {
			const list = Array.from(getArrayAtPath(value, options.name));
			reorderItems(list, options.from, options.to);
			return updateValueAtPath(value, options.name, list);
		},
		update(state, { type, submission, intent }) {
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
