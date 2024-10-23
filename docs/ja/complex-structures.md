# ネストされたオブジェクトと配列

Conform は、 name 属性の命名規則を活用することで、ネストされたオブジェクトと配列の両方をサポートしています。

## 命名規則

Conform は、データ構造を示すために `object.property` および `array[index]` の構文を使用します。これらの表記法は、ネストされた配列に対しても組み合わせることができます。例えば、 `tasks[0].content` のようになります。フォームデータに `['tasks[0].content', 'Hello World']` というエントリがある場合、構築されるオブジェクトは `{ tasks: [{ content: 'Hello World' }] }` になります。

しかし、各フィールドの name 属性を手動で設定する必要はありません。 Conform は常に名前を推測してくれるため、生成された名前を全て使用していれば、より良い型安全性が得られます。

## ネストされたオブジェクト

ネストされたフィールドを設定するには、親フィールドのメタデータから `getFieldset()` メソッドを呼び出し、名前が自動的に推測される各子フィールドにアクセスしてください。

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  address: z.object({
    street: z.string(),
    zipcode: z.string(),
    city: z.string(),
    country: z.string(),
  }),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  const address = fields.address.getFieldset();

  return (
    <form id={form.id}>
      {/* name を `address.street` 、`address.zipcode` などに設定します。 */}
      <input name={address.street.name} />
      <div>{address.street.errors}</div>
      <input name={address.zipcode.name} />
      <div>{address.zipcode.errors}</div>
      <input name={address.city.name} />
      <div>{address.city.errors}</div>
      <input name={address.country.name} />
      <div>{address.country.errors}</div>
    </form>
  );
}
```

## 配列

フィールドのリストを設定する必要がある場合は、親フィールドのメタデータから `getFieldList()` メソッドを呼び出して、名前が自動的に推測される各アイテムフィールドにアクセスできます。リスト内のアイテムを変更したい場合は、 [Intent button](./intent-button.md#insert-remove-and-reorder-intents) ページで説明されているように、 `insert` 、 `remove` 、 `reorder` のインテントも使用できます。

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      notes: z.string(),
    }),
  ),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  const tasks = fields.tasks.getFieldList();

  return (
    <form id={form.id}>
      <ul>
        {tasks.map((task) => (
          <li key={task.key}>
            {/* 名前を `tasks[0]` 、 `tasks[1]` などに設定します。 */}
            <input name={task.name} />
            <div>{task.errors}</div>
          </li>
        ))}
      </ul>
    </form>
  );
}
```

## ネストされた配列

ネストされた配列に対して、 `getFieldset()` と `getFieldList()` の両方を組み合わせて使用することもできます。

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();
  const todos = fields.todos.getFieldList();

  return (
    <form id={form.id}>
      <ul>
        {todos.map((todo) => {
          const todoFields = todo.getFieldset();

          return (
            <li key={todo.key}>
              <input name={todoFields.title.name} />
              <div>{todoFields.title.errors}</div>
              <input name={todoFields.notes.name} />
              <div>{todoFields.notes.errors}</div>
            </li>
          );
        })}
      </ul>
    </form>
  );
}
```
