import { MyReact, type MyReactElement } from './my-react'

const element: HTMLElement | null = document.getElementById('app')
if (!element) {
  throw new Error('No root element found')
}

const app: MyReactElement = MyReact.createElement(
  'div',
  { className: 'w3-row' },
  MyReact.createElement('div', { className: 'w3-half w3-green' }, 'bar'),
  MyReact.createElement('div', { className: 'w3-half w3-blue' }, 'baz'),
)
MyReact.render(app, element)
