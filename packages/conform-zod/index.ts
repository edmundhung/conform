import {
	type FieldConstraint,
	type FieldError,
	type Schema,
	type Submission,
	createSubmission,
	getFormData,
	getName,
	setFormError,
	setValue,
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

function formatError<Schema>(error: z.ZodError<Schema>): FieldError<Schema> {
	const result: FieldError<Schema> = {};

	for (const issue of error.errors) {
		setValue<string>(
			result,
			issue.path.flatMap((path) => ['details', path]).concat('message'),
			(prev) => (prev ? prev : issue.message),
		);
	}

	return result;
}

function inferConstraint<T>(schema: z.ZodType<T>): FieldConstraint {
	const constraint: FieldConstraint = {
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

export function parse<T extends Record<string, unknown>>(
	payload: FormData | URLSearchParams,
	schema: z.ZodType<T>,
): Submission<T> {
	const submission = createSubmission(payload);

	if (submission.state !== 'accepted') {
		// @ts-expect-error
		return submission;
	}

	const value = cleanup(submission.form.value);
	const result = schema.safeParse(value);

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
				error: formatError(result.error),
			},
		};
	}
}

export function resolve<T extends Record<string, any>>(
	schema: z.ZodType<T>,
): Schema<T> {
	const shape = getSchemaShape(schema);

	if (!shape) {
		throw new Error(
			'Unknown schema provided; The schema must have an object shape',
		);
	}

	return {
		// @ts-expect-error
		fields: Object.fromEntries(
			Object.entries(shape).map<[string, FieldConstraint]>(([key, def]) => [
				key,
				inferConstraint(def),
			]),
		),
		validate(
			form: HTMLFormElement,
			submitter?: HTMLInputElement | HTMLButtonElement | null,
		) {
			const payload = getFormData(form, submitter);
			const submission = createSubmission(payload);
			const value = cleanup(submission.form.value);
			const result = schema.safeParse(value);
			const errors = !result.success
				? result.error.errors.map<[string, string]>((e) => [
						getName(e.path),
						e.message,
				  ])
				: [];

			setFormError(form, errors);
		},
	};
}
