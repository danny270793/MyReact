export interface MyReactElement {
  type: string | Function | null
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
  effectTag: string | null
}

export class MyReact {
  static createElement(
    type: string | Function,
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
        : fiber.type instanceof Function
          ? // TODO
            document.createTextNode('function')
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
    MyReact.deletions.forEach(MyReact.commitWork)
    MyReact.commitWork(MyReact.wipRoot?.child || null)
    MyReact.currentRoot = MyReact.wipRoot
    MyReact.wipRoot = null
  }
  static isProperty = (key: string) =>
    key !== 'children' && !MyReact.isEvent(key)
  static isNew =
    (prev: { [key: string]: any }, next: { [key: string]: any }) =>
    (key: string) =>
      prev[key] !== next[key]
  static isGone =
    (prev: { [key: string]: any }, next: { [key: string]: any }) =>
    (key: string) =>
      !(key in next)
  static isEvent = (key: string) => key.startsWith('on')
  static updateDom(
    dom: HTMLElement | Text,
    prevProps: { [key: string]: any },
    nextProps: { [key: string]: any },
  ) {
    //Remove old or changed event listeners
    Object.keys(prevProps)
      .filter(MyReact.isEvent)
      .filter(
        (key) =>
          !(key in nextProps) || MyReact.isNew(prevProps, nextProps)(key),
      )
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2)
        dom.removeEventListener(eventType, prevProps[name])
      })

    // Remove old properties
    Object.keys(prevProps)
      .filter(MyReact.isProperty)
      .filter(MyReact.isGone(prevProps, nextProps))
      .forEach((name) => {
        const domAsAny: any = dom as any
        domAsAny[name] = ''
      })
    // Set new or changed properties
    Object.keys(nextProps)
      .filter(MyReact.isProperty)
      .filter(MyReact.isNew(prevProps, nextProps))
      .forEach((name) => {
        const domAsAny: any = dom as any
        domAsAny[name] = nextProps[name]
      })

    // Add event listeners
    Object.keys(nextProps)
      .filter(MyReact.isEvent)
      .filter(MyReact.isNew(prevProps, nextProps))
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2)
        dom.addEventListener(eventType, nextProps[name])
      })
  }
  static commitWork(fiber: NextUnitOfWork | null) {
    if (!fiber) {
      return
    }

    if (!fiber.parent) {
      throw new Error('No parent found')
    }

    let domParentFiber: NextUnitOfWork = fiber.parent

    while (!domParentFiber.dom) {
      if (domParentFiber.parent) {
        domParentFiber = domParentFiber.parent
      }
    }
    const domParent = domParentFiber.dom

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
      domParent.appendChild(fiber.dom)
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
      MyReact.updateDom(fiber.dom, fiber.alternate?.props || {}, fiber.props)
    } else if (fiber.effectTag === 'DELETION') {
      MyReact.commitDeletion(fiber, domParent)
    }

    MyReact.commitWork(fiber.child)
    MyReact.commitWork(fiber.sibling)
  }
  static commitDeletion(fiber: NextUnitOfWork, domParent: HTMLElement | Text) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom)
    } else {
      if (!fiber.child) {
        throw new Error('No child found')
      }
      MyReact.commitDeletion(fiber.child, domParent)
    }
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
      effectTag: null,
    }

    MyReact.deletions = []

    // define next unit of work
    MyReact.nextUnitOfWork = MyReact.wipRoot
  }

  // create microtasks to not interrupt browser
  static nextUnitOfWork: NextUnitOfWork | null = null
  static wipRoot: NextUnitOfWork | null = null
  static currentRoot: NextUnitOfWork | null = null
  static deletions: NextUnitOfWork[] = []
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
  static updateFunctionComponent(fiber: NextUnitOfWork) {
    const functionComponent: Function = fiber.type as Function
    const children: MyReactElement = functionComponent(fiber.props)
    const childrens: MyReactElement[] = [children]
    MyReact.reconcileChildren(fiber, childrens)
  }
  static updateHostComponent(fiber: NextUnitOfWork) {
    // add dom node
    if (!fiber.dom) {
      fiber.dom = MyReact.createDom(fiber)
    }

    // create new fibers
    MyReact.reconcileChildren(fiber, fiber.props.children)
  }
  static performUnitOfWork(nextUnitOfWork: NextUnitOfWork): any {
    console.log(nextUnitOfWork)

    const isFunctionComponent: boolean = nextUnitOfWork.type instanceof Function
    if (isFunctionComponent) {
      MyReact.updateFunctionComponent(nextUnitOfWork)
    } else {
      MyReact.updateHostComponent(nextUnitOfWork)
    }

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
    let oldFiber: NextUnitOfWork | null =
      wipFiber.alternate && wipFiber.alternate.child
    let prevSibling: NextUnitOfWork | null = null
    while (index < elements.length || oldFiber != null) {
      const element: MyReactElement = elements[index]

      let newFiber: NextUnitOfWork | null = null

      const sameType = oldFiber && element && element.type == oldFiber.type
      if (sameType) {
        // update the node
        newFiber = {
          type: oldFiber!.type,
          props: element.props,
          dom: oldFiber!.dom,
          parent: wipFiber,
          alternate: oldFiber,
          effectTag: 'UPDATE',
          sibling: null,
          child: null,
        }
      }
      if (element && !sameType) {
        // add this node
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          parent: wipFiber,
          alternate: null,
          effectTag: 'PLACEMENT',
          sibling: null,
          child: null,
        }
      }
      if (oldFiber && !sameType) {
        // delete the oldFiber's node
        oldFiber.effectTag = 'DELETION'
        MyReact.deletions.push(oldFiber)
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling
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
