import {
	type FieldConstraint,
	type FieldsetConstraint,
	type Submission,
	getName,
	parse as baseParse,
	VALIDATION_SKIPPED,
	VALIDATION_UNDEFINED,
} from '@conform-to/dom';
import * as z from 'zod';

export function getFieldsetConstraint<Source extends z.ZodTypeAny>(
	source: Source,
): FieldsetConstraint<z.input<Source>> {
	function inferConstraint<T>(schema: z.ZodType<T>): FieldConstraint<T> {
		let constraint: FieldConstraint = {};

		if (schema instanceof z.ZodEffects) {
			constraint = {
				...inferConstraint(schema.innerType()),
			};
		} else if (schema instanceof z.ZodOptional) {
			constraint = {
				...inferConstraint(schema.unwrap()),
				required: false,
			};
		} else if (schema instanceof z.ZodDefault) {
			constraint = {
				...inferConstraint(schema.removeDefault()),
				required: false,
			};
		} else if (schema instanceof z.ZodArray) {
			constraint = {
				...inferConstraint(schema.element),
				multiple: true,
			};
		} else if (schema instanceof z.ZodString) {
			for (let check of schema._def.checks) {
				switch (check.kind) {
					case 'min':
						if (!constraint.minLength || constraint.minLength < check.value) {
							constraint.minLength = check.value;
						}
						break;
					case 'max':
						if (!constraint.maxLength || constraint.maxLength > check.value) {
							constraint.maxLength = check.value;
						}
						break;
					case 'regex':
						if (!constraint.pattern) {
							constraint.pattern = check.regex.source;
						}
						break;
				}
			}
		} else if (schema instanceof z.ZodNumber) {
			for (let check of schema._def.checks) {
				switch (check.kind) {
					case 'min':
						if (!constraint.min || constraint.min < check.value) {
							constraint.min = check.value;
						}
						break;
					case 'max':
						if (!constraint.max || constraint.max > check.value) {
							constraint.max = check.value;
						}
						break;
				}
			}
		} else if (schema instanceof z.ZodEnum) {
			constraint.pattern = schema.options
				.map((option: string) =>
					// To escape unsafe characters on regex
					option.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d'),
				)
				.join('|');
		}

		if (typeof constraint.required === 'undefined') {
			constraint.required = true;
		}

		return constraint;
	}

	const keys: Array<keyof FieldConstraint> = [
		'required',
		'minLength',
		'maxLength',
		'min',
		'max',
		'step',
		'multiple',
		'pattern',
	];

	function resolveFieldsetConstarint<T extends Record<string, any>>(
		schema: z.ZodType<T>,
	): FieldsetConstraint<z.input<Source>> {
		if (schema instanceof z.ZodObject) {
			const result: FieldsetConstraint<z.input<Source>> = {};

			for (const [key, def] of Object.entries(schema.shape)) {
				// @ts-expect-error
				result[key] = inferConstraint(def);
			}

			return result;
		}

		if (schema instanceof z.ZodEffects) {
			return resolveFieldsetConstarint(schema.innerType());
		} else if (schema instanceof z.ZodOptional) {
			return resolveFieldsetConstarint(schema.unwrap());
		} else if (schema instanceof z.ZodIntersection) {
			return {
				...resolveFieldsetConstarint(schema._def.left),
				...resolveFieldsetConstarint(schema._def.right),
			};
		} else if (
			schema instanceof z.ZodUnion ||
			schema instanceof z.ZodDiscriminatedUnion
		) {
			const options = schema.options as Array<z.ZodType<any>>;

			return options.map(resolveFieldsetConstarint).reduce((prev, next) => {
				const list = new Set([...Object.keys(prev), ...Object.keys(next)]);
				const result: Record<string, FieldConstraint> = {};

				for (const name of list) {
					// @ts-expect-error
					const prevConstraint = prev[name];
					// @ts-expect-error
					const nextConstraint = next[name];

					if (prevConstraint && nextConstraint) {
						result[name] = {};

						for (const key of keys) {
							if (
								typeof prevConstraint[key] !== 'undefined' &&
								typeof nextConstraint[key] !== 'undefined' &&
								prevConstraint[key] === nextConstraint[key]
							) {
								result[name][key] = prevConstraint[key];
							}
						}
					} else {
						result[name] = {
							...prevConstraint,
							...nextConstraint,
							required: false,
						};
					}
				}

				return result;
			});
		}

		return {};
	}

	return resolveFieldsetConstarint(source);
}

