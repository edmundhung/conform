# Single-page application (SPA)

Conform works in an SPA as well.

```tsx
import { type SubmissionResult, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';

export function ExampleForm() {
  const [result, setResult] = useState<
    SubmissionResult<string[]> | undefined
  >();
  const [form, fields] = useForm({
    lastResult: result,
    async onSubmit(event, { formData, method, action }) {
      event.preventDefault();

      // Validate on the client
      const submission = parseWithZod(formData, { schema });

      // Update the result if there are any errors
      if (submission.state !== 'success') {
        setResult(submission.reply());
        return;
      }

      // Send the form value to the server
      const response = await fetch(action, {
        method,
        body: JSON.stringify(submission.value),
      });
      const data = await response.json();

      // Update the result if there are any errors from the server
      if (!data.success) {
        setResult(
          submission.reply({
            fieldErrors: data.errors,
          }),
        );
        return;
      }

      // ...
    },
  });

  // ...
}
```
