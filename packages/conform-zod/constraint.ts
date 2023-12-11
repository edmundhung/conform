import type { Constraint } from '@conform-to/dom';
import {
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
	ZodTuple,
	ZodLazy,
} from 'zod';

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

export function getZodConstraint(
	schema: ZodTypeAny,
): Record<string, Constraint> {
	function updateConstraint(
		schema: ZodTypeAny,
		data: Record<string, Constraint>,
		name = '',
	): void {
		const constraint = name !== '' ? (data[name] ??= { required: true }) : {};

		if (schema instanceof ZodObject) {
			for (const key in schema.shape) {
				updateConstraint(
					schema.shape[key],
					data,
					name ? `${name}.${key}` : key,
				);
			}
		} else if (schema instanceof ZodEffects) {
			updateConstraint(schema.innerType(), data, name);
		} else if (schema instanceof ZodPipeline) {
			// FIXME: What to do with .pipe()?
			updateConstraint(schema._def.out, data, name);
		} else if (schema instanceof ZodIntersection) {
			const leftResult: Record<string, Constraint> = {};
			const rightResult: Record<string, Constraint> = {};

			updateConstraint(schema._def.left, leftResult, name);
			updateConstraint(schema._def.right, rightResult, name);

			Object.assign(data, leftResult, rightResult);
		} else if (
			schema instanceof ZodUnion ||
			schema instanceof ZodDiscriminatedUnion
		) {
			Object.assign(
				data,
				(schema.options as ZodTypeAny[])
					.map((option) => {
						const result: Record<string, Constraint> = {};

						updateConstraint(option, result, name);

						return result;
					})
					.reduce((prev, next) => {
						const list = new Set([...Object.keys(prev), ...Object.keys(next)]);
						const result: Record<string, Constraint> = {};

						for (const name of list) {
							const prevConstraint = prev[name];
							const nextConstraint = next[name];

							if (prevConstraint && nextConstraint) {
								const constraint: Constraint = {};

								result[name] = constraint;

								for (const key of keys) {
									if (
										typeof prevConstraint[key] !== 'undefined' &&
										typeof nextConstraint[key] !== 'undefined' &&
										prevConstraint[key] === nextConstraint[key]
									) {
										// @ts-expect-error Both are on the same type
										constraint[key] = prevConstraint[key];
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
					}),
			);
		} else if (name === '') {
			// All the cases below are not allowed on root
			throw new Error('Unsupported schema');
		} else if (schema instanceof ZodArray) {
			constraint.multiple = true;
			updateConstraint(schema.element, data, `${name}[]`);
		} else if (schema instanceof ZodString) {
			if (schema.minLength !== null) {
				constraint.minLength = schema.minLength;
			}
			if (schema.maxLength !== null) {
				constraint.maxLength = schema.maxLength;
			}
		} else if (schema instanceof ZodOptional) {
			constraint.required = false;
			updateConstraint(schema.unwrap(), data, name);
		} else if (schema instanceof ZodDefault) {
			constraint.required = false;
			updateConstraint(schema.removeDefault(), data, name);
		} else if (schema instanceof ZodNumber) {
			if (schema.minValue !== null) {
				constraint.min = schema.minValue;
			}
			if (schema.maxValue !== null) {
				constraint.max = schema.maxValue;
			}
		} else if (schema instanceof ZodEnum) {
			constraint.pattern = schema.options
				.map((option: string) =>
					// To escape unsafe characters on regex
					option.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d'),
				)
				.join('|');
		} else if (schema instanceof ZodTuple) {
			for (let i = 0; i < schema.items.length; i++) {
				updateConstraint(schema.items[i], data, `${name}[${i}]`);
			}
		} else if (schema instanceof ZodLazy) {
			// FIXME: If you are interested in this, feel free to create a PR
		}
	}

	let result: Record<string, Constraint> = {};

	updateConstraint(schema, result);

	return result;
}
