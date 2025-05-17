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
  static render(element: MyReactElement, container: HTMLElement | Text) {
    // create dom node
    const dom: HTMLElement | Text =
      element.type == 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(element.type)

    // assig props to node
    const isProperty = (key: string) => key !== 'children'
    Object.keys(element.props)
      .filter(isProperty)
      .forEach((name: string) => {
        const prop: string = element.props[name]
        const domAsAny: any = dom as any
        domAsAny[name] = prop
      })

    // render childrens
    element.props.children.forEach((child: MyReactElement) =>
      MyReact.render(child, dom),
    )

    // append to container
    container.appendChild(dom)
  }

  // create microtasks to not interrupt browser
  static nextUnitOfWork: any = null
  static workLoop(deadline: IdleDeadline) {
    let shouldYield = false
    while (MyReact.nextUnitOfWork && !shouldYield) {
      // perform work
      MyReact.nextUnitOfWork = MyReact.performUnitOfWork(MyReact.nextUnitOfWork)
      // check if we have time to do more work
      shouldYield = deadline.timeRemaining() < 1
    }
    // if we have no more work, schedule the next unit of work
    requestIdleCallback(MyReact.workLoop)
  }
  static performUnitOfWork(nextUnitOfWork: any): any {}
}

requestIdleCallback(MyReact.workLoop)
