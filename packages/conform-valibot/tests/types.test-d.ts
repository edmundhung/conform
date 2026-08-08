import type {
	Submission as DomSubmission,
	SubmissionResult as DomSubmissionResult,
} from '@conform-to/dom';
import type { Submission, SubmissionResult } from '@conform-to/valibot';
import { expectTypeOf, test } from 'vitest';

test('submission types', () => {
	type Schema = { name: string };

	expectTypeOf<Submission<Schema>>().toEqualTypeOf<DomSubmission<Schema>>();
	expectTypeOf<SubmissionResult>().toEqualTypeOf<DomSubmissionResult>();
});
