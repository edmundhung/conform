import {
	type FieldConstraint,
	type FieldsetConstraint,
	getName,
} from '@conform-to/dom';
import * as z from 'zod';

export function getFieldsetConstraint<Source extends z.ZodTypeAny>(
	source: Source,
): FieldsetConstraint<z.infer<Source>> {
	function getSchemaShape<T extends Record<string, any>>(
		schema: z.ZodType<T>,
	): z.ZodRawShape | null {
		if (schema instanceof z.ZodObject) {
			return schema.shape;
		} else if (schema instanceof z.ZodEffects) {
			return getSchemaShape(schema.innerType());
		} else if (schema instanceof z.ZodOptional) {
			return getSchemaShape(schema.unwrap());
		}

		return null;
	}

	function inferConstraint<T>(schema: z.ZodType<T>): FieldConstraint {
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

	const shape = getSchemaShape(source);
	const result: FieldsetConstraint<z.infer<Source>> = {};

	if (shape) {
		for (const [key, def] of Object.entries(shape)) {
			// @ts-expect-error
			result[key] = inferConstraint(def);
		}
	}

	return result;
}

export function getError<Schema>(
	result: z.SafeParseReturnType<unknown, Schema> | z.ZodError<Schema>,
): Array<[string, string]> {
	const issues =
		result instanceof z.ZodError
			? result.errors
			: !result.success
			? result.error.errors
			: null;

	if (!issues) {
		return [];
	}

	return issues.reduce<Array<[string, string]>>((result, e) => {
		result.push([getName(e.path), e.message]);

		return result;
	}, []);
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
