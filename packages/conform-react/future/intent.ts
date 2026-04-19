import type {
	FormValue,
	Submission,
	SubmissionResult,
} from '@conform-to/dom/future';
import {
	parsePath,
	getPathValue,
	isPlainObject,
	appendPath,
	getRelativePath,
} from '@conform-to/dom/future';
import {
	createPathIndexUpdater,
	getPathArray,
	generateUniqueKey,
	isUndefined,
	isOptional,
	isNumber,
	isString,
	appendUniqueItem,
	compactMap,
	merge,
	updatePathValue,
	transformKeys,
	isNullable,
} from './util';
import type {
	EmptyIntent,
	FormAction,
	FormState,
	IntentHandler,
	NormalizeIntentType,
	TypedIntentDefinition,
	UnknownIntent,
	ResetIntent,
	SubmitIntent,
	ValidateIntent,
	UpdateIntent,
	InsertIntent,
	RemoveIntent,
	ReorderIntent,
	DefaultIntentHandlers,
} from './types';
import { getDefaultListKey } from './state';

export function defineIntent<
	Definition extends TypedIntentDefinition = EmptyIntent,
>(definition?: IntentHandler<Definition>): IntentHandler<Definition>;
export function defineIntent<Payload>(
	definition: IntentHandler<(payload: Payload) => void>,
): IntentHandler<(payload: Payload) => void>;
export function defineIntent<Definition = EmptyIntent>(
	definition: IntentHandler<NormalizeIntentType<Definition>> = {},
): IntentHandler<NormalizeIntentType<Definition>> {
	return definition;
}

/**
 * Serializes intent to string format: "type" or "type(payload)".
 */
