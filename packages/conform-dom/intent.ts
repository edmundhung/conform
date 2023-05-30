import { createSubmitter, requestSubmit } from './dom.js';
import { type Pretty } from './types.js';

export interface IntentButtonProps {
	name: typeof INTENT;
	value: string;
	formNoValidate?: boolean;
}

export type ListIntentPayload<Schema = unknown> =
	| {
			name: string;
			operation: 'prepend';
			defaultValue?: Schema;
			defaultValueFrom?: string;
	  }
	| {
			name: string;
			operation: 'append';
			defaultValue?: Schema;
			defaultValueFrom?: string;
	  }
	| {
			name: string;
			operation: 'replace';
			defaultValue: Schema;
			defaultValueFrom?: string;
			index: number;
	  }
	| { name: string; operation: 'remove'; index: number }
	| { name: string; operation: 'reorder'; from: number; to: number };

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
	return createIntent('validate', field);
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

export function createIntent(type: string, payload: string): IntentButtonProps {
	return {
		name: INTENT,
		value: `${type}/${payload}`,
		formNoValidate: true,
	};
}

/**
 * Helpers to configure an intent button for modifying a list
 *
 * @see https://conform.guide/api/react#list
 */
export const list = {
	combine(...intents: IntentButtonProps[]): IntentButtonProps {
		let payload: Array<ListIntentPayload> = [];

		for (const intent of intents) {
			const parsed = parseIntent(intent.value);

			if (parsed?.type !== 'list') {
				throw new Error('Only list intents can be combined');
			}

			payload = payload.concat(parsed.payload);
		}

		return createIntent('list', JSON.stringify(payload));
	},
	append<Schema>(
		name: string,
		payload?: Pretty<
			Omit<
				Extract<ListIntentPayload<Schema>, { operation: 'append' }>,
				'name' | 'operation'
			>
		>,
	): IntentButtonProps {
		return createIntent(
			'list',
			JSON.stringify({ name, operation: 'append', ...payload }),
		);
	},
	prepend<Schema>(
		name: string,
		payload?: Pretty<
			Omit<
				Extract<ListIntentPayload<Schema>, { operation: 'prepend' }>,
				'name' | 'operation'
			>
		>,
	): IntentButtonProps {
		return createIntent(
			'list',
			JSON.stringify({ name, operation: 'prepend', ...payload }),
		);
	},
	replace<Schema>(
		name: string,
		payload: Pretty<
			Omit<
				Extract<ListIntentPayload<Schema>, { operation: 'replace' }>,
				'name' | 'operation'
			>
		>,
	): IntentButtonProps {
		return createIntent(
			'list',
			JSON.stringify({ name, operation: 'replace', ...payload }),
		);
	},
	remove(
		name: string,
		payload: Pretty<
			Omit<
				Extract<ListIntentPayload, { operation: 'remove' }>,
				'name' | 'operation'
			>
		>,
	): IntentButtonProps {
		return createIntent(
			'list',
			JSON.stringify({ name, operation: 'remove', ...payload }),
		);
	},
	reorder(
		name: string,
		payload: Pretty<
			Omit<
				Extract<ListIntentPayload, { operation: 'reorder' }>,
				'name' | 'operation'
			>
		>,
	): IntentButtonProps {
		return createIntent(
			'list',
			JSON.stringify({ name, operation: 'reorder', ...payload }),
		);
	},
};

export function parseIntent<Schema>(intent: string):
	| {
			type: 'validate';
			payload: string;
	  }
	| {
			type: 'list';
			payload: ListIntentPayload<Schema> | Array<ListIntentPayload<Schema>>;
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
			console.warn('Failed to parse intent;', error);
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
