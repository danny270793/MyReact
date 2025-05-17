import { MyReact, MyReactDOM, type MyReactElement } from './libraries/my-react'

const element: HTMLElement | null = document.getElementById('app')
if (!element) {
  throw new Error('No root element found')
}

function Counter(props: { [key: string]: string }): MyReactElement {
  const [counter, setCounter] = MyReact.useState<number>(0)
  return MyReact.createElement(
    'div',
    null,
    MyReact.createElement('h1', null, `${props.title} ${counter}`),
    MyReact.createElement(
      'button',
      {
        className: 'w3-button w3-blue',
        onclick: () => setCounter((counter: number) => counter + 1),
      },
      'Increment',
    ),
    MyReact.createElement(
      'button',
      {
        className: 'w3-button w3-green',
        onclick: () => setCounter((counter: number) => counter - 1),
      },
      'Decrement',
    ),
    MyReact.createElement(
      'button',
      {
        className: 'w3-button w3-red',
        onclick: () => setCounter(() => 0),
      },
      'Reset',
    ),
    MyReact.createElement(
      'div',
      {},
      counter > 10
        ? MyReact.createElement('span', {}, 'High')
        : MyReact.createElement('span', {}, 'Low'),
    ),
  )
}

const app: MyReactElement = MyReact.createElement(Counter, { title: 'Value' })
MyReactDOM.render(app, element)
