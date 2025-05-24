# getValibotConstraint

Valibot スキーマを内省することにより、各フィールドの検証属性を含むオブジェクトを返すヘルパーです。

```tsx
const constraint = getValibotConstraint(schema);
```

## Parameters

### `schema`

イントロスペクトされる valibot スキーマ。

## Example

```tsx
import { getValibotConstraint } from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { object, pipe, string, minLength, optional } from 'valibot';

const schema = object({
  title: pipe(string(), minLength(5), maxLength(20)),
  description: optional(pipe(string(), minLength(100), maxLength(1000))),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getValibotConstraint(schema),
  });

  // ...
}
```
