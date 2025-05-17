import { MyReact } from './libraries/my-react'

const element = MyReact.createElement(
  'div',
  { id: 'foo' },
  MyReact.createElement('a', null, 'bar'),
  MyReact.createElement('b'),
)
// const container = document.getElementById('root')
console.log(JSON.stringify(element, null, 2))
