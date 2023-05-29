import { createSubmitter, requestSubmit } from './dom.js';
import { type Pretty } from './types.js';

export interface IntentButtonProps {
	name: typeof INTENT;
	value: string;
	formNoValidate?: boolean;
}

export type ListIntentPayload<Schema = unknown> =
	| { name: string; operation: 'prepend'; defaultValue?: Schema }
	| { name: string; operation: 'append'; defaultValue?: Schema }
	| { name: string; operation: 'replace'; defaultValue: Schema; index: number }
	| { name: string; operation: 'remove'; index: number }
	| { name: string; operation: 'reorder'; from: number; to: number };

export interface ListCommandButtonBuilder {
	append<Schema>(
		name: string,
		payload?: Pretty<
			Omit<
				Extract<ListIntentPayload<Schema>, { operation: 'append' }>,
				'name' | 'operation'
			>
		>,
	): IntentButtonProps;
	prepend<Schema>(
		name: string,
		payload?: Pretty<
			Omit<
				Extract<ListIntentPayload<Schema>, { operation: 'prepend' }>,
				'name' | 'operation'
			>
		>,
	): IntentButtonProps;
	replace<Schema>(
		name: string,
		payload: Pretty<
			Omit<
				Extract<ListIntentPayload<Schema>, { operation: 'replace' }>,
				'name' | 'operation'
			>
		>,
	): IntentButtonProps;
	remove(
		name: string,
		payload: Pretty<
			Omit<
				Extract<ListIntentPayload, { operation: 'remove' }>,
				'name' | 'operation'
			>
		>,
	): IntentButtonProps;
	reorder(
		name: string,
		payload: Pretty<
			Omit<
				Extract<ListIntentPayload, { operation: 'reorder' }>,
				'name' | 'operation'
			>
		>,
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
export function validate(field: string): IntentButtonProps {
	return {
		name: INTENT,
		value: `validate/${field}`,
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
	get(_target, operation: any) {
		return (name: string, payload = {}): IntentButtonProps => ({
			name: INTENT,
			value: `list/${JSON.stringify({ name, operation, ...payload })}`,
			formNoValidate: true,
		});
	},
});

export function parseIntent<Schema>(intent: string):
	| {
			type: 'validate';
			payload: string;
	  }
	| {
			type: 'list';
			payload: ListIntentPayload<Schema>;
	  }
	| null {
	const [type, payload] = intent.split('/', 2);

	if (typeof payload !== 'undefined') {
		try {
			switch (type) {
				case 'validate':
					return { type, payload };
				case 'list':
					return { type, payload: JSON.parse(payload) };
			}
		} catch (error) {
			throw new Error(`Failed parsing intent: ${intent}`, { cause: error });
		}
	}

	return null;
}

export function updateList<Schema>(
	list: Array<Schema>,
	payload: ListIntentPayload<Schema>,
): Array<Schema> {
	switch (payload.operation) {
		case 'prepend':
			list.unshift(payload.defaultValue as any);
			break;
		case 'append':
			list.push(payload.defaultValue as any);
			break;
		case 'replace':
			list.splice(payload.index, 1, payload.defaultValue);
			break;
		case 'remove':
			list.splice(payload.index, 1);
			break;
		case 'reorder':
			list.splice(payload.to, 0, ...list.splice(payload.from, 1));
			break;
		default:
			throw new Error('Unknown list command received');
	}

	return list;
}
