import { createSubmitter, isSubmitter, requestSubmit } from './dom';

export interface IntentButtonProps {
	name: typeof INTENT;
	value: string;
	formNoValidate?: boolean;
}

export type ListCommand<Schema = unknown> =
	| { type: 'prepend'; scope: string; payload: { defaultValue: Schema } }
	| { type: 'append'; scope: string; payload: { defaultValue: Schema } }
	| {
			type: 'replace';
			scope: string;
			payload: { defaultValue: Schema; index: number };
	  }
	| { type: 'remove'; scope: string; payload: { index: number } }
	| { type: 'reorder'; scope: string; payload: { from: number; to: number } };

export interface ListCommandButtonBuilder {
	append<Schema>(
		name: string,
		payload?: { defaultValue: Schema },
	): IntentButtonProps;
	prepend<Schema>(
		name: string,
		payload?: { defaultValue: Schema },
	): IntentButtonProps;
	replace<Schema>(
		name: string,
		payload: { defaultValue: Schema; index: number },
	): IntentButtonProps;
	remove(name: string, payload: { index: number }): IntentButtonProps;
	reorder(
		name: string,
		payload: { from: number; to: number },
	): IntentButtonProps;
}

export const INTENT = '__intent__';

/**
 *
 * @param payload
 * @returns
 */
export function getIntent(payload: FormData | URLSearchParams): string {
	if (!payload.has(INTENT)) {
		return 'submit';
	}

	const [intent, ...rest] = payload.getAll(INTENT);

	if (typeof intent !== 'string' || rest.length > 0) {
		throw new Error('The intent could only be set on a button');
	}

	payload.delete(INTENT);

	return intent;
}

/**
 * Returns the properties required to configure an intent button for validation
 *
 * @see https://conform.guide/api/react#validate
 */
export function validate(field?: string): IntentButtonProps {
	return {
		name: INTENT,
		value: field ? `validate/${field}` : 'validate',
		formNoValidate: true,
	};
}

export function requestIntent(
	form: HTMLFormElement | undefined,
	buttonProps: {
		value: string;
		formNoValidate?: boolean;
	},
): void {
	if (!form) {
		console.warn('No form element is provided');
		return;
	}

	const submitter = createSubmitter({
		name: INTENT,
		value: buttonProps.value,
		hidden: true,
		formNoValidate: buttonProps.formNoValidate,
	});

	requestSubmit(form, submitter);
}

/**
 * Helpers to configure an intent button for modifying a list
 *
 * @see https://conform.guide/api/react#list
 */
export const list = new Proxy({} as ListCommandButtonBuilder, {
	get(_target, type: any) {
		return (scope: string, payload = {}): IntentButtonProps => ({
			name: INTENT,
			value: `list/${type}/${scope}/${JSON.stringify(payload)}`,
			formNoValidate: true,
		});
	},
});

export function isSubmitting(intent: string): boolean {
	return (
		intent.slice(0, intent.indexOf('/')) !== 'validate' &&
		parseListCommand(intent) === null
	);
}

/**
 * Check if the current focus is on a intent button.
 */
export function isFocusedOnIntentButton(
	form: HTMLFormElement,
	intent: string,
): boolean {
	const element = document.activeElement;

	return (
		isSubmitter(element) &&
		element.form === form &&
		element.name === INTENT &&
		element.value === intent
	);
}

export function getScope(intent: string): string | null {
	const [type, ...rest] = intent.split('/');

	switch (type) {
		case 'validate':
			return rest.length > 0 ? rest.join('/') : null;
		case 'list':
			return parseListCommand(intent)?.scope ?? null;
		default:
			return null;
	}
}

export function parseListCommand<Schema = unknown>(
	intent: string,
): ListCommand<Schema> | null {
	try {
		const [group, type, scope, json] = intent.split('/');

		if (
			group !== 'list' ||
			!['prepend', 'append', 'replace', 'remove', 'reorder'].includes(type) ||
			!scope
		) {
			return null;
		}

		const payload = JSON.parse(json);

		return {
			// @ts-expect-error
			type,
			scope,
			payload,
		};
	} catch (error) {
		return null;
	}
}

export function updateList<Schema>(
	list: Array<Schema>,
	command: ListCommand<Schema>,
): Array<Schema> {
	switch (command.type) {
		case 'prepend':
			list.unshift(command.payload.defaultValue);
			break;
		case 'append':
			list.push(command.payload.defaultValue);
			break;
		case 'replace':
			list.splice(command.payload.index, 1, command.payload.defaultValue);
			break;
		case 'remove':
			list.splice(command.payload.index, 1);
			break;
		case 'reorder':
			list.splice(
				command.payload.to,
				0,
				...list.splice(command.payload.from, 1),
			);
			break;
		default:
			throw new Error('Unknown list command received');
	}

	return list;
}
