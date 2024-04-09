import { type Intent, type Submission, parse } from '@conform-to/dom';
import * as yup from 'yup';

export { getYupConstraint } from './constraint';

export function parseWithYup<Schema extends yup.AnyObjectSchema>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: false;
	},
): Submission<yup.InferType<Schema>, string[]>;
export function parseWithYup<Schema extends yup.AnyObjectSchema>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async: true;
	},
): Promise<Submission<yup.InferType<Schema>, string[]>>;
export function parseWithYup<Schema extends yup.AnyObjectSchema>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: boolean;
	},
):
	| Submission<yup.InferType<Schema>, string[]>
	| Promise<Submission<yup.InferType<Schema>, string[]>> {
	return parse<Submission<yup.InferType<Schema>>, string[]>(payload, {
		resolve(payload, intent) {
			const schema =
				typeof config.schema === 'function'
					? config.schema(intent)
					: config.schema;
			const resolveData = (value: yup.InferType<Schema>) => ({ value });
			const resolveError = (error: unknown) => {
				if (error instanceof yup.ValidationError) {
					return {
						error: error.inner.reduce<Record<string, string[]>>((result, e) => {
							const name = e.path ?? '';

							result[name] = [...(result[name] ?? []), e.message];

							return result;
						}, {}),
					};
				}

				throw error;
			};

			if (!config.async) {
				try {
					const data = schema.validateSync(payload, {
						abortEarly: false,
					});

					return resolveData(data);
				} catch (error) {
					return resolveError(error);
				}
			}

			return schema
				.validate(payload, { abortEarly: false })
				.then(resolveData)
				.catch(resolveError);
		},
	});
}
