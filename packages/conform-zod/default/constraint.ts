import type { Constraint } from '@conform-to/dom';
import {
	getPathSegments,
	formatPathSegments,
	getRelativePath,
} from '@conform-to/dom/future';
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
];

export function getZodConstraint(
	schema: ZodTypeAny,
): Record<string, Constraint> {
	const processingPaths = new Map<ZodTypeAny, string>();
	const aliases: Array<{
		from: Array<string | number>;
		to: Array<string | number>;
	}> = [];
	const result: Record<string, Constraint> = {};
	const cache: Record<string, Constraint | undefined> = {};

	function updateConstraint(
		schema: ZodTypeAny,
		data: Record<string, Constraint>,
		name = '',
	): void {
		const processingPath = processingPaths.get(schema);

		if (typeof processingPath !== 'undefined') {
			aliases.push({
				from: getPathSegments(name),
				to: getPathSegments(processingPath),
			});
			return;
		}

		processingPaths.set(schema, name);

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
		} else if (def.typeName === 'ZodNullable') {
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
			const inner = def.getter();
			updateConstraint(inner, data, name);
		}

		processingPaths.delete(schema);
	}

	function resolve(
		nameOrSegments: string | Array<string | number>,
	): Constraint | undefined {
		const name =
			typeof nameOrSegments === 'string'
				? nameOrSegments
				: formatPathSegments(nameOrSegments);

		if (name in result) {
			return result[name];
		}

		const segments =
			typeof nameOrSegments === 'string'
				? getPathSegments(nameOrSegments)
				: nameOrSegments;

		for (const alias of aliases) {
			const tail = getRelativePath(segments, alias.from);

			if (tail !== null && tail.length > 0) {
				return resolve([...alias.to, ...tail]);
			}
		}

		for (let i = segments.length - 1; i >= 0; i--) {
			if (typeof segments[i] === 'number') {
				segments[i] = '';
				return resolve(segments);
			}
		}

		return undefined;
	}

	updateConstraint(schema, result);

	return new Proxy(result, {
		get(target, name, receiver) {
			if (typeof name !== 'string') {
				return Reflect.get(target, name, receiver);
			}

			if (name in cache) {
				return cache[name];
			}

			return (cache[name] = resolve(name));
		},
	});
}
