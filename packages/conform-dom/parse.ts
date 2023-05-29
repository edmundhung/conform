import { resolve, setValue } from './formdata.js';
import { getIntent, parseIntent, updateList } from './intent.js';

export type Submission<Schema = any> = {
	intent: string;
	payload: Record<string, any>;
	error: Record<string, string | string[]>;
	value?: Schema | null;
};

export function parse(payload: FormData | URLSearchParams): Submission;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) => { value?: Schema; error?: Record<string, string | string[]> };
	},
): Submission<Schema>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) => Promise<{ value?: Schema; error?: Record<string, string | string[]> }>;
	},
): Promise<Submission<Schema>>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
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
			payload: Record<string, any>,
			intent: string,
		) =>
			| { value?: Schema; error?: Record<string, string | string[]> }
			| Promise<{ value?: Schema; error?: Record<string, string | string[]> }>;
	},
): Submission<Schema> | Promise<Submission<Schema>> {
	const submission: Submission = {
		intent: getIntent(payload),
		payload: resolve(payload),
		error: {},
	};

	const intent = parseIntent(submission.intent);

	if (intent && intent.type === 'list') {
		const changes = Array.isArray(intent.payload)
			? intent.payload
			: [intent.payload];

		for (const payload of changes) {
			setValue(submission.payload, payload.name, (list) => {
				if (typeof list !== 'undefined' && !Array.isArray(list)) {
					throw new Error('The list command can only be applied to a list');
				}

				return updateList(list ?? [], payload);
			});
		}
	}

	if (typeof options?.resolve === 'undefined') {
		return submission;
	}

	const result = options.resolve(submission.payload, submission.intent);
	const mergeResolveResult = (resolved: {
		error?: Record<string, string | string[]>;
		value?: Schema;
	}) => {
		return {
			...submission,
			...resolved,
		};
	};

	if (result instanceof Promise) {
		return result.then<Submission<Schema>>(mergeResolveResult);
	}

	return mergeResolveResult(result);
}
