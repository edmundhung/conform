import type { Constraint } from '@conform-to/dom';
import type { $ZodType } from 'zod/v4/core';
import { getZodConstraint as baseGetZodConstraint } from './constraint';

export function getZodConstraint(schema: $ZodType): Record<string, Constraint> {
	return baseGetZodConstraint(schema, {
		preserveBranchSpecificRequired: false,
	});
}

export { parseWithZod, conformZodMessage } from './parse';
export { coerceFormValue as unstable_coerceFormValue } from './coercion';
