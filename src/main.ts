const element: HTMLElement | null = document.getElementById('app')
if (!element) {
  throw new Error('No root element found')
}
