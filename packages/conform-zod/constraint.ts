import { type FieldConstraint, type FieldsetConstraint } from '@conform-to/dom';
import {
	type input,
	type ZodType,
	type ZodTypeAny,
	ZodArray,
	ZodDefault,
	ZodDiscriminatedUnion,
	ZodEffects,
	ZodEnum,
	ZodIntersection,
	ZodNumber,
	ZodObject,
	ZodOptional,
	ZodPipeline,
	ZodString,
	ZodUnion,
} from 'zod';

export function getConstraint<Schema extends ZodTypeAny>(
	schema: Schema,
): FieldsetConstraint<input<Schema>> {
	function inferConstraint<T>(schema: ZodType<T>): FieldConstraint<T> {
		let constraint: FieldConstraint = {};

		if (schema instanceof ZodEffects) {
			constraint = {
				...inferConstraint(schema.innerType()),
			};
		} else if (schema instanceof ZodPipeline) {
			constraint = {
				...inferConstraint(schema._def.out),
			};
		} else if (schema instanceof ZodOptional) {
			constraint = {
				...inferConstraint(schema.unwrap()),
				required: false,
			};
		} else if (schema instanceof ZodDefault) {
			constraint = {
				...inferConstraint(schema.removeDefault()),
				required: false,
			};
		} else if (schema instanceof ZodArray) {
			constraint = {
				...inferConstraint(schema.element),
				multiple: true,
			};
		} else if (schema instanceof ZodString) {
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
		} else if (schema instanceof ZodNumber) {
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
		} else if (schema instanceof ZodEnum) {
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

	function resolveFieldsetConstraint<T extends Record<string, any>>(
		schema: ZodType<T>,
	): FieldsetConstraint<input<Schema>> {
		if (schema instanceof ZodObject) {
			const result: FieldsetConstraint<input<Schema>> = {};

			for (const [key, def] of Object.entries(schema.shape)) {
				// @ts-expect-error
				result[key] = inferConstraint(def);
			}

			return result;
		}

		if (schema instanceof ZodEffects) {
			return resolveFieldsetConstraint(schema.innerType());
		} else if (schema instanceof ZodOptional) {
			return resolveFieldsetConstraint(schema.unwrap());
		} else if (schema instanceof ZodIntersection) {
			return {
				...resolveFieldsetConstraint(schema._def.left),
				...resolveFieldsetConstraint(schema._def.right),
			};
		} else if (
			schema instanceof ZodUnion ||
			schema instanceof ZodDiscriminatedUnion
		) {
			const options = schema.options as Array<ZodType<any>>;

			return options.map(resolveFieldsetConstraint).reduce((prev, next) => {
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
								// @ts-expect-error
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

	return resolveFieldsetConstraint(schema);
}
