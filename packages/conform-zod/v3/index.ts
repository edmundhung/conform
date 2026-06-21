import type { Constraint } from '@conform-to/dom';
import type { ZodTypeAny } from 'zod/v3';
import { getZodConstraint as baseGetZodConstraint } from './constraint';

export function getZodConstraint(
	schema: ZodTypeAny,
): Record<string, Constraint> {
	return baseGetZodConstraint(schema, {
		preserveBranchSpecificRequired: false,
	});
}

export { parseWithZod, conformZodMessage } from './parse';
export { coerceFormValue as unstable_coerceFormValue } from './coercion';
