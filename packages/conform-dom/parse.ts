import { resolve, setValue } from './formdata';
import { getIntent, parseListCommand, updateList } from './intent';

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

	const command = parseListCommand(submission.intent);

	if (command) {
		setValue(submission.payload, command.scope, (list) => {
			if (typeof list !== 'undefined' && !Array.isArray(list)) {
				throw new Error('The list command can only be applied to a list');
			}

			return updateList(list ?? [], command);
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
