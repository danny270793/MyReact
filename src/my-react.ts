export interface MyReactElement {
  type: string | null
  props: {
    [key: string]: any
    children: MyReactElement[]
  }
}

export interface NextUnitOfWork extends MyReactElement {
  dom: HTMLElement | Text | null
  parent: NextUnitOfWork | null
  sibling: NextUnitOfWork | null
  child: NextUnitOfWork | null
  alternate: NextUnitOfWork | null
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
  static createDom(fiber: MyReactElement): HTMLElement | Text {
    // create dom node
    const dom: HTMLElement | Text =
      fiber.type == 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(fiber.type || '')

    // assig props to node
    const isProperty = (key: string) => key !== 'children'
    Object.keys(fiber.props)
      .filter(isProperty)
      .forEach((name: string) => {
        const prop: string = fiber.props[name]
        const domAsAny: any = dom as any
        domAsAny[name] = prop
      })

    return dom
  }
  static commitRoot() {
    MyReact.commitWork(MyReact.wipRoot?.child || null)
    MyReact.currentRoot = MyReact.wipRoot
    MyReact.wipRoot = null
  }
  static commitWork(fiber: NextUnitOfWork | null) {
    if (!fiber) {
      return
    }
    if (!fiber.parent?.dom) {
      throw new Error('No parent dom found')
    }
    const domParent: HTMLElement | Text = fiber.parent.dom
    if (!fiber.dom) {
      throw new Error('No dom found')
    }
    domParent.appendChild(fiber.dom)
    MyReact.commitWork(fiber.child)
    MyReact.commitWork(fiber.sibling)
  }
  static render(element: MyReactElement, container: HTMLElement | Text) {
    MyReact.wipRoot = {
      dom: container,
      type: null,
      parent: null,
      sibling: null,
      child: null,
      alternate: MyReact.currentRoot,
      props: {
        children: [element],
      },
    }

    // define next unit of work
    MyReact.nextUnitOfWork = MyReact.wipRoot
  }

  // create microtasks to not interrupt browser
  static nextUnitOfWork: NextUnitOfWork | null = null
  static wipRoot: NextUnitOfWork | null = null
  static currentRoot: NextUnitOfWork | null = null
  static workLoop(deadline: IdleDeadline) {
    let shouldYield = false
    while (MyReact.nextUnitOfWork && !shouldYield) {
      // perform work
      MyReact.nextUnitOfWork = MyReact.performUnitOfWork(MyReact.nextUnitOfWork)
      // check if we have time to do more work
      shouldYield = deadline.timeRemaining() < 1
    }

    if (!MyReact.nextUnitOfWork && MyReact.wipRoot) {
      MyReact.commitRoot()
    }

    // if we have no more work, schedule the next unit of work
    requestIdleCallback(MyReact.workLoop)
  }
  static performUnitOfWork(nextUnitOfWork: NextUnitOfWork): any {
    // add dom node
    if (!nextUnitOfWork.dom) {
      nextUnitOfWork.dom = MyReact.createDom(nextUnitOfWork)
    }

    // create new fibers
    const elements: MyReactElement[] = nextUnitOfWork.props.children
    MyReact.reconcileChildren(nextUnitOfWork, elements)

    // return next unit of work
    if (nextUnitOfWork.child) {
      return nextUnitOfWork.child
    }
    let nextFiber: NextUnitOfWork | null = nextUnitOfWork
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling
      }
      nextFiber = nextFiber.parent
    }
  }
  static reconcileChildren(
    wipFiber: NextUnitOfWork,
    elements: MyReactElement[],
  ) {
    let index: number = 0
    let prevSibling: NextUnitOfWork | null = null
    while (index < elements.length) {
      const element: MyReactElement = elements[index]
      const newFiber: NextUnitOfWork = {
        type: element.type,
        props: element.props,
        parent: wipFiber,
        dom: null,
        sibling: null,
        child: null,
        alternate: null,
      }

      if (index === 0) {
        wipFiber.child = newFiber
      } else {
        if (!prevSibling) {
          throw new Error('No previous sibling found')
        }
        prevSibling.sibling = newFiber
      }
      prevSibling = newFiber
      index++
    }
  }
}

requestIdleCallback(MyReact.workLoop)
