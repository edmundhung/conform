# getZodConstraint

Zod スキーマを内省することにより、各フィールドの検証属性を含むオブジェクトを返すヘルパーです。

```tsx
const constraint = getZodConstraint(schema);
```

## パラメータ

### `schema`

イントロスペクトされる zod スキーマ。

## 例

```tsx
import { getZodConstraint } from '@conform-to/zod'; // もしくは、zod/v4かzod/v4-miniを使用する場合は `@conform-to/zod/v4` をインポートします。
import { useForm } from '@conform-to/react';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(5).max(20),
  description: z.string().min(100).max(1000).optional(),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
  });

  // ...
}
```
