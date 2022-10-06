import { getError, ifNonEmptyString } from '@conform-to/zod';
import { z } from 'zod';

const formConfig = z.object({
	initialReport: z.enum(['onSubmit', 'onChange', 'onBlur']).optional(),
	defaultValue: z
		.preprocess((value) => (value ? JSON.stringify(value) : undefined), z.any())
		.optional(),
	fallbackNative: z
		.preprocess(
			ifNonEmptyString((value) => value === 'true'),
			z.boolean(),
		)
		.optional(),
	noValidate: z
		.preprocess(
			ifNonEmptyString((value) => value === 'true'),
			z.boolean(),
		)
		.optional(),
	validate: z
		.preprocess(
			ifNonEmptyString((value) => value === 'true'),
			z.boolean(),
		)
		.optional()
		.default(true),
});

export function parseConfig(request: Request) {
	const url = new URL(request.url);
	const query = Object.fromEntries(url.searchParams);
	const result = formConfig.safeParse(query);

	if (!result.success) {
		throw new Error(`Invalid query provided: ${getError(result.error)}`);
	}

	return result.data;
}
