import {
	type Constraint,
	type FieldsetElement,
	type Schema,
	type Submission,
	type FieldsetData,
	parse as baseParse,
	transform,
	getName,
	getFieldElements,
} from '@conform-to/dom';
import * as z from 'zod';

function inferConstraint<T>(schema: z.ZodType<T>): Constraint {
	const constraint: Constraint = {
		required: true,
	};

	if (schema instanceof z.ZodEffects) {
		return inferConstraint(schema.innerType());
	} else if (schema instanceof z.ZodOptional) {
		return {
			...inferConstraint(schema.unwrap()),
			required: false,
		};
	} else if (schema instanceof z.ZodDefault) {
		return {
			...inferConstraint(schema.removeDefault()),
			required: false,
		};
	} else if (schema instanceof z.ZodArray) {
		return {
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

	return constraint;
}

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

function createParser<T>(schema: z.ZodType<T>): (data: unknown) => unknown {
	if (
		schema instanceof z.ZodString ||
		schema instanceof z.ZodEnum ||
		schema instanceof z.ZodNumber ||
		schema instanceof z.ZodDate ||
		schema instanceof z.ZodBoolean
	) {
		return (value) => {
			if (value === '') {
				return;
			}

			return value;
		};
	} else if (schema instanceof z.ZodDefault) {
		const def = schema.removeDefault();
		const parse = createParser(def);

		return parse;
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

export function parse<T extends Record<string, unknown>>(
	payload: FormData | URLSearchParams,
	schema: z.ZodType<T>,
): Submission<T> {
	const parse = createParser(schema);
	const submission = baseParse(payload);
	const value = parse(submission.form.value);
	const result = schema.safeParse(value);

	if (submission.state === 'modified') {
		return {
			state: 'modified',
			// @ts-expect-error
			form: submission.form,
		};
	}

	if (result.success) {
		return {
			state: 'accepted',
			data: result.data,
			// @ts-expect-error
			form: submission.form,
		};
	} else {
		return {
			state: 'rejected',
			// @ts-expect-error
			form: {
				...submission.form,
				error: {
					...submission.form.error,
					...formatError(result.error),
				},
			},
		};
	}
}

export function resolve<T extends Record<string, any>>(
	schema: z.ZodType<T>,
): Schema<T> {
	const parse = createParser(schema);
	const shape = getSchemaShape(schema);

	if (!shape) {
		throw new Error(
			'Unknown schema provided; The schema must have an object shape',
		);
	}

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
