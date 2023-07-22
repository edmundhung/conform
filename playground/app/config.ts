import { z } from 'zod';

const formConfig = z.object({
	defaultValue: z.preprocess(
		(value) => (value ? JSON.stringify(value) : undefined),
		z.any(),
	),
	fallbackNative: z.preprocess((value) => value === 'true', z.boolean()),
	noValidate: z.preprocess((value) => value === 'true', z.boolean()),
	validate: z.preprocess(
		(value) => (typeof value === 'string' ? value === 'true' : true),
		z.boolean(),
	),
});

export function parseConfig(request: Request) {
	const url = new URL(request.url);
	const query = Object.fromEntries(url.searchParams);
	const result = formConfig.safeParse(query);

	if (!result.success) {
		throw new Error(`Invalid query provided: ${JSON.stringify(result.error)}`);
	}

	return result.data;
}
