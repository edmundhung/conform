import { resolve, setValue } from './formdata.js';
import { INTENT, getIntent, parseIntent, updateList } from './intent.js';

export type Submission<Schema = any> = {
	intent: string;
	payload: Record<string, any>;
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
			payload: Record<string, any>,
			intent: string,
		) => { value?: Schema; error?: Record<string, string | string[]> };
		stripEmptyValue?: boolean;
	},
): Submission<Schema>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) => Promise<{ value?: Schema; error?: Record<string, string | string[]> }>;
		stripEmptyValue?: boolean;
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
		stripEmptyValue?: boolean;
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
		stripEmptyValue?: boolean;
	},
): Submission<Schema> | Promise<Submission<Schema>> {
	const submission: Submission = {
		intent: getIntent(payload),
		payload: resolve(payload, {
			ignoreKeys: [INTENT],
			stripEmptyValue: options?.stripEmptyValue,
		}),
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
