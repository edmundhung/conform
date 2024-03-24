# ファイルのアップロード

ファイルアップロードを扱うには、フォームの **encType** 属性を `multipart/form-data` に設定し、メソッドは `POST` である必要があります。

## 構成

ファイル input の設定は、他の input と何ら変わりません。

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

## 複数のファイル

複数のファイルをアップロードできるようにするには、ファイル入力に **multiple** 属性を設定する必要があります。フィールドメタデータのエラーが各ファイルのすべてのエラーを含んでいない可能性があることに注意することが重要です。 yup および zod からのエラーは、対応するパスに基づいてマッピングされ、各ファイルのエラーは、配列自体（例： `files` ）ではなく、対応するインデックス（例： `files[0]` ）にマッピングされます。すべてのエラーを表示したい場合は、フィールドメタデータの **allErrors** プロパティを代わりに使用することを検討できます。

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
      return parseWithZod(formData, { schema });
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
