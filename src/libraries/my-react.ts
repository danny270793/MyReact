export class MyReact {
  static createElement(type: string, props: any = null, ...children: any) {
    return {
      type,
      props: {
        ...props,
        children,
      },
    }
  }
}
