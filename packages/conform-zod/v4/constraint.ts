import type { Constraint } from '@conform-to/dom';
import { formatPaths, getPaths, getRelativePath } from '@conform-to/dom';
import { serializeHtmlPattern } from '@conform-to/dom/future';
import type { $ZodChecks, $ZodType, $ZodTypes } from 'zod/v4/core';

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

type CheckDef = $ZodChecks['_zod']['def'];

type CheckSummary = {
	minimum?: number;
	maximum?: number;
	patterns: Map<string, RegExp>;
	mime?: string[];
};

// Same inclusive ranges Zod applies to `z.int()`, `z.int32()`, etc.
const numberFormatRanges: Record<string, [number, number]> = {
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-3.4028234663852886e38, 3.4028234663852886e38],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE],
};

function getCheckDefs(schema: $ZodType): CheckDef[] {
	const checkDefs = (schema._zod.def.checks ?? []).map(
		(check) => check._zod.def as CheckDef,
	);

	// A format schema such as `z.email()` is its own first check
	return schema._zod.traits.has('$ZodCheck')
		? [schema._zod.def as unknown as CheckDef, ...checkDefs]
		: checkDefs;
}

function narrowMinimum(summary: CheckSummary, value: unknown): void {
	if (
		typeof value === 'number' &&
		(summary.minimum === undefined || value > summary.minimum)
	) {
		summary.minimum = value;
	}
}

function narrowMaximum(summary: CheckSummary, value: unknown): void {
	if (
		typeof value === 'number' &&
		(summary.maximum === undefined || value < summary.maximum)
	) {
		summary.maximum = value;
	}
}

function narrowBoth(summary: CheckSummary, value: unknown): void {
	narrowMinimum(summary, value);
	narrowMaximum(summary, value);
}

function addPattern(summary: CheckSummary, pattern: unknown): void {
	if (pattern instanceof RegExp) {
		summary.patterns.set(pattern.toString(), pattern);
	}
}

function intersectMime(summary: CheckSummary, mime: unknown): void {
	if (!Array.isArray(mime)) {
		return;
	}

	const types = mime.filter((type): type is string => typeof type === 'string');

	summary.mime = summary.mime
		? summary.mime.filter((type) => types.includes(type))
		: types;
}

function mergeBag(summary: CheckSummary, bag: Record<string, unknown>): void {
	narrowMinimum(summary, bag.minimum);
	narrowMaximum(summary, bag.maximum);

	if (bag.patterns instanceof Set) {
		for (const pattern of bag.patterns) {
			addPattern(summary, pattern);
		}
	}

	intersectMime(summary, bag.mime);
}

/**
 * Collects the HTML-relevant bounds of a schema from its check definitions.
 *
 * Zod 4.6 stopped writing check metadata to `_zod.bag` when a schema is built,
 * so the bag alone is empty there. This mirrors Zod's own `aggregateChecks`
 * fold in `zod/v4/core/json-schema-processors`, which is not exported. The bag
 * is still merged in, so older Zod versions and third-party checks keep
 * contributing. Repeated bounds keep the tightest value, matching how Zod
 * validates them.
 */
function summarizeChecks(schema: $ZodType): CheckSummary {
	const summary: CheckSummary = { patterns: new Map() };

	for (const def of getCheckDefs(schema)) {
		switch (def.check) {
			case 'greater_than':
				if (def.inclusive) {
					narrowMinimum(summary, def.value);
				}
				break;
			case 'less_than':
				if (def.inclusive) {
					narrowMaximum(summary, def.value);
				}
				break;
			case 'number_format': {
				const range = numberFormatRanges[def.format];
				if (range) {
					narrowMinimum(summary, range[0]);
					narrowMaximum(summary, range[1]);
				}
				break;
			}
			case 'min_length':
			case 'min_size':
				narrowMinimum(summary, def.minimum);
				break;
			case 'max_length':
			case 'max_size':
				narrowMaximum(summary, def.maximum);
				break;
			case 'length_equals':
				narrowBoth(summary, def.length);
				break;
			case 'size_equals':
				narrowBoth(summary, def.size);
				break;
			case 'string_format':
				addPattern(summary, def.pattern);
				break;
			case 'mime_type':
				intersectMime(summary, def.mime);
				break;
		}
	}

	mergeBag(summary, schema._zod.bag);

	return summary;
}

export function getZodConstraint(
	schema: $ZodType,
	options: { preserveBranchSpecificRequired?: boolean } = {},
): Record<string, Constraint> {
	const { preserveBranchSpecificRequired = true } = options;
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
		} else if (def.type === 'readonly') {
			updateConstraint(def.innerType, data, name);
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
								};
								if (!preserveBranchSpecificRequired) {
									result[name].required = false;
								}
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
			const { minimum, maximum, patterns } = summarizeChecks(schema);
			if (minimum !== undefined) {
				constraint.minLength = minimum;
			}
			if (maximum !== undefined) {
				constraint.maxLength = maximum;
			}
			if (patterns.size > 0) {
				const pattern = serializeHtmlPattern([...patterns.values()]);
				if (pattern) {
					constraint.pattern = pattern;
				}
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
			const { minimum, maximum } = summarizeChecks(schema);
			if (minimum !== undefined) {
				constraint.min = minimum;
			}
			if (maximum !== undefined) {
				constraint.max = maximum;
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
			const { mime } = summarizeChecks(schema);
			// An empty intersection would render `accept=""`, which allows any file
			if (mime && mime.length > 0) {
				constraint.accept = mime.join();
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
