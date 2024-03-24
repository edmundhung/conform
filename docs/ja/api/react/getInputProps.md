# getInputProps

入力要素をアクセシブルにするために必要なすべてのプロパティを返すヘルパーです。

```tsx
const props = getInputProps(meta, options);
```

## 例

```tsx
import { useForm, getInputProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <input {...getInputProps(fields.password, { type: 'password' })} />;
}
```

## オプション

### `type`

入力のタイプです。これは、 **defaultValue** （デフォルト値）または **defaultChecked** （デフォルトでチェックされている状態）が必要かどうかを判断するために使用されます。

### `value`

これは主に、タイプが `checkbox` または `radio` の場合に入力の値を設定するために使用されます。しかし、 **defaultValue** や **defaultChecked** の状態の設定をスキップしたい場合、例えばコントロールされた入力の場合には、 `false` に設定することもできます。

### `ariaAttributes`

結果のプロパティに `aria-invalid` と `aria-describedby` を含めるかどうかを決定します。デフォルトは **true** です。

### `ariaInvalid`

ARIA 属性を `meta.errors` または `meta.allErrors` に基づいて設定するかどうかを決定します。デフォルトは **errors** です。

### `ariaDescribedBy`

`aria-describedby` 属性に追加の **id** を追加します。フィールドのメタデータから `meta.descriptionId` を渡すことができます。

## Tips

### ヘルパーは任意です

このヘルパーは、定型文を減らし、読みやすくするための便利な機能です。入力要素のプロパティを設定するために、常にフィールドのメタデータを直接使用することもできます。

```tsx
// Before
function Example() {
  return (
    <form>
      {/* text input */}
      <input
        key={fields.task.key}
        id={fields.task.id}
        name={fields.task.name}
        form={fields.task.formId}
        defaultValue={fields.task.initialValue}
        aria-invalid={!fields.task.valid || undefined}
        aria-describedby={!fields.task.valid ? fields.task.errorId : undefined}
        required={fields.task.required}
        minLength={fields.task.minLength}
        maxLength={fields.task.maxLength}
        min={fields.task.min}
        max={fields.task.max}
        step={fields.task.step}
        pattern={fields.task.pattern}
        multiple={fields.task.multiple}
      />
      {/* checkbox */}
      <input
        type="checkbox"
        key={fields.completed.key}
        id={fields.completed.id}
        name={fields.completed.name}
        form={fields.completed.formId}
        value="yes"
        defaultChecked={fields.completed.initialValue === 'yes'}
        aria-invalid={!fields.completed.valid || undefined}
        aria-describedby={
          !fields.completed.valid ? fields.completed.errorId : undefined
        }
        required={fields.completed.required}
      />
    </form>
  );
}

// After
function Example() {
  return (
    <form>
      {/* text input */}
      <input {...getInputProps(fields.task, { type: 'text' })} />
      {/* checkbox */}
      <input
        {...getInputProps(fields.completed, {
          type: 'checkbox',
          value: 'yes',
        })}
      />
    </form>
  );
}
```

### 自分のヘルパーを作る

このヘルパーは、ネイティブの入力要素用に設計されています。カスタムコンポーネントを使用する必要がある場合は、自分自身のヘルパーを作成することができます。
