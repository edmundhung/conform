import {
	type FieldConstraint,
	type FieldsetConstraint,
	type Submission,
	parse,
} from '@conform-to/dom';
import * as yup from 'yup';

export function getFieldsetConstraint<Source extends yup.AnyObjectSchema>(
	source: Source,
): FieldsetConstraint<yup.InferType<Source>> {
	const description = source.describe();

	return Object.fromEntries(
		Object.entries(description.fields).map<[string, FieldConstraint]>(
			([key, def]) => {
				const constraint: FieldConstraint = {};

				switch (def.type) {
					case 'string': {
						for (const test of def.tests) {
							switch (test.name) {
								case 'required':
									constraint.required = true;
									break;
								case 'min':
									if (
										!constraint.minLength ||
										constraint.minLength < Number(test.params?.min)
									) {
										constraint.minLength = Number(test.params?.min);
									}
									break;
								case 'max':
									if (
										!constraint.maxLength ||
										constraint.maxLength > Number(test.params?.max)
									) {
										constraint.maxLength = Number(test.params?.max);
									}
									break;
								case 'matches':
									if (
										!constraint.pattern &&
										test.params?.regex instanceof RegExp
									) {
										constraint.pattern = test.params.regex.source;
									}
									break;
							}
						}
						if (!constraint.pattern && def.oneOf.length > 0) {
							constraint.pattern = def.oneOf.join('|');
						}
						break;
					}
					case 'number':
						for (const test of def.tests) {
							switch (test.name) {
								case 'required':
									constraint.required = true;
									break;
								case 'min':
									if (
										!constraint.min ||
										constraint.min < Number(test.params?.min)
									) {
										constraint.min = Number(test.params?.min);
									}
									break;
								case 'max':
									if (
										!constraint.max ||
										constraint.max > Number(test.params?.max)
									) {
										constraint.max = Number(test.params?.max);
									}
									break;
							}
						}
						break;
				}

				return [key, constraint];
			},
		),
	) as FieldsetConstraint<yup.InferType<Source>>;
}

export function formatError(
	error: unknown,
	fallbackMessage = 'Oops! Something went wrong.',
): Array<[string, string]> {
	if (error instanceof yup.ValidationError) {
		return error.inner.reduce<Array<[string, string]>>((result, e) => {
			result.push([e.path ?? '', e.message]);

			return result;
		}, []);
	}

	return [['', error instanceof Error ? error.message : fallbackMessage]];
}

export function validate<Schema extends yup.AnyObjectSchema>(
	formData: FormData,
	schema: Schema,
	options: { fallbackMessage?: string } = {},
): Submission<yup.InferType<Schema>> {
	const submission = parse<yup.InferType<Schema>>(formData);

	try {
		schema.validateSync(submission.value, {
			abortEarly: false,
		});
	} catch (error) {
		submission.error.push(...formatError(error, options.fallbackMessage));
	}

	return submission;
}
