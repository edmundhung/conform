# インテントボタン

送信ボタンがフォームの送信を行う際、それは [submitter](https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent/submitter) として機能し、フォームデータに含まれることになります。

## 送信のインテント

submitter は、インテント(意図)に基づいて異なる振る舞いでフォームを拡張したい場合に特に便利です。

```tsx
import { useForm } from '@conform-to/react';

function Product() {
  const [form] = useForm({
    onSubmit(event, { formData }) {
      event.preventDefault();

      switch (formData.get('intent')) {
        case 'add-to-cart':
          // カートに追加
          break;
        case 'buy-now':
          // 購入
          break;
      }
    },
  });

  return (
    <form id={form.id}>
      <input type="hidden" name="productId" value="rf23g43" />
      <button type="submit" name="intent" value="add-to-cart">
        Add to Cart
      </button>
      <button type="submit" name="intent" value="buy-now">
        Buy now
      </button>
    </form>
  );
}
```

## フォームのコントロール

Conform は、フィールドのバリデーションや削除など、すべてのフォームコントロールに対して送信のインテントを利用します。これは、ボタンに予約された名前を与え、インテントを値としてシリアライズすることで成されます。設定を簡素化するために、 Conform は `form.validate` 、 `form.reset` 、 `form.insert` などの一連のフォームコントロールヘルパーを提供します。

### バリデート インテント

バリデーションをトリガーするには、バリデート インテントを使用してボタンを構成できます。

```tsx
import { useForm } from '@conform-to/react';

function EmailForm() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <input name={fields.email.name} />
      <button {...form.validate.getButtonProps({ name: fields.email.name })}>
        Validate Email
      </button>
    </form>
  );
}
```

ボタンがクリックされると、 Conform は予約された名前でシリアライズされたインテントを識別し、メールフィールドを検証済みとしてマークすることによりバリデーションをトリガーし、メールが無効である場合はエラーメッセージを返します。

しかし、ユーザーがフィールドを離れた時点でバリデーションをトリガーしたい場合は、バリデート インテントを直接トリガーすることもできます。

```tsx
import { useForm } from '@conform-to/react';

function EmailForm() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <input
        name={fields.email.name}
        onBlur={(event) => form.validate({ name: event.target.name })}
      />
    </form>
  );
}
```

### reset および update インテント

**reset** および **update** のインテントを使ってフィールドを変更することもできます。

```tsx
import { useForm } from '@conform-to/react';

export default function Tasks() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <button {...form.reset.getButtonProps()}>Reset form</button>
      <button
        {...form.reset.getButtonProps({
          name: fields.tasks.name,
        })}
      >
        Reset field (including nested / list field)
      </button>
      <button
        {...form.update.getButtonProps({
          name: fields.agenda.name,
          value: {
            title: 'My agenda',
            description: 'This is my agenda',
          },
        })}
      >
        Update field (including nested / list field)
      </button>
      <button
        {...form.update.getButtonProps({
          validated: false,
        })}
      >
        Clear all error
      </button>
    </form>
  );
}
```

両方のインテントを使用するには、フィールドメタデータから **key** を使って入力を設定する必要があります。 Conform はこのキーに依存して、更新された initialValue で input を再マウントするための React への通知を行います。唯一の例外は、 [useInputControl](./api/react/useInputControl.md) フックを使用して制御された入力を設定している場合で、 key が変更されると値がリセットされます。

### insert、remove、および reorder (並び替え) インテント

フィールドリストを操作するには、 **insert** 、 **remove** 、 **reorder** のインテントを使用できます。

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from "@conform-to/zod";
import { z } from "zod";

const todosSchema = z.object({
  title: z.string(),
  tasks: z.array(z.string()),
});

export default function Tasks() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: todosSchema });
    },
    shouldValidate: "onBlur",
  });
  const tasks = fields.tasks.getFieldList();

  return (
    <form id={form.id} onSubmit={form.onSubmit}>
      <ul>
        {tasks.map((task, index) => (
          <li key={task.key}>
            <input name={task.name} />
            <button
              {...form.reorder.getButtonProps({
                name: fields.tasks.name,
                from: index,
                to: 0,
              })}
            >
              Move to top
            </button>
            <button
              {...form.remove.getButtonProps({
                name: fields.tasks.name,
                index,
              })}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button
        {...form.insert.getButtonProps({
          name: fields.tasks.name,
        })}
      >
        Add task
      </button>
      <button>Save</button>
    </form>
  );
}
```
