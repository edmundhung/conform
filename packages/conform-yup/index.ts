import {
	type FieldConstraint,
	type FieldsetConstraint,
	type FieldError,
	type Schema,
	type Submission,
	createSubmission,
	getFormData,
	getPaths,
	setFormError,
	setValue,
} from '@conform-to/dom';
import * as yup from 'yup';

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

function formatError<Schema>(error: yup.ValidationError): FieldError<Schema> {
	const result: FieldError<Schema> = {};

	for (const validationError of error.inner) {
		setValue<string>(
			result,
			getPaths(validationError.path).flatMap((path) => ['details', path]).concat('message'),
			(prev) => (prev ? prev : validationError.message),
		);
	}

	return result;
}

export function resolve<Source extends yup.AnyObjectSchema>(
	source: Source,
): Schema<yup.InferType<Source>, Source> {
	const description = source.describe();

	return {
		source,
		constraint: Object.fromEntries(
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
		)  as FieldsetConstraint<yup.InferType<Source>>,
		validate(form, submitter) {
			const payload = getFormData(form, submitter);
			const submission = createSubmission(payload);
			const value = cleanup(submission.form.value);
			const errors: Array<[string, string]> = [];

			try {
				source.validateSync(value, {
					abortEarly: false,
				});
			} catch (e) {
				if (e instanceof yup.ValidationError) {
					errors.push(...e.inner.map<[string, string]>(error => [error.path ?? '', error.message]));
				} else {
					throw e;
				}
			}

			setFormError(form, errors);
		},
		parse(payload): Submission<yup.InferType<Source>> {
			const submission = createSubmission(payload);
			
			if (submission.state !== 'accepted') {
				return submission;
			}

			try {
				const value = cleanup(submission.form.value);
				// source.cast(submission.form.value);
				const result = source.validateSync(value, {
					abortEarly: false,
				});

				return {
					state: 'accepted',
					data: result,
					form: submission.form,
				};
			} catch (error) {
				if (error instanceof yup.ValidationError) {
					return {
						state: 'rejected',
						form: {
							// @ts-expect-error
							value: submission.form.value,
							error: formatError(error),
						},
					};
				}

				throw error;
			}
		}
	};
}
