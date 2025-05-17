import { MyReact, type MyReactElement } from './my-react'

const element: HTMLElement | null = document.getElementById('app')
if (!element) {
  throw new Error('No root element found')
}

const app: MyReactElement = MyReact.createElement(
  'div',
  { id: 'foo' },
  MyReact.createElement('div', { id: 'bar' }, 'bar'),
  MyReact.createElement('div', null, 'baz'),
)
MyReact.render(app, element)
