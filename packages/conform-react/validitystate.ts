import { type Submission, parse, isFieldElement } from '@conform-to/dom';

/**
 * Validate the form with the Constraint Validation API
 * @see https://conform.guide/api/react#validateconstraint
 */
export function validateConstraint(options: {
	form: HTMLFormElement;
	formData?: FormData;
}): Submission<
	Record<string, any>,
	{ validity: ValidityState; validationMessage: string }
> {
	const formData = options?.formData ?? new FormData(options.form);

	return parse(formData, {
		resolve(value) {
			const error: Record<
				string,
				{ validity: ValidityState; validationMessage: string }
			> = {};

			for (const element of options.form.elements) {
				if (
					isFieldElement(element) &&
					element.name !== '' &&
					!element.validity.valid
				) {
					error[element.name] = {
						validity: { ...element.validity },
						validationMessage: element.validationMessage,
					};
				}
			}

			if (Object.entries(error).length > 0) {
				return { error };
			}

			return { value };
		},
	});
}
