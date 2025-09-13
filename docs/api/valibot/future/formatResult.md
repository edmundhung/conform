# formatResult

> The `formatResult` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A helper that transforms Valibot validation results into Conform's error format for form handling.

```ts
import { formatResult } from '@conform-to/valibot/future';

const error = formatResult(result);
```

## Parameters

### `result: SafeParseResult<GenericSchema | GenericSchemaAsync>`

The Valibot validation result to be formatted. This should be the result from `v.safeParse()`.

### `options.includeValue?: boolean`

Optional. Set to `true` if you want both the error and the parsed value returned in an object. This is useful when you are parsing the form value manually and still want to access the parsed value in the `onSubmit` handler on the `useForm` hook.

### `options.formatIssues?: (issue: BaseIssue<unknown>[], name: string) => ErrorShape[]`

Optional. A function to customize how valibot issues are formatted for each field. This is particularly useful if you want to include additional information from the `BaseIssue` object in the error messages, or if you need to support internationalization.

```ts
const error = formatResult(result, {
  formatIssues: (issues, name) => {
    return issues.map((issue) => ({
      message: issue.message,
      expected: issue.expected,
      path: issue.path,
    }));
  },
});
```

## Returns

It returns the formatted error object by default:

```ts
FormError<string> | null;
```

If `includeValue` is set to `true`, it returns an object containing both the error and the parsed value instead:

```ts
{
  error: FormError<string> | null;
  value: (SafeParseResult < Schema > ['output']) | undefined;
}
```

## Example

### Format Valibot validation result on the server

```ts
import { formatResult } from '@conform-to/valibot/future';
import { parseSubmission } from '@conform-to/react/future';
import * as v from 'valibot';

const schema = z.object({
  email: v.pipe(z.string(), v.email()),
  age: v.pipe(z.number(), v.minValue(18)),
  terms: v.pipe(
    v.boolean(),
    v.check((val) => val === true),
  ),
});

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parseSubmission(formData);
  const result = schema.safeParse(submission.payload);

  if (!result.success) {
    return {
      result: report(submission, {
        error: formatResult(result),
      }),
    };
  }

  // Submission succeeded, process the parsed value with `result.data`
}
```

## Tips

### Customize error shapes

The `useForm` hook offers built-in support of standard schema through the `schema` option. However, if you need to customize the error shapes, you will need to use the `onValidate` option instead and format the result manually with `formatResult`.

```ts
import { useForm } from '@conform-to/react/future';
import { formatResult } from '@conform-to/valibot/future';
import * as v from 'valibot';

const schema = v.object({
  // ...
});

function Example() {
  const { form, fields } = useForm({
    onValidate({ payload }) {
      const result = schema.safeParse(payload);
      return formatResult(result, {
        includeValue: true,
        formatIssues(issues, name) {
          return issues.map(
            (issue) => `Field "${name}" is invalid: ${issue.message}`,
          );
        },
      });
    },
    onSubmit(event, { value }) {
      event.preventDefault();

      // This is called only if there are no validation errors with the parsed `value`.
      // It will throw if no value is included in the onValidate return value.
    },
  });

  // ...
}
```
