import { resolve, setValue } from './formdata.js';
import { INTENT, getIntent, parseIntent, updateList } from './intent.js';

export type Submission<Schema = any> = {
	intent: string;
	payload: Record<string, any>;
	error: Record<string, string[]>;
	value?: Schema | null;
	report(options?: ReportOptions): SubmissionResult;
};

export type SubmissionResult = {
	intent: Submission['intent'];
	payload: Submission['payload'] | null;
	error: Submission['error'];
};

export interface ReportOptions {
	formError?: string[];
	resetForm?: boolean;
}

function createSubmission<Schema>(
	intent: string,
	payload: Record<string, any>,
	error: Record<string, string[]>,
	value?: Schema,
): Submission {
	return {
		intent,
		payload,
		error,
		value,
		report(options?: ReportOptions) {
			return {
				intent: intent,
				payload: options?.resetForm ? null : payload,
				error: options?.formError
					? {
							...error,
							'': options.formError.concat(error[''] ?? []),
					  }
					: error,
			};
		},
	};
}

export const VALIDATION_UNDEFINED = '__undefined__';
export const VALIDATION_SKIPPED = '__skipped__';

export function parse(payload: FormData | URLSearchParams): Submission;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) => { value?: Schema; error?: Record<string, string[]> };
	},
): Submission<Schema>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) => Promise<{ value?: Schema; error?: Record<string, string[]> }>;
	},
): Promise<Submission<Schema>>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) =>
			| { value?: Schema; error?: Record<string, string[]> }
			| Promise<{ value?: Schema; error?: Record<string, string[]> }>;
	},
): Submission<Schema> | Promise<Submission<Schema>>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) =>
			| { value?: Schema; error?: Record<string, string[]> }
			| Promise<{ value?: Schema; error?: Record<string, string[]> }>;
	},
): Submission<Schema> | Promise<Submission<Schema>> {
	const intent = getIntent(payload);
	const data = resolve(payload, {
		ignoreKeys: [INTENT],
	});

	const command = parseIntent(intent);

	if (command && command.type === 'list') {
		setValue(data, command.payload.name, (list) => {
			if (typeof list !== 'undefined' && !Array.isArray(list)) {
				throw new Error('The list intent can only be applied to a list');
			}

			return updateList(list ?? [], command.payload);
		});
	}

	if (typeof options?.resolve === 'undefined') {
		return createSubmission(intent, data, {});
	}

	const result = options.resolve(data, intent);
	const mergeResolveResult = (resolved: {
		error?: Record<string, string[]>;
		value?: Schema;
	}) => {
		return createSubmission(intent, data, resolved.error ?? {}, resolved.value);
	};

	if (result instanceof Promise) {
		return result.then<Submission<Schema>>(mergeResolveResult);
	}

	return mergeResolveResult(result);
}
