import type { Constraint, FieldsetElement, Schema } from '@conform-to/dom';
import { unflatten, getName, isFieldElement } from '@conform-to/dom';
import * as z from 'zod';

function createFormDataParser<T extends z.ZodType<any>>(
	schema: T,
): (data: unknown) => unknown {
	if (schema instanceof z.ZodString || schema instanceof z.ZodEnum) {
		return (value) => {
			if (typeof value !== 'string' || value === '') {
				return;
			}

			return value;
		};
	} else if (schema instanceof z.ZodNumber) {
		return (value) => {
			if (typeof value !== 'string' || value === '') {
				return;
			}

			const number = Number(value);

			if (Number.isNaN(number)) {
				return;
			}

			return number;
		};
	} else if (schema instanceof z.ZodDate) {
		return (value) => {
			if (typeof value !== 'string' || value === '') {
				return;
			}

			return new Date(value);
		};
	} else if (schema instanceof z.ZodBoolean) {
		return (value) => {
			if (typeof value !== 'string' || value === '') {
				return;
			}

			return value === 'on';
		};
	} else if (schema instanceof z.ZodArray) {
		const parse = createFormDataParser(schema.element);

		return (value) => {
			if (typeof value !== 'string' || value === '') {
				return;
			}

			if (!Array.isArray(value)) {
				return;
			}

			return value.map(parse);
		};
	} else if (schema instanceof z.ZodObject) {
		const shape: Record<string, (value: unknown) => unknown> = {};

		for (let [key, def] of Object.entries(schema.shape)) {
			// @ts-expect-error
			shape[key] = createFormDataParser(def);
		}

		return (value) => {
			if (typeof value !== 'object') {
				return;
			}

			const object = Object(value);
			const result: Record<string, unknown> = {};

			for (let [key, parse] of Object.entries(shape)) {
				const item = parse(object[key]);

				if (typeof item !== 'undefined') {
					result[key] = item;
				}
			}

			return result;
		};
	}

	throw new Error(`
		Unsupported zod type provided; Please raise an issue explaining your usecase
	`);
}

function getFieldConstraint<T>(schema: z.ZodType<T>): Constraint<T> {
	let def = schema;

	// @ts-expect-error
	const constraint: Constraint = {
		required: !def.isOptional(),
	};

	if (schema instanceof z.ZodArray) {
		constraint.multiple = true;
		def = schema.element;
	}

	if (schema instanceof z.ZodString) {
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
				case 'multipleOf':
					if (!constraint.step) {
						constraint.step = check.value;
					}
					break;
			}
		}
	}

	return constraint;
}

export function parse<T extends Record<string, any>>(
	entries: Array<[string, string]>,
	schema: z.ZodObject<T>,
): {
	value: T | null;
	error: Record<string, string> | null;
} {
	const parse = createFormDataParser(schema);
	const data = unflatten(entries);
	const value = parse(data);
	const result = schema.safeParse(value);

	if (!result.success) {
		return {
			value: null,
			error: unflatten(
				result.error.errors.map((e) => [getName(e.path), e.message]),
			),
		};
	}

	return {
		value: result.data,
		error: null,
	};
}

export function createFieldset<T>(schema: z.ZodObject<T>): Schema<T> {
	const parse = createFormDataParser(schema);

	return {
		// @ts-expect-error
		constraint: Object.fromEntries(
			Object.entries(schema.shape).map<[string, Constraint<any>]>(
				([key, def]) => [key, getFieldConstraint(def)],
			),
		),
		validate(fieldset: FieldsetElement, options: { name?: string } = {}) {
			const formData = new FormData(fieldset.form);
			const entries = Array.from(formData.entries()).reduce<
				Array<[string, string]>
			>((result, [key, value]) => {
				if (!options.name || key.startsWith(`${options.name}.`)) {
					result.push([
						key.slice(options.name ? options.name.length + 1 : 0),
						value.toString(),
					]);
				}

				return result;
			}, []);
			const data = unflatten(entries);
			const value = parse(data);
			const result = schema.safeParse(value);
			const errors = !result.success ? result.error.errors : [];

			for (const key of Object.keys(schema.shape)) {
				const name = options.name ? getName([options.name, key]) : key;
				const item = fieldset.elements.namedItem(name);
				const nodes =
					item instanceof RadioNodeList
						? Array.from(item)
						: item !== null
						? [item]
						: [];

				for (const node of nodes) {
					if (!isFieldElement(node)) {
						console.warn(
							`Unexpected element with key "${key}"; Received`,
							node,
						);
						continue;
					}

					node.setCustomValidity(
						errors.find((e) => name === getName(e.path))?.message ?? '',
					);
				}
			}
		},
	};
}