export function parse<Schema extends z.ZodTypeAny>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: string) => Schema);
		acceptMultipleErrors?: ({
			name,
			intent,
			payload,
		}: {
			name: string;
			intent: string;
			payload: Record<string, any>;
		}) => boolean;
		async?: false;
	},
): Submission<z.output<Schema>>;
export function parse<Schema extends z.ZodTypeAny>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: string) => Schema);
		acceptMultipleErrors?: ({
			name,
			intent,
			payload,
		}: {
			name: string;
			intent: string;
			payload: Record<string, any>;
		}) => boolean;
		async: true;
	},
): Promise<Submission<z.output<Schema>>>;
export function parse<Schema extends z.ZodTypeAny>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: string) => Schema);
		acceptMultipleErrors?: ({
			name,
			intent,
			payload,
		}: {
			name: string;
			intent: string;
			payload: Record<string, any>;
		}) => boolean;
		async?: boolean;
	},
): Submission<z.output<Schema>> | Promise<Submission<z.output<Schema>>> {
	return baseParse<z.output<Schema>>(payload, {
		resolve(payload, intent) {
			const schema =
				typeof config.schema === 'function'
					? config.schema(intent)
					: config.schema;
			const resolveResult = (
				result: z.SafeParseReturnType<z.input<Schema>, z.output<Schema>>,
			):
				| { value: z.output<Schema> }
				| { error: Record<string, string | string[]> } => {
				if (result.success) {
					return {
						value: result.data,
					};
				}

				return {
					error: result.error.errors.reduce<Record<string, string | string[]>>(
						(result, e) => {
							const name = getName(e.path);

							if (typeof result[name] === 'undefined') {
								result[name] = e.message;
							} else if (
								config.acceptMultipleErrors?.({ name, intent, payload })
							) {
								result[name] = ([] as string[]).concat(result[name], e.message);
							}

							return result;
						},
						{},
					),
				};
			};

			return config.async
				? schema.safeParseAsync(payload).then(resolveResult)
				: resolveResult(schema.safeParse(payload));
		},
	});
}

/**
 * A helper function to define a custom constraint on a superRefine check.
 * Mainly used for async validation.
 *
 * @see https://conform.guide/api/zod#refine
 */
export function refine(
	ctx: z.RefinementCtx,
	options: {
		/**
		 * A validate function. If the function returns `undefined`,
		 * it will fallback to server validation.
		 */
		validate: () => boolean | Promise<boolean> | undefined;
		/**
		 * Define when the validation should be run. If the value is `false`,
		 * the validation will be skipped.
		 */
		when?: boolean;
		/**
		 * The message displayed when the validation fails.
		 */
		message: string;
		/**
		 * The path set to the zod issue.
		 */
		path?: z.IssueData['path'];
	},
): void | Promise<void> {
	if (!options.when) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: VALIDATION_SKIPPED,
			path: options.path,
		});
		return;
	}

	// Run the validation
	const result = options.validate();

	if (typeof result === 'undefined') {
		// Validate only if the constraint is defined
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: VALIDATION_UNDEFINED,
			path: options.path,
		});
		return;
	}

	const reportInvalid = (valid: boolean) => {
		if (valid) {
			return;
		}

		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: options.message,
			path: options.path,
		});
	};

	return typeof result === 'boolean'
		? reportInvalid(result)
		: result.then(reportInvalid);
}

export function ifNonEmptyString(
	fn: (value: string) => unknown,
): (value: unknown) => unknown {
	return (value: unknown) => {
		if (typeof value !== 'string') {
			return value;
		}

		if (value === '') {
			return undefined;
		}

		return fn(value);
	};
}
