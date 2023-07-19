# File Upload

Conform support validating a file input as well.

<!-- aside -->

## On this page

- [Configuration](#configuration)
- [Multiple files](#multiple-files)

<!-- /aside -->

## Configuration

Setting up a file input is similar to other form controls except the form **encType** attribute must be set to `multipart/form-data`.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  profile: z.instanceof(File, { message: 'Profile is required' }),
});

function Example() {
  const [form, { profile }] = useForm({
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <form encType="multipart/form-data" {...form.props}>
      <div>
        <label>Profile</label>
        <input type="file" name={profile.name} />
        <div>{profile.error}</div>
      </div>
      <button>Upload</button>
    </form>
  );
}
```

## Multiple files

The setup is no different for multiple files input.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  files: z
    .array(
      z
        .instanceof(File)
        // Don't validate individual file. The error below will be ignored.
        .refine((file) => file.size < 1024, 'File size must be less than 1kb'),
    )
    .min(1, 'At least 1 file is required')
    // Instead, please validate it on the array level
    .refine(
      (files) => files.every((file) => file.size < 1024),
      'File size must be less than 1kb',
    ),
});

function Example() {
  const [form, { files }] = useForm({
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <form encType="multipart/form-data" {...form.props}>
      <div>
        <label>Mutliple Files</label>
        <input type="file" name={files.name} multiple />
        <div>{files.error}</div>
      </div>
      <button>Upload</button>
    </form>
  );
}
```
