import type { Constraint } from '@conform-to/dom';
import { getPaths, formatPaths, getRelativePath } from '@conform-to/dom';
import {
	$ZodType,
	$ZodTypes,
	$ZodNumber,
	$ZodString,
	$ZodFile,
} from 'zod/v4/core';

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

export function getZodConstraint(schema: $ZodType): Record<string, Constraint> {
	const processingPaths = new Map<$ZodType, string>();
	const aliases: Array<{
		from: Array<string | number>;
		to: Array<string | number>;
	}> = [];
	const result: Record<string, Constraint> = {};
	const cache: Record<string, Constraint | undefined> = {};

	function updateConstraint(
		schema: $ZodType,
		data: Record<string, Constraint>,
		name = '',
	): void {
		// Detect re-entrant calls caused by getter-based recursive schemas
		const processingPath = processingPaths.get(schema);

		if (typeof processingPath !== 'undefined') {
			aliases.push({
				from: getPaths(name),
				to: getPaths(processingPath),
			});
			return;
		}

		processingPaths.set(schema, name);

		const constraint = name !== '' ? (data[name] ??= { required: true }) : {};
		const def = (schema as unknown as $ZodTypes)._zod.def;

		if (def.type === 'object') {
			for (const key in def.shape) {
				// @ts-expect-error
				updateConstraint(def.shape[key], data, name ? `${name}.${key}` : key);
			}
		} else if (def.type === 'pipe') {
			// FIXME: What to do with .pipe()?
			if (def.out._zod.def.type === 'transform') {
				updateConstraint(def.in, data, name);
			}
			updateConstraint(def.out, data, name);
		} else if (def.type === 'intersection') {
			const leftResult: Record<string, Constraint> = {};
			const rightResult: Record<string, Constraint> = {};

			updateConstraint(def.left, leftResult, name);
			updateConstraint(def.right, rightResult, name);

			Object.assign(data, leftResult, rightResult);
		} else if (
			def.type === 'union' // || def.type === 'discriminatedUnion'
		) {
			Object.assign(
				data,
				(def.options as $ZodType[])
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
		} else if (def.type === 'array') {
			constraint.multiple = true;
			updateConstraint(def.element, data, `${name}[]`);
		} else if (def.type === 'string') {
			const _schema = schema as $ZodString;
			if (_schema._zod.bag.minimum != null) {
				constraint.minLength = _schema._zod.bag.minimum;
			}
			if (_schema._zod.bag.maximum != null) {
				constraint.maxLength = _schema._zod.bag.maximum;
			}
		} else if (def.type === 'optional') {
			constraint.required = false;
			updateConstraint(def.innerType, data, name);
		} else if (def.type === 'nullable') {
			updateConstraint(def.innerType, data, name);
		} else if (def.type === 'default') {
			constraint.required = false;
			updateConstraint(def.innerType, data, name);
		} else if (def.type === 'number') {
			const _schema = schema as $ZodNumber;
			if (_schema._zod.bag.minimum != null) {
				constraint.min = _schema._zod.bag.minimum;
			}
			if (_schema._zod.bag.maximum != null) {
				constraint.max = _schema._zod.bag.maximum;
			}
		} else if (def.type === 'enum') {
			constraint.pattern = Object.keys(def.entries)
				.map((option: string) =>
					// To escape unsafe characters on regex
					option.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d'),
				)
				.join('|');
		} else if (def.type === 'tuple') {
			for (let i = 0; i < def.items.length; i++) {
				// @ts-expect-error
				updateConstraint(def.items[i], data, `${name}[${i}]`);
			}
		} else if (def.type === 'file') {
			const _schema = schema as $ZodFile;
			if (_schema._zod.bag.mime) {
				constraint.accept = _schema._zod.bag.mime.join();
			}
		} else if (def.type === 'lazy') {
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
				: formatPaths(nameOrSegments);

		if (name in result) {
			return result[name];
		}

		const segments =
			typeof nameOrSegments === 'string'
				? getPaths(nameOrSegments)
				: nameOrSegments;

		// Alias collapse first to handle tuple indices
		// like branch[0] before normalization would erase them
		for (const alias of aliases) {
			const tail = getRelativePath(segments, alias.from);

			if (tail !== null && tail.length > 0) {
				return resolve([...alias.to, ...tail]);
			}
		}

		for (let i = segments.length - 1; i >= 0; i--) {
			if (typeof segments[i] === 'number') {
				// Normalizing indices by replacing rightmost numeric index with "[]"
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
