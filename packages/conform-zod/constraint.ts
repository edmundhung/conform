import { type Constraint, invariant } from '@conform-to/dom';
import {
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

export function getConstraint(schema: ZodTypeAny): Record<string, Constraint> {
	function inferConstraint(schema: ZodTypeAny): Constraint {
		let constraint: Constraint = {};

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
						invariant(
							typeof constraint.min !== 'string',
							'min is not a number',
						);

						if (
							typeof constraint.min === 'undefined' ||
							constraint.min < check.value
						) {
							constraint.min = check.value;
						}
						break;
					case 'max':
						invariant(
							typeof constraint.max !== 'string',
							'max is not a number',
						);

						if (
							typeof constraint.max === 'undefined' ||
							constraint.max > check.value
						) {
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

	const keys: Array<keyof Constraint> = [
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
	): Record<string, Constraint> {
		if (schema instanceof ZodObject) {
			const result: Record<string, Constraint> = {};

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
				const result: Record<string, Constraint> = {};

				for (const name of list) {
					const prevConstraint = prev[name];
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
