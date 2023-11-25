import { type Submission, parse, isFieldElement } from '@conform-to/dom';

/**
 * Validate the form with the Constraint Validation API
 * @see https://conform.guide/api/react#validateconstraint
 */
export function validateConstraint(options: {
	form: HTMLFormElement;
	formData?: FormData;
	constraint?: Record<
		Lowercase<string>,
		(
			value: string,
			context: { formData: FormData; attributeValue: string },
		) => boolean
	>;
	formatMessages?: ({
		name,
		validity,
		constraint,
		defaultErrors,
	}: {
		name: string;
		validity: ValidityState;
		constraint: Record<string, boolean>;
		defaultErrors: string[];
	}) => string[];
}): Submission<Record<string, any>> {
	const formData = options?.formData ?? new FormData(options.form);
	const getDefaultErrors = (
		validity: ValidityState,
		result: Record<string, boolean>,
	) => {
		const errors: Array<string> = [];

		if (validity.valueMissing) errors.push('required');
		if (validity.typeMismatch || validity.badInput) errors.push('type');
		if (validity.tooShort) errors.push('minLength');
		if (validity.rangeUnderflow) errors.push('min');
		if (validity.stepMismatch) errors.push('step');
		if (validity.tooLong) errors.push('maxLength');
		if (validity.rangeOverflow) errors.push('max');
		if (validity.patternMismatch) errors.push('pattern');

		for (const [constraintName, valid] of Object.entries(result)) {
			if (!valid) {
				errors.push(constraintName);
			}
		}

		return errors;
	};
	const formatMessages =
		options?.formatMessages ?? (({ defaultErrors }) => defaultErrors);

	return parse(formData, {
		resolve(value) {
			const error: Record<string, string[]> = {};
			const constraintPattern = /^constraint[A-Z][^A-Z]*$/;

			for (const element of options.form.elements) {
				if (isFieldElement(element) && element.name !== '') {
					const constraint = Object.entries(element.dataset).reduce<
						Record<string, boolean>
					>((result, [name, attributeValue = '']) => {
						if (constraintPattern.test(name)) {
							const constraintName = name
								.slice(10)
								.toLowerCase() as Lowercase<string>;
							const validate = options.constraint?.[constraintName];

							if (typeof validate === 'function') {
								result[constraintName] = validate(element.value, {
									formData,
									attributeValue,
								});
							} else {
								// eslint-disable-next-line no-console
								console.warn(
									`Found an "${constraintName}" constraint with undefined definition; Please specify it on the validateConstraint API.`,
								);
							}
						}

						return result;
					}, {});
					const errors = formatMessages({
						name: element.name,
						validity: element.validity,
						constraint,
						defaultErrors: getDefaultErrors(element.validity, constraint),
					});

					if (errors.length > 0) {
						error[element.name] = errors;
					}
				}
			}

			if (Object.entries(error).length > 0) {
				return { error };
			}

			return { value };
		},
	});
}
