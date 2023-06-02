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

type ExtractListIntentPayload<Operation, Schema = unknown> = Pretty<
	Omit<
		Extract<ListIntentPayload<Schema>, { operation: Operation }>,
		'name' | 'operation'
	>
>;

/**
 * Helpers to configure an intent button for modifying a list
 *
 * @see https://conform.guide/api/react#list
 */
export const list = new Proxy<{
	[Operation in ListIntentPayload['operation']]: {} extends ExtractListIntentPayload<Operation>
		? <Schema>(
				name: string,
				payload?: ExtractListIntentPayload<Operation, Schema>,
		  ) => IntentButtonProps
		: <Schema>(
				name: string,
				payload: ExtractListIntentPayload<Operation, Schema>,
		  ) => IntentButtonProps;
}>({} as any, {
	get(_target, operation: any) {
		return (name: string, payload = {}): IntentButtonProps => ({
			name: INTENT,
			value: `list/${JSON.stringify({ name, operation, ...payload })}`,
			formNoValidate: true,
		});
	},
});

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

	const [intent, secondIntent, ...rest] = payload.getAll(INTENT);

	// The submitter value is included in the formData directly on Safari 15.6.
	// This causes the intent to be duplicated in the payload.
	// We will ignore the second intent if it is the same as the first one.
	if (
		typeof intent !== 'string' ||
		(secondIntent && intent !== secondIntent) ||
		rest.length > 0
	) {
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
	form: HTMLFormElement | null | undefined,
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
			throw new Error('Unknown list intent received');
	}

	return list;
}