export function serializeIntent<Intent extends UnknownIntent = UnknownIntent>(
	intent: Intent,
): string {
	if (typeof intent.payload === 'undefined') {
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

export function normalizeIntent(
	value: string | null,
	options?: {
		handlers?: Record<string, IntentHandler>;
	},
): UnknownIntent {
	if (!value) {
		return { type: 'submit' };
	}

	const intent = deserializeIntent(value);
	const handlers: Record<string, IntentHandler> =
		options?.handlers ?? defaultIntentHandlers;
	const handler = handlers[intent.type];

	if (
		handler &&
		!Object.keys(handlers).includes(intent.type) &&
		!(handler.validate?.(intent.payload) ?? true)
	) {
		return { type: 'submit' };
	}

	return intent;
}

/**
 * Applies intent transformation to submission payload.
 * Returns modified payload or null for reset intent.
 */
export function resolveIntent(
	submission: Submission,
	options?: {
		handlers?: Record<string, IntentHandler>;
		intent?: UnknownIntent | null;
	},
): Record<string, FormValue> | undefined {
	const intent =
		options?.intent ??
		(submission.intent ? deserializeIntent(submission.intent) : null);

	if (!intent) {
		return submission.payload;
	}

	const handlers: Record<string, IntentHandler> =
		options?.handlers ?? defaultIntentHandlers;
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
			options?.handlers ?? defaultIntentHandlers;
		const handler = handlers[intent.type];

		if (handler?.apply && (handler.validate?.(intent.payload) ?? true)) {
			return handler.apply(result, intent.payload);
		}
	}

	return result;
}

function touchValidatedFields<ErrorShape>(
	state: FormState<ErrorShape>,
	action: FormAction<
		ErrorShape,
		{
			type: string;
			payload: unknown;
		},
		{
			reset: (
				defaultValue?: Record<string, unknown> | null,
			) => FormState<ErrorShape>;
			cancelled?: boolean;
		}
	>,
	name = '',
) {
	const basePath = parsePath(name);
	const allFields = action.error
		? action.submission.fields.concat(Object.keys(action.error.fieldErrors))
		: action.submission.fields;

	let touchedFields = appendUniqueItem(state.touchedFields, name);

	for (const field of allFields) {
		if (getRelativePath(field, basePath) !== null) {
			touchedFields = appendUniqueItem(touchedFields, field);
		}
	}

	return merge(state, {
		touchedFields,
	});
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
	const basePath = parsePath(keyToBeRemoved);
	return transformKeys(keys, (field) =>
		getRelativePath(field, basePath) !== null
			? null
			: updateKey?.(field) ?? field,
	);
}

export const submit = defineIntent<SubmitIntent>({
	update(state, action) {
		return touchValidatedFields(state, action);
	},
});

export const reset = defineIntent<ResetIntent>({
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
});

export const validate = defineIntent<ValidateIntent>({
	validate(name) {
		return isOptional(name, isString);
	},
	update(state, action) {
		return touchValidatedFields(state, action, action.intent.payload ?? '');
	},
});

export const update = defineIntent<UpdateIntent>({
	validate(options) {
		return (
			isPlainObject(options) &&
			isOptional(options.name, isString) &&
			isOptional(options.index, isNumber) &&
			!isUndefined(options.value)
		);
	},
	resolve(value, options) {
		const name = appendPath(options.name, options.index);
		return updatePathValue(
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
			const name = appendPath(intent.payload.name, intent.payload.index);
			// Remove all child keys
			listKeys = name === '' ? {} : updateListKeys(state.listKeys, name);
		}

		const basePath = parsePath(intent.payload.name);
		let touchedFields = state.touchedFields;

		for (const field of submission.fields) {
			if (basePath.length === 0 || getRelativePath(field, basePath) !== null) {
				touchedFields = appendUniqueItem(touchedFields, field);
			}
		}

		return {
			...state,
			listKeys,
			touchedFields,
		};
	},
});

export const insert = defineIntent<InsertIntent>({
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
			itemValue = getPathValue(result, options.from);
			result = updatePathValue(result, options.from, '');
		}

		const list = Array.from(getPathArray(result, options.name));
		insertItem(list, itemValue, options.index ?? list.length);
		return updatePathValue(result, options.name, list);
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

		const listError = result.error?.fieldErrors[options.name];

		if (options.onInvalid === 'revert' && listError != null) {
			return {
				...result,
				targetValue: undefined,
			};
		}

		if (options.from !== undefined) {
			const index =
				options.index ??
				getPathArray(result.submission.payload, options.name).length;
			const insertedItemPath = appendPath(options.name, index);
			const insertedItemError = result.error?.fieldErrors[insertedItemPath];
			const fromFieldError = result.error?.fieldErrors[options.from];

			if (fromFieldError != null) {
				return {
					...result,
					targetValue: undefined,
					error: {
						formErrors: result.error?.formErrors ?? null,
						fieldErrors: {
							...result.error?.fieldErrors,
							[insertedItemPath]: null,
						},
					},
				};
			}

			if (insertedItemError != null) {
				return {
					...result,
					targetValue: undefined,
					error: {
						formErrors: result.error?.formErrors ?? null,
						fieldErrors: {
							...result.error?.fieldErrors,
							[options.from]: insertedItemError,
							[insertedItemPath]: null,
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
			getPathArray(submission.payload, intent.payload.name).length;
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
						appendPath(intent.payload.name, index),
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
});

export const remove = defineIntent<RemoveIntent>({
	validate(options) {
		return (
			isPlainObject(options) &&
			isString(options.name) &&
			isNumber(options.index) &&
			isOptional(options.onInvalid, (v) => v === 'revert' || v === 'insert')
		);
	},
	resolve(value, options) {
		const list = Array.from(getPathArray(value, options.name));
		removeItem(list, options.index);
		return updatePathValue(value, options.name, list);
	},
	apply(result, options) {
		// Warn if validation result is not yet available
		if (typeof result.error === 'undefined' && options.onInvalid) {
			// eslint-disable-next-line no-console
			console.warn(
				'intent.remove() with `onInvalid` requires the validation result to be available synchronously. ' +
					'This option is ignored because the error is not yet known.',
			);
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
						getPathArray(result.targetValue, options.name),
					);
					insertItem(list, options.defaultValue, list.length);
					return {
						...result,
						targetValue: updatePathValue(
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
						appendPath(intent.payload.name, intent.payload.index),
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
							appendPath(intent.payload.name, index),
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
});

export const reorder = defineIntent<ReorderIntent>({
	validate(options) {
		return (
			isPlainObject(options) &&
			isString(options.name) &&
			isNumber(options.from) &&
			isNumber(options.to)
		);
	},
	resolve(value, options) {
		const list = Array.from(getPathArray(value, options.name));
		reorderItems(list, options.from, options.to);
		return updatePathValue(value, options.name, list);
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
					getDefaultListKey(state.resetKey, currentValue, intent.payload.name),
			);

			reorderItems(listKeys, intent.payload.from, intent.payload.to);

			keys = {
				// Remove all child keys
				...updateListKeys(
					state.listKeys,
					appendPath(intent.payload.name, intent.payload.from),
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
});

/**
 * Built-in action handlers for form intents:
 * - reset: clears form data
 * - validate: marks fields as touched for validation display
 * - update: updates specific field values
 * - insert/remove/reorder: manages array field operations
 */
export const defaultIntentHandlers: DefaultIntentHandlers = {
	submit,
	reset,
	validate,
	update,
	insert,
	remove,
	reorder,
};
