# File Upload

Conform has support for validating file inputs as well.

<!-- aside -->

## On this page

- Setting up a file input
- Multiple files

<!-- /aside -->

## Setting up a file input

The setup is similar to normal inputs except the **encType** must be set to `multipart/form-data`.

When the browser construct a form data set with an empty file input, a default file entry would be created. To validate if an file input is empty, you should check its filename and size.

```tsx
import { useForm } from '@conform-to/react';
import { validate } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.name !== '' && file.size !== 0, 'File is required'),
});

function Example() {
  const [form, { file }] = useForm({
    validate({ formData }) {
      return validate(formData, schema);
    },
  });

  return (
    <form encType="multipart/form-data" {...form.props}>
      <div>
        <label>File</label>
        <input {...conform.input(file.config, { type: 'file' })} />
        <div>{file.error}</div>
      </div>
      <button>Upload</button>
    </form>
  );
}
```

<details>
<summary>If you are running a Remix app on `node`:</summary>

Currently, there is a [bug](https://github.com/remix-run/web-std-io/pull/28) on **@remix-run/web-fetch** which treats the default file entry as an empty string. If you want to share the same validation across client and server, you can preprocess it with zod like below:

```tsx
const schema = z.object({
  file: z.preprocess(
    // Transform the empty string to a default file entry
    (value) => (value === '' ? new File([], '') : value),
    z
      .instanceof(File)
      .refine(
        (file) => file.name !== '' && file.size !== 0,
        'File is required',
      ),
  ),
});
```

</details>

## Multiple files

There are some caveats when validating a multiple file input:

- Conform will transform the value to an array only when there are more than one entry with the same name. To ensure a consistent data structure, you need to preprocess the data as shown in the snippet.
- Conform is not able to populate indivdiual error of a particular file. Please ensure all error messages is assigned properly, e.g. `files` instead of `files[1]`.

```tsx
import { useForm } from '@conform-to/react';
import { validate } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  files: z
    .preprocess((value) => {
      if (Array.isArray(value)) {
        // No preprocess needed if the value is already an array
        return value;
      } else if (value instanceof File && value.name !== '' && value.size > 0) {
        // Wrap it in an array if the file is valid
        return [value];
      } else {
        // Treat it as empty array otherwise
        return [];
      }
    }, z.instanceof(File).array().min(1, 'At least 1 file is required'))
    .refine(
      (files) => files.reduce((size, file) => size + file.size, 0) < 5 * 1024,
      'Total file size must be less than 5kb',
    ),
});

function Example() {
  const [form, { files }] = useForm({
    validate({ formData }) {
      return validate(formData, schema);
    },
  });

  return (
    <form encType="multipart/form-data" {...form.props}>
      <div>
        <label>Mutliple Files</label>
        <input {...conform.input(files.config, { type: 'file' })} multiple />
        <div>{files.error}</div>
      </div>
      <button>Upload</button>
    </form>
  );
}
```
