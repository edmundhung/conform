import type { Constraint } from '@conform-to/dom';

import type {
	ZodTypeAny,
	ZodFirstPartySchemaTypes,
	ZodNumber,
	ZodString,
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
	'accept',
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
		const def = (schema as ZodFirstPartySchemaTypes)['_def'];

		if (def.typeName === 'ZodObject') {
			for (const key in def.shape()) {
				updateConstraint(def.shape()[key], data, name ? `${name}.${key}` : key);
			}
		} else if (def.typeName === 'ZodEffects') {
			updateConstraint(def.schema, data, name);
		} else if (def.typeName === 'ZodPipeline') {
			// FIXME: What to do with .pipe()?
			updateConstraint(def.out, data, name);
		} else if (def.typeName === 'ZodIntersection') {
			const leftResult: Record<string, Constraint> = {};
			const rightResult: Record<string, Constraint> = {};

			updateConstraint(def.left, leftResult, name);
			updateConstraint(def.right, rightResult, name);

			Object.assign(data, leftResult, rightResult);
		} else if (
			def.typeName === 'ZodUnion' ||
			def.typeName === 'ZodDiscriminatedUnion'
		) {
			Object.assign(
				data,
				(def.options as ZodTypeAny[])
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
		} else if (def.typeName === 'ZodArray') {
			constraint.multiple = true;
			updateConstraint(def.type, data, `${name}[]`);
		} else if (def.typeName === 'ZodString') {
			const _schema = schema as ZodString;
			if (_schema.minLength !== null) {
				constraint.minLength = _schema.minLength ?? undefined;
			}
			if (_schema.maxLength !== null) {
				constraint.maxLength = _schema.maxLength;
			}
		} else if (def.typeName === 'ZodOptional') {
			constraint.required = false;
			updateConstraint(def.innerType, data, name);
		} else if (def.typeName === 'ZodDefault') {
			constraint.required = false;
			updateConstraint(def.innerType, data, name);
		} else if (def.typeName === 'ZodNumber') {
			const _schema = schema as ZodNumber;
			if (_schema.minValue !== null) {
				constraint.min = _schema.minValue;
			}
			if (_schema.maxValue !== null) {
				constraint.max = _schema.maxValue;
			}
		} else if (def.typeName === 'ZodEnum') {
			constraint.pattern = def.values
				.map((option: string) =>
					// To escape unsafe characters on regex
					option.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d'),
				)
				.join('|');
		} else if (def.typeName === 'ZodTuple') {
			for (let i = 0; i < def.items.length; i++) {
				updateConstraint(def.items[i], data, `${name}[${i}]`);
			}
		} else if (def.typeName === 'ZodLazy') {
			// FIXME: If you are interested in this, feel free to create a PR
		}
	}

	const result: Record<string, Constraint> = {};

	updateConstraint(schema, result);

	return result;
}
