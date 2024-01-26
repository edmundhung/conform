# File Upload

To handle file uploads, the form **encType** attribute must be set to `multipart/form-data` and the method must be `POST`.

## Configuration

Setting up a file input is no different from other inputs.

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  profile: z.instanceof(File, { message: 'Profile is required' }),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <form method="POST" encType="multipart/form-data" id={form.id}>
      <div>
        <label>Profile</label>
        <input type="file" name={fields.profile.name} />
        <div>{fields.profile.error}</div>
      </div>
      <button>Upload</button>
    </form>
  );
}
```

## Multiple files

To allow uploading multiple files, you need to set the **multiple** attribute on the file input. It is important to note that the errors on the field metadata might not include all the errors on each file. As the errors from both yup and zod are mapped based on the corresponding paths and the errors of each file will be mapped to its corresponding index, e.g. `files[0]` instead of the array itself, e.g. `files`. If you want to display all the errors, you can consider using the **allErrors** property on the field metadata instead.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  files: z
    .array(
      z
        .instanceof(File)
        .refine((file) => file.size < 1024, 'File size must be less than 1kb'),
    )
    .min(1, 'At least 1 file is required')
    .refine(
      (files) => files.every((file) => file.size < 1024),
      'File size must be less than 1kb',
    ),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <form method="POST" encType="multipart/form-data" id={form.id}>
      <div>
        <label>Mutliple Files</label>
        <input type="file" name={fields.files.name} multiple />
        <div>
          {Object.entries(fields.files.allErrors).flatMap(
            ([, messages]) => messages,
          )}
        </div>
      </div>
      <button>Upload</button>
    </form>
  );
}
```
