import { MyReact, type MyReactElement } from './my-react'

const element: HTMLElement | null = document.getElementById('app')
if (!element) {
  throw new Error('No root element found')
}

const app: MyReactElement = MyReact.createElement(
  'div',
  { id: 'foo' },
  MyReact.createElement('a', null, 'bar'),
  MyReact.createElement('b'),
)
MyReact.render(app, element)
