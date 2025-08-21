import type { FormValue, Submission } from '@conform-to/dom/future';
import {
	getPathSegments,
	isPlainObject,
	setValueAtPath,
	appendPathSegment,
	getRelativePath,
	deepEqual,
} from '@conform-to/dom/future';
import {
	addItem,
	configureListIndexUpdate,
	getListValue,
	isUndefined,
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
	FormAction,
	FormState,
	UnknownIntent,
	ActionHandler,
	ResetAction,
	ValidateAction,
	UpdateAction,
	InsertAction,
	RemoveAction,
	ReorderAction,
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

export function applyIntent(
	submission: Submission,
	options?: {
		handlers?: Record<string, ActionHandler>;
	},
): Record<string, FormValue> | null {
	if (!submission.intent) {
		return submission.value;
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
		return handler.onApply(submission.value, intent.payload);
	}

	return submission.value;
}

export function initializeState<ErrorShape>(): FormState<ErrorShape> {
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

const reset: ActionHandler<ResetAction> = {
	onApply() {
		return null;
	},
};

const validate: ActionHandler<ValidateAction> = {
	validatePayload(name) {
		return isOptional(name, isString);
	},
	onUpdate(state, { submission, intent, error }) {
		const name = intent.payload ?? '';
		const basePath = getPathSegments(name);

		let touchedFields = addItem(state.touchedFields, name);

		for (const field of submission.fields) {
			// Add all child fields to the touched fields too
			if (getRelativePath(field, basePath) !== null) {
				touchedFields = addItem(touchedFields, field);
			}
		}

		// We couldn't find out all the fields from the FormData, e.g. unchecked checkboxes.
		// or fieldsets without any fields, but we can at least include missing
		// required fields based on the form error
		if (name === '' && error) {
			for (const name of Object.keys(error.fieldErrors)) {
				touchedFields = addItem(touchedFields, name);
			}
		}

		return merge(state, {
			touchedFields,
		});
	},
};

const update: ActionHandler<UpdateAction> = {
	validatePayload(options) {
		return (
			isPlainObject(options) &&
			isOptional(options.name, isString) &&
			isOptional(options.index, isNumber) &&
			!isUndefined(options.value)
		);
	},
	onApply(value, options) {
		return modify(
			value,
			appendPathSegment(options.name, options.index),
			options.value,
		);
	},
	onUpdate(state, { type, submission, intent }) {
		let listKeys = state.listKeys;

		// Update the keys only for client updates to avoid double updates if there is no client validation
		if (type === 'client') {
			// TODO: Do we really need to update the keys here?
			const name = appendPathSegment(intent.payload.name, intent.payload.index);
			// Remove all child keys
			listKeys = name === '' ? {} : updateKeys(state.listKeys, name);
		}

		const basePath = getPathSegments(intent.payload.name);
		let touchedFields = state.touchedFields;

		for (const field of submission.fields) {
			if (basePath.length === 0 || getRelativePath(field, basePath) !== null) {
				touchedFields = addItem(touchedFields, field);
			}
		}

		return {
			...state,
			listKeys,
			touchedFields,
		};
	},
};

const insert: ActionHandler<InsertAction> = {
	validatePayload(options) {
		return (
			isPlainObject(options) &&
			isString(options.name) &&
			isOptional(options.index, isNumber)
		);
	},
	onApply(value, options) {
		const list = Array.from(getListValue(value, options.name));
		insertItem(list, options.defaultValue, options.index ?? list.length);
		return modify(value, options.name, list);
	},
	onUpdate(state, { type, submission, intent }) {
		const currentValue = submission.value;
		const list = getListValue(currentValue, intent.payload.name);
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
					getDefaultListKey(state.key, currentValue, intent.payload.name),
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
			...state,
			listKeys: keys,
			touchedFields,
		};
	},
};

const remove: ActionHandler<RemoveAction> = {
	validatePayload(options) {
		return (
			isPlainObject(options) &&
			isString(options.name) &&
			isNumber(options.index)
		);
	},
	onApply(value, options) {
		const list = Array.from(getListValue(value, options.name));
		removeItem(list, options.index);
		return modify(value, options.name, list);
	},
	onUpdate(state, { type, submission, intent }) {
		const currentValue = submission.value;
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
					getDefaultListKey(state.key, currentValue, intent.payload.name),
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
			...state,
			listKeys: keys,
			touchedFields,
		};
	},
};

const reorder: ActionHandler<ReorderAction> = {
	validatePayload(options) {
		return (
			isPlainObject(options) &&
			isString(options.name) &&
			isNumber(options.from) &&
			isNumber(options.to)
		);
	},
	onApply(value, options) {
		const list = Array.from(getListValue(value, options.name));
		reorderItems(list, options.from, options.to);
		return modify(value, options.name, list);
	},
	onUpdate(state, { type, submission, intent }) {
		const currentValue = submission.value;
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
					getDefaultListKey(state.key, currentValue, intent.payload.name),
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
			...state,
			listKeys: keys,
			touchedFields,
		};
	},
};

export const actionHandlers = {
	reset,
	validate,
	update,
	insert,
	reorder,
	remove,
} satisfies Record<string, ActionHandler>;

export function defaultUpdateState<ErrorShape>(
	state: FormState<ErrorShape>,
	action: FormAction<ErrorShape>,
): FormState<ErrorShape> {
	const value = action.value ?? action.submission.value;

	if (action.type === 'client') {
		return merge(state, {
			intendedValue: action.value ?? state.intendedValue,
			// Update client error only if the error is different from the previous one to minimize unnecessary re-renders
			clientError:
				typeof action.error !== 'undefined' &&
				!deepEqual(state.clientError, action.error)
					? action.error
					: state.clientError,
			// Reset server error if form value is changed
			serverError:
				typeof action.error !== 'undefined' &&
				!deepEqual(state.serverValidatedValue, value)
					? null
					: state.serverError,
		});
	}

	return merge(state, {
		intendedValue: action.type === 'initialize' ? value : state.intendedValue,
		// Clear client error to avoid showing stale errors
		clientError: null,
		// Update server error if the error is defined.
		// There is no need to check if the error is different as we are updating other states as well
		serverError:
			typeof action.error !== 'undefined' ? action.error : state.serverError,
		// Keep track of the value that the serverError is based on
		serverValidatedValue:
			typeof action.error !== 'undefined' ? value : state.serverValidatedValue,
	});
}

export function updateState<ErrorShape>(
	state: FormState<ErrorShape>,
	action: FormAction<ErrorShape>,
): FormState<ErrorShape> {
	if (action.value === null) {
		return action.ctx.reset();
	}

	// Apply the form error and intented value from the result first
	state = defaultUpdateState(state, action);

	if (action.type !== 'server' && typeof action.intent !== 'undefined') {
		// Validate the whole form if no intent is provided (default submission)
		const intent = action.intent ?? { type: 'validate' };
		const handler = action.ctx.handlers?.[intent.type];

		if (typeof handler?.onUpdate === 'function') {
			if (handler.validatePayload?.(intent.payload) ?? true) {
				return handler.onUpdate(state, {
					...action,
					intent: {
						type: intent.type,
						payload: intent.payload,
					},
				});
			}
		}
	}

	return state;
}
