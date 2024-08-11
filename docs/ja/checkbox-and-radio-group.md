# チェックボックスとラジオグループ

チェックボックスやラジオグループの設定も、他の標準的な input と変わりません。

## ラジオグループ

ラジオグループを設定するには、すべての入力で **name** 属性が同じであることを確認してください。また、フィールドメタデータから initialValue を使用して、ラジオボタンがチェックされるべきかを導き出すこともできます。yup および zod からのエラーは、対応するパスに基づいてマッピングされ、各選択のエラーは、配列自体（例： `answers` ）ではなく、対応するインデックス（例： `answer[0]` ）にマッピングされます。すべてのエラーを表示したい場合は、フィールドメタデータの **allErrors** プロパティを代わりに使用することを検討できます。

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <fieldset>
        <legend>Please select your favorite color</legend>
        {['red', 'green', 'blue'].map((value) => (
          <div key={value}>
            <label>{value}</label>
            <input
              type="radio"
              name={fields.color.name}
              value={value}
              defaultChecked={fields.color.initialValue === value}
            />
          </div>
        ))}
        <div>{fields.color.errors}</div>
      </fieldset>
      <button>Submit</button>
    </form>
  );
}
```

## チェックボックス

チェックボックスグループの設定は、ラジオグループと似ていますが、チェックボックスがブール値なのかグループなのかについてサーバーサイドで情報が不足しているため、 initialValue は文字列または配列のいずれかになります。以下に示すように、 initialValue から **defaultChecked** 値を導出できます。

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <fieldset>
        <legend>Please select the correct answers</legend>
        {['a', 'b', 'c', 'd'].map((value) => (
          <div key={value}>
            <label>{value}</label>
            <input
              type="checkbox"
              name={fields.answer.name}
              value={value}
              defaultChecked={
                fields.answer.initialValue &&
                Array.isArray(fields.answer.initialValue)
                  ? fields.answer.initialValue.includes(value)
                  : fields.answer.initialValue === value
              }
            />
          </div>
        ))}
        <div>{fields.answer.errors}</div>
      </fieldset>
      <button>Submit</button>
    </form>
  );
}
```

ただし、単一のチェックボックスの場合は、ブラウザによってデフォルトで **on** に設定されている入力 **value** と initialValue が一致するかどうかを確認できます。

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <div>
        <label>Terms and conditions</label>
        <input
          name={fields.toc}
          defaultChecked={fields.toc.initialValue === 'on'}
        />
        <div>{fields.toc.errors}</div>
      </div>
      <button>Submit</button>
    </form>
  );
}
```
