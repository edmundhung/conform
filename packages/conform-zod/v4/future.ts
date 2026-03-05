import { configureCoercion as baseConfigureCoercion } from './coercion';

/**
 * @deprecated Use `getConstraints` instead.
 */
export { getZodConstraint } from './constraint';
export { formatResult } from './format';
export { isSchema, getConstraints } from './schema';

function defaultDate(text: string): Date {
	const date = new Date(shouldAppendUtcSuffix(text) ? `${text}Z` : text);

	if (isNaN(date.getTime())) {
		throw new Error('Invalid date');
	}

	return date;
}

function shouldAppendUtcSuffix(datetimeString: string): boolean {
	if (datetimeString.includes(' ')) {
		return false;
	}

	const separatorIndex = datetimeString.indexOf('T');

	if (separatorIndex < 0) {
		return false;
	}

	const time = datetimeString.slice(separatorIndex + 1);

	return !(
		time.toUpperCase().endsWith('Z') ||
		time.includes('+') ||
		time.includes('-')
	);
}

export function configureCoercion(
	config?: Parameters<typeof baseConfigureCoercion>[0],
): ReturnType<typeof baseConfigureCoercion> {
	return baseConfigureCoercion({
		...config,
		type: {
			...config?.type,
			date: config?.type?.date ?? defaultDate,
		},
	});
}

export const { coerceFormValue, coerceStructure } = configureCoercion();
