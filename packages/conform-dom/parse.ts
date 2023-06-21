import { resolve, setValue } from './formdata.js';
import { INTENT, getIntent, parseIntent, updateList } from './intent.js';

export type Submission<Schema = unknown> = {
	intent: string;
	payload: Record<string, unknown>;
	error: Record<string, string | string[]>;
	value?: Schema | null;
};

export const VALIDATION_UNDEFINED = '__undefined__';
export const VALIDATION_SKIPPED = '__skipped__';

export function parse(payload: FormData | URLSearchParams): Submission;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, unknown>,
			intent: string,
		) => { value?: Schema; error?: Record<string, string | string[]> };
	},
): Submission<Schema>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, unknown>,
			intent: string,
		) => Promise<{ value?: Schema; error?: Record<string, string | string[]> }>;
	},
): Promise<Submission<Schema>>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, unknown>,
			intent: string,
		) =>
			| { value?: Schema; error?: Record<string, string | string[]> }
			| Promise<{ value?: Schema; error?: Record<string, string | string[]> }>;
	},
): Submission<Schema> | Promise<Submission<Schema>>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, unknown>,
			intent: string,
		) =>
			| { value?: Schema; error?: Record<string, string | string[]> }
			| Promise<{ value?: Schema; error?: Record<string, string | string[]> }>;
	},
): Submission<Schema> | Promise<Submission<Schema>> {
	const submission: Submission<Schema> = {
		intent: getIntent(payload),
		payload: resolve(payload, [INTENT]),
		error: {},
	};

	const intent = parseIntent(submission.intent);

	if (intent && intent.type === 'list') {
		setValue(submission.payload, intent.payload.name, (list) => {
			if (typeof list !== 'undefined' && !Array.isArray(list)) {
				throw new Error('The list intent can only be applied to a list');
			}

			return updateList(list ?? [], intent.payload);
		});
	}

	if (typeof options?.resolve === 'undefined') {
		return submission;
	}

	const result = options.resolve(submission.payload, submission.intent);
	const mergeResolveResult = (resolved: {
		error?: Record<string, string | string[]>;
		value?: Schema;
	}): Submission<Schema> => {
		return {
			...submission,
			...resolved,
		};
	};

	if (result instanceof Promise) {
		return result.then(mergeResolveResult);
	}

	return mergeResolveResult(result);
}
