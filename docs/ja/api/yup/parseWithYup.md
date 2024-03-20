# parseWithYup

指定された yup スキーマを使用してフォームデータを解析し、送信内容の概要を返すヘルパーです。

```tsx
const submission = parseWithYup(payload, options);
```

## パラメータ

### `payload`

フォームの送信方法に応じて、 **FormData** オブジェクトまたは **URLSearchParams** オブジェクトのいずれかになります。

### `options`

#### `schema`

Yup スキーマ、または Yup スキーマを返す関数のいずれかです。

#### `async`

**validateSync** の代わりに yup スキーマから **validate** メソッドを使用してフォームデータを解析したい場合は、 **true** に設定してください。

## 例

```tsx
import { parseWithYup } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import * as yup from 'zod';

const schema = yup.object({
  email: yup.string().email(),
  password: yup.string(),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithYup(formData, { schema });
    },
  });

  // ...
}
```
