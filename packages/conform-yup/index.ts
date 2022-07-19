import {
	type Schema,
	type Submission,
	type Constraint,
	type FieldsetElement,
	parse as baseParse,
	transform,
	getFieldElements,
} from '@conform-to/dom';
import * as yup from 'yup';

function formatError(error: yup.ValidationError) {
	return transform(error.inner.map((e) => [e.path ?? '', e.message]));
}

export function parse<T extends yup.AnyObjectSchema>(
	payload: FormData | URLSearchParams,
	schema: T,
): Submission<yup.InferType<T>> {
	const submission = baseParse(payload);
	schema.cast(submission.form.value);

	if (submission.state === 'modified') {
		return {
			state: 'modified',
			form: submission.form,
		};
	}

	try {
		const result = schema.validateSync(submission.form.value, {
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
					...submission.form,
					// @ts-expect-error
					error: formatError(error),
				},
			};
		}

		throw error;
	}
}

export function resolve<T extends yup.AnyObjectSchema>(
	schema: T,
): Schema<yup.InferType<T>> {
	const description = schema.describe();

	return {
		// @ts-expect-error
		fields: Object.fromEntries(
			Object.entries(description.fields).map<[string, Constraint]>(
				([key, def]) => {
					const constraint: Constraint = {};

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

			const description = schema.describe();
			const value = transform(entries);
			const errors: yup.ValidationError[] = [];

			try {
				schema.validateSync(value, {
					abortEarly: false,
				});
			} catch (e) {
				if (e instanceof yup.ValidationError) {
					errors.push(...e.inner);
				} else {
					throw e;
				}
			}

			for (const key of Object.keys(description.fields)) {
				const fields = getFieldElements(fieldset, key);
				const validationMessage =
					errors.find((e) => key === e.path)?.message ?? '';

				for (const field of fields) {
					field.setCustomValidity(validationMessage);
				}
			}
		},
	};
}
