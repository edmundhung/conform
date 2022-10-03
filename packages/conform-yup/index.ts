import {
	type FieldConstraint,
	type FieldsetConstraint,
	type Schema,
	type Submission,
	createSubmission,
	getFormData,
	setFormError,
} from '@conform-to/dom';
import * as yup from 'yup';

function formatError(yupError: yup.ValidationError): Array<[string, string]> {
	return yupError.inner.map((error) => [error.path ?? '', error.message]);
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
		) as FieldsetConstraint<yup.InferType<Source>>,
		validate(form, submitter) {
			const payload = getFormData(form, submitter);
			const submission = createSubmission(payload);
			const errors: Array<[string, string]> = [];

			try {
				source.validateSync(submission.form.value, {
					abortEarly: false,
				});
			} catch (e) {
				if (e instanceof yup.ValidationError) {
					errors.push(
						...e.inner.map<[string, string]>((error) => [
							error.path ?? '',
							error.message,
						]),
					);
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
				const result = source.validateSync(submission.form.value, {
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
		},
	};
}
