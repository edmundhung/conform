# getYupConstraint

Yupスキーマをイントロスペクトすることで、各フィールドの検証属性を含むオブジェクトを返すヘルパーです。

```tsx
const constraint = getYupConstraint(schema);
```

## パラメーター

### `schema`

イントロスペクトされるべき Yup スキーマです。

## 例

```tsx
import { getYupConstraint } from '@conform-to/yup';
import { useForm } from '@conform-to/react';
import * as yup from 'yup';

const schema = yup.object({
  title: yup.string().required().min(5).max(20),
  description: yup.string().optional().min(100).max(1000),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getYupConstraint(schema),
  });

  // ...
}
```
