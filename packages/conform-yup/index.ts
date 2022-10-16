import { type FieldConstraint, type FieldsetConstraint } from '@conform-to/dom';
import type * as yup from 'yup';

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

export function getError(
	error: yup.ValidationError | null,
	scope?: string[],
): Array<[string, string]> {
	return (
		error?.inner.reduce<Array<[string, string]>>((result, e) => {
			const name = e.path ?? '';

			if (!scope || scope.includes(name)) {
				result.push([name, e.message]);
			}

			return result;
		}, []) ?? []
	);
}
