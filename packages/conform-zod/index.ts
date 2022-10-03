import {
	type FieldConstraint,
	type FieldsetConstraint,
	type Schema,
	type Submission,
	createSubmission,
	getFormData,
	getName,
	setFormError,
} from '@conform-to/dom';
import * as z from 'zod';

function cleanup(data: unknown): unknown {
	if (
		typeof data === 'string' ||
		typeof data === 'undefined' ||
		data instanceof File
	) {
		return data !== '' ? data : undefined;
	} else if (Array.isArray(data)) {
		return data.map((item) => cleanup(item));
	} else if (data !== null && typeof data === 'object') {
		let result: Record<string, unknown> = {};

		for (let [key, value] of Object.entries(data)) {
			result[key] = cleanup(value);
		}

		return result;
	} else {
		throw new Error('Invalid data');
	}
}

function formatError<Schema>(
	zodError: z.ZodError<Schema>,
): Array<[string, string]> {
	return zodError.errors.map<[string, string]>((e) => [
		getName(e.path),
		e.message,
	]);
}

function inferConstraint<T>(schema: z.ZodType<T>): FieldConstraint {
	let constraint: FieldConstraint = {};

	if (schema instanceof z.ZodEffects) {
		constraint = {
			...inferConstraint(schema.innerType()),
		};
	} else if (schema instanceof z.ZodOptional) {
		constraint = {
			...inferConstraint(schema.unwrap()),
			required: false,
		};
	} else if (schema instanceof z.ZodDefault) {
		constraint = {
			...inferConstraint(schema.removeDefault()),
			required: false,
		};
	} else if (schema instanceof z.ZodArray) {
		constraint = {
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

	if (typeof constraint.required === 'undefined') {
		constraint.required = true;
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

export function resolve<Source extends z.ZodTypeAny>(
	source: Source,
): Schema<z.infer<Source>, Source> {
	return {
		source,
		constraint: new Proxy(
			{},
			{
				get(_target, key) {
					if (typeof key !== 'string') {
						return;
					}

					const shape = getSchemaShape(source);
					const schema = shape?.[key];

					if (!schema) {
						return {};
					}

					return inferConstraint(schema);
				},
			},
		) as FieldsetConstraint<z.infer<Source>>,
		validate(form, submitter) {
			const payload = getFormData(form, submitter);
			const submission = createSubmission(payload);
			const value = cleanup(submission.form.value);
			const result = source.safeParse(value);
			const errors = !result.success
				? result.error.errors.map<[string, string]>((e) => [
						getName(e.path),
						e.message,
				  ])
				: [];

			setFormError(form, errors);
		},
		parse(payload): Submission<z.infer<Source>> {
			const submission = createSubmission(payload);

			if (submission.state !== 'accepted') {
				return submission;
			}

			const value = cleanup(submission.form.value);
			const result = source.safeParse(value);

			if (result.success) {
				return {
					state: 'accepted',
					data: result.data,
					form: submission.form,
				};
			} else {
				return {
					state: 'rejected',
					form: {
						// @ts-expect-error
						value: submission.form.value,
						error: formatError(result.error),
					},
				};
			}
		},
	};
}

export function ifNonEmptyString(
	fn: (value: string) => unknown,
): (value: unknown) => unknown {
	return (value: unknown) => {
		if (typeof value !== 'string') {
			return value;
		}

		if (value === '') {
			return undefined;
		}

		return fn(value);
	};
}
