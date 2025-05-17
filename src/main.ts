import { MyReact, type MyReactElement } from './my-react'

const element: HTMLElement | null = document.getElementById('app')
if (!element) {
  throw new Error('No root element found')
}

function Counter(props: { [key: string]: string }): MyReactElement {
  let value: number = 0
  setInterval(() => {
    console.log(`increasing to ${value}`)
    value++
  }, 1000)
  return MyReact.createElement(
    'div',
    null,
    MyReact.createElement('h1', null, `${props.title} ${value}`),
    MyReact.createElement(
      'button',
      { className: 'w3-button w3-blue' },
      'Increment',
    ),
    MyReact.createElement(
      'button',
      { className: 'w3-button w3-green' },
      'Decrement',
    ),
    MyReact.createElement('button', { className: 'w3-button w3-red' }, 'Reset'),
  )
}

const app: MyReactElement = MyReact.createElement(Counter, { title: 'Value' })
MyReact.render(app, element)
