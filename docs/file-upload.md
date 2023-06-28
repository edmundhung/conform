# File Upload

Conform support validating file input as well.

<!-- row -->

<!-- col -->

## Configuration

Setting up a file input is similar to other form controls except the form **encType** attribute must be set to `multipart/form-data`.

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

<!-- /col -->

<!-- col sticky=true -->

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

<!-- /col -->

<!-- /row -->

---

<!-- row -->

<!-- col -->

## Multiple files

The setup is no different for multiple files input.

<!-- /col -->

<!-- col sticky=true -->

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

<!-- /col -->

<!-- /row -->
