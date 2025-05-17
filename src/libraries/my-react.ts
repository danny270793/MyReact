export class MyReact {
  static createElement(type: string, props: any = null, ...children: any) {
    return {
      type,
      props: {
        ...props,
        children: children.map((child: any) =>
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
}
