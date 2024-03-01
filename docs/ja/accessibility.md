# アクセシビリティ

フォームをアクセシブルにするには、各フォーム要素を適切な属性で設定する必要がありますが、 Conform がその手助けをします。

## Aria 属性

アクセシビリティに関しては、通常、異なる要素を関連付けるために一意の ID が必要になる Aria 属性が最初に思い浮かびます。Conformは、必要なすべての ID を生成してくれることで、この点でのサポートを提供します。

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <label htmlFor={fields.message.id}>Message</label>
      <input
        type="text"
        id={fields.message.id}
        name={fields.message.name}
        aria-invalid={!fields.message.valid ? true : undefined}
        aria-describedby={
          !fields.message.valid
            ? `${fields.message.errorId} ${fields.message.descriptionId}`
            : fields.message.descriptionId
        }
      />
      <div id={fields.message.descriptionId}>The message you want to send</div>
      <div id={fields.message.errorId}>{fields.message.errors}</div>
      <button>Send</button>
    </form>
  );
}
```

## バリデーション属性

バリデーション属性も、スクリーンリーダーのヒントを改善するなど、アクセシビリティにおいて重要な役割を果たします。 Conform を使用すると、 zod や yup スキーマからバリデーション属性を導出し、各フィールドのメタデータにそれらを反映させることができます。

```tsx
import { parseWithZod, getZodConstraint } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';

const schema = z.object({
  message: z
    .string()
    .min(10)
    .max(100)
    .regex(/^[A-Za-z0-9 ]{10-100}$/),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <form id={form.id}>
      <input
        type="text"
        name={fields.message.name}
        required={fields.message.required}
        minLength={fields.message.minLength}
        maxLength={fields.message.maxLength}
        pattern={fields.message.pattern}
      />
      <button>Send</button>
    </form>
  );
}
```

## プログレッシブエンハンスメント

プログレッシブエンハンスメントも、一時的なネットワークの問題の影響を最小限に抑えるなど、アクセシビリティを支援します。たとえば、 Conform を使用すると、ページのリフレッシュをまたいでもフォームデータと状態が保持されるように、フィールドリストを操作できます。

```tsx
import { useForm } from '@conform-to/react';

export default function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <ul>
        {tasks.map((task) => (
          <li key={task.key}>
            <input name={task.name} defaultValue={task.initialValue} />
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

## ボイラープレートの削減

上記で述べたすべての属性を設定することは、面倒でエラーが発生しやすい作業です。 Conformは 、関連するすべての属性を導出する一連のヘルパーを提供することで、この作業を支援しようとしています。

> 注意: これらすべてのヘルパーはネイティブ HTML 要素用に設計されています。 react-aria-components や Radix UI のようなカスタム UI コンポーネントを使用している場合、それらの API を通じて既に属性が設定されている可能性があるため、これらのヘルパーが不要になるかもしれません。

- [getFormProps](./api/react/getFormProps.md)
- [getFieldsetProps](./api/react/getFieldsetProps.md)
- [getInputProps](./api/react/getInputProps.md)
- [getSelectProps](./api/react/getSelectProps.md)
- [getTextareaProps](./api/react/getTextareaProps.md)
- [getCollectionProps](./api/react/getButtonProps.md)

以下は、手動設定と比較した場合の例です。ヘルパーについて詳しく知りたい場合は、上記リンクの対応するドキュメントを確認してください。

```tsx
import { parseWithZod, getZodConstraint } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';

const schema = z.object({
  message: z
    .string()
    .min(10)
    .max(100)
    .regex(/^[A-Za-z0-9 ]{10-100}$/),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <form id={form.id}>
      {/* ビフォー */}
      <input
        type="text"
        id={fields.message.id}
        name={fields.message.name}
        required={fields.message.required}
        minLength={fields.message.minLength}
        maxLength={fields.message.maxLength}
        pattern={fields.message.pattern}
        aria-invalid={!fields.message.valid ? true : undefined}
        aria-describedby={
          !fields.message.valid
            ? `${fields.message.errorId} ${fields.message.descriptionId}`
            : fields.message.descriptionId
        }
      />
      {/* アフター */}
      <input
        {...getInputProps(fields.message, {
          type: 'text',
          ariaDescribedBy: fields.message.descriptionId,
        })}
      />
      <button>Send</button>
    </form>
  );
}
```
