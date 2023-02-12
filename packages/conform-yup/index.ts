import {
	type FieldConstraint,
	type FieldsetConstraint,
	type Submission,
	parse as baseParse,
} from '@conform-to/dom';
import * as yup from 'yup';

export function getFieldsetConstraint<Source extends yup.AnyObjectSchema>(
	source: Source,
): FieldsetConstraint<yup.InferType<Source>> {
	const description = source.describe();

	return Object.fromEntries(
		Object.entries(description.fields).map<[string, FieldConstraint]>(
			([key, def]) => {
				const constraint: FieldConstraint = {};

				switch (def.type) {
					case 'string': {
						for (const test of def.tests) {
							switch (test.name) {
								case 'required':
									constraint.required = true;
									break;
								case 'min':
									if (
										!constraint.minLength ||
										constraint.minLength < Number(test.params?.min)
									) {
										constraint.minLength = Number(test.params?.min);
									}
									break;
								case 'max':
									if (
										!constraint.maxLength ||
										constraint.maxLength > Number(test.params?.max)
									) {
										constraint.maxLength = Number(test.params?.max);
									}
									break;
								case 'matches':
									if (
										!constraint.pattern &&
										test.params?.regex instanceof RegExp
									) {
										constraint.pattern = test.params.regex.source;
									}
									break;
							}
						}
						if (!constraint.pattern && def.oneOf.length > 0) {
							constraint.pattern = def.oneOf.join('|');
						}
						break;
					}
					case 'number':
						for (const test of def.tests) {
							switch (test.name) {
								case 'required':
									constraint.required = true;
									break;
								case 'min':
									if (
										!constraint.min ||
										constraint.min < Number(test.params?.min)
									) {
										constraint.min = Number(test.params?.min);
									}
									break;
								case 'max':
									if (
										!constraint.max ||
										constraint.max > Number(test.params?.max)
									) {
										constraint.max = Number(test.params?.max);
									}
									break;
							}
						}
						break;
				}

				return [key, constraint];
			},
		),
	) as FieldsetConstraint<yup.InferType<Source>>;
}

export function parse<Schema extends yup.AnyObjectSchema>(
	payload: FormData | URLSearchParams,
	config: {
		schema:
			| Schema
			| (({
					shouldValidate,
			  }: {
					shouldValidate: (name: string) => boolean;
			  }) => Schema);
		acceptMultipleErrors?: ({
			name,
			intent,
			payload,
		}: {
			name: string;
			intent: string;
			payload: Record<string, any>;
		}) => boolean;
		shouldBeValidated?: ({
			intent,
			payload,
			defaultValidated,
		}: {
			intent: string;
			payload: Record<string, any>;
			defaultValidated: string[] | undefined;
		}) => string[] | undefined;
		async?: false;
	},
): Submission<yup.InferType<Schema>>;
export function parse<Schema extends yup.AnyObjectSchema>(
	payload: FormData | URLSearchParams,
	config: {
		schema:
			| Schema
			| (({
					shouldValidate,
			  }: {
					shouldValidate: (name: string) => boolean;
			  }) => Schema);
		acceptMultipleErrors?: ({
			name,
			intent,
			payload,
		}: {
			name: string;
			intent: string;
			payload: Record<string, any>;
		}) => boolean;
		shouldBeValidated?: ({
			intent,
			payload,
			defaultValidated,
		}: {
			intent: string;
			payload: Record<string, any>;
			defaultValidated: string[] | undefined;
		}) => string[] | undefined;
		async: true;
	},
): Promise<Submission<yup.InferType<Schema>>>;
export function parse<Schema extends yup.AnyObjectSchema>(
	payload: FormData | URLSearchParams,
	config: {
		schema:
			| Schema
			| (({
					shouldValidate,
			  }: {
					shouldValidate: (name: string) => boolean;
			  }) => Schema);
		acceptMultipleErrors?: ({
			name,
			intent,
			payload,
		}: {
			name: string;
			intent: string;
			payload: Record<string, any>;
		}) => boolean;
		shouldBeValidated?: ({
			intent,
			payload,
			defaultValidated,
		}: {
			intent: string;
			payload: Record<string, any>;
			defaultValidated: string[] | undefined;
		}) => string[] | undefined;
		async?: boolean;
	},
):
	| Submission<yup.InferType<Schema>>
	| Promise<Submission<yup.InferType<Schema>>> {
	return baseParse<Submission<yup.InferType<Schema>>>(payload, {
		resolve(payload, { intent, shouldValidate }) {
			const schema =
				typeof config.schema === 'function'
					? config.schema({ shouldValidate })
					: config.schema;
			const resolveData = (value: yup.InferType<Schema>) => ({ value });
			const resolveError = (error: unknown) => {
				if (error instanceof yup.ValidationError) {
					return {
						error: error.inner.reduce<Record<string, string | string[]>>(
							(result, e) => {
								const name = e.path ?? '';

								if (typeof result[name] === 'undefined') {
									result[name] = e.message;
								} else if (
									config.acceptMultipleErrors?.({ name, intent, payload })
								) {
									result[name] = ([] as string[]).concat(
										result[name],
										e.message,
									);
								}

								return result;
							},
							{},
						),
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
