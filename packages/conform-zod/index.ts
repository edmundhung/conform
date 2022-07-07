import {
	type Constraint,
	type FieldsetElement,
	type Schema,
	type FormResult,
	type FieldsetData,
	parse as baseParse,
	transform,
	getName,
	getFieldElements,
} from '@conform-to/dom';
import * as z from 'zod';

function inferConstraint<T extends z.ZodTypeAny>(schema: T): Constraint {
	let def = schema;

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
	} else if (schema instanceof z.ZodBoolean) {
		// Making a checkbox required would result in either `true` or undefined
		// It would be simpler to treat undefined or empty string as `false` and
		// make it always optional in the form instead
		constraint.required = false;
	}

	return constraint;
}

function getSchemaShape<T extends Record<string, any>>(
	schema: z.ZodType<T>,
): z.ZodRawShape {
	if (schema instanceof z.ZodObject) {
		return schema.shape;
	}

	if (schema instanceof z.ZodEffects) {
		return getSchemaShape(schema.innerType());
	}

	throw new Error(
		'Unknown schema provided; The schema could be either ZodObject or ZodEffects only',
	);
}

function createParser<T extends z.ZodType<any>>(
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

			return Number(value);
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
			return value === 'on';
		};
	} else if (schema instanceof z.ZodOptional) {
		const def = schema.unwrap();
		const parse = createParser(def);

		return parse;
	} else if (schema instanceof z.ZodEffects) {
		const def = schema.innerType();
		const parse = createParser(def);

		return parse;
	} else if (schema instanceof z.ZodArray) {
		const parse = createParser(schema.element);

		return (value) => {
			if (!Array.isArray(value)) {
				return;
			}

			return value.map(parse);
		};
	} else if (schema instanceof z.ZodObject) {
		const shape: Record<string, (value: unknown) => unknown> = {};

		for (let [key, def] of Object.entries(schema.shape)) {
			// @ts-expect-error
			shape[key] = createParser(def);
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

function formatError<T>(error: z.ZodError<T>): FieldsetData<T, string> {
	return transform(
		error.errors.map((e) => [getName(e.path), e.message]),
	) as FieldsetData<T, string>;
}

export function parse<T>(
	payload: FormData | URLSearchParams,
	schema: z.ZodType<T>,
): FormResult<T> {
	const parse = createParser(schema);
	const formResult = baseParse(payload);
	const value = parse(formResult.value);
	const result = schema.safeParse(value);

	if (formResult.state === 'processed') {
		// @ts-expect-error
		return formResult;
	}

	if (result.success) {
		return {
			state: 'accepted',
			value: result.data,
		};
	} else {
		return {
			state: 'rejected',
			// @ts-expect-error
			value: formResult.value,
			error: formatError(result.error),
		};
	}
}

export function resolve<T extends Record<string, any>>(
	schema: z.ZodType<T>,
): Schema<T> {
	const parse = createParser(schema);
	const shape = getSchemaShape(schema);

	return {
		// @ts-expect-error
		fields: Object.fromEntries(
			Object.entries(shape).map<[string, Constraint]>(([key, def]) => [
				key,
				inferConstraint(def),
			]),
		),
		validate(fieldset: FieldsetElement) {
			const formData = new FormData(fieldset.form);
			const entries = Array.from(formData.entries()).reduce<
				Array<[string, string]>
			>((result, [key, value]) => {
				if (!fieldset.name || key.startsWith(`${fieldset.name}.`)) {
					result.push([
						key.slice(fieldset.name ? fieldset.name.length + 1 : 0),
						value.toString(),
					]);
				}

				return result;
			}, []);
			const data = transform(entries);
			const value = parse(data);
			const result = schema.safeParse(value);
			const errors = !result.success ? result.error.errors : [];

			for (const key of Object.keys(shape)) {
				const fields = getFieldElements(fieldset, key);
				const validationMessage =
					errors.find((e) => key === e.path[0])?.message ?? '';

				for (const field of fields) {
					field.setCustomValidity(validationMessage);
				}
			}
		},
	};
}
