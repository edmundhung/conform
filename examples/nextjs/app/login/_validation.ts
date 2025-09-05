export function validateLogin(value: Record<string, unknown>) {
	const error: { formErrors: string[]; fieldErrors: Record<string, string[]> } =
		{
			formErrors: [],
			fieldErrors: {},
		};

	if (!value.email) {
		error.fieldErrors.email = ['Email is required'];
	} else if (typeof value.email !== 'string' || !value.email.includes('@')) {
		error.fieldErrors.email = ['Email is invalid'];
	}

	if (!value.password) {
		error.fieldErrors.password = ['Password is required'];
	}

	if (
		error.formErrors.length === 0 &&
		Object.values(error.fieldErrors).every((message) => message.length === 0)
	) {
		return null;
	}

	return error;
}
