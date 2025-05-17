export interface MyReactElement {
  type: string
  props: {
    [key: string]: any
    children: MyReactElement[]
  }
}

export class MyReact {
  static createElement(
    type: string,
    props: { [key: string]: any } | null = null,
    ...children: string[] | MyReactElement[]
  ): MyReactElement {
    return {
      type,
      props: {
        ...props,
        children: children.map((child: string | MyReactElement) =>
          typeof child === 'object' ? child : MyReact.createTextElement(child),
        ),
      },
    }
  }
  static createTextElement(text: string) {
    return {
      type: 'TEXT_ELEMENT',
      props: {
        nodeValue: text,
        children: [],
      },
    }
  }
  static render(element: MyReactElement, container: HTMLElement) {
    const dom: HTMLElement = document.createElement(element.type)
    container.appendChild(dom)
  }
}
