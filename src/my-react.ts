export interface MyReactElement {
  type: string | Function | null
  props: {
    [key: string]: any
    children: MyReactElement[]
  }
}

class Logger {
  private name: string
  constructor(name: string) {
    this.name = name
  }
  debug(text: string) {
    console.log(`DEBUG ${this.name} ${text}`)
  }
}

const logger: Logger = new Logger('/src/my-react.ts')

export interface Hook<T> {
  state: T
  queue: any[]
}

export interface NextUnitOfWork extends MyReactElement {
  dom: HTMLElement | Text | null
  parent: NextUnitOfWork | null
  sibling: NextUnitOfWork | null
  child: NextUnitOfWork | null
  alternate: NextUnitOfWork | null
  effectTag: string | null
  hooks: any[]
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
  static useState<T>(initial: T): [T, (state: (state: T) => T) => void] {
    const oldHook: Hook<T> | null =
      MyReactDOM.wipFiber?.alternate &&
      MyReactDOM.wipFiber.alternate.hooks &&
      MyReactDOM.wipFiber.alternate.hooks[MyReactDOM.hookIndex || 0]

    const hook: Hook<T> = {
      state: oldHook ? oldHook.state : initial,
      queue: [],
    }

    const actions: ((oldState: T) => T)[] = oldHook ? oldHook.queue : []
    actions.forEach((action: (oldState: T) => T) => {
      hook.state = action(hook.state)
    })

    const setState = (action: (oldState: T) => T): void => {
      logger.debug('calling setState')
      hook.queue.push(action)
      MyReactDOM.wipRoot = {
        dom: MyReactDOM.currentRoot!.dom,
        props: MyReactDOM.currentRoot!.props,
        alternate: MyReactDOM.currentRoot,
        parent: null,
        sibling: null,
        child: null,
        effectTag: null,
        type: null,
        hooks: [],
      }
      MyReactDOM.nextUnitOfWork = MyReactDOM.wipRoot
      MyReactDOM.deletions = []
    }

    if (MyReactDOM.wipFiber) {
      MyReactDOM.wipFiber.hooks.push(hook)
    }
    if (MyReactDOM.hookIndex) {
      MyReactDOM.hookIndex += 1
    }
    return [hook.state, setState]
  }
}
export class MyReactDOM {
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
    MyReactDOM.deletions.forEach(MyReactDOM.commitWork)
    MyReactDOM.commitWork(MyReactDOM.wipRoot?.child || null)
    MyReactDOM.currentRoot = MyReactDOM.wipRoot
    MyReactDOM.wipRoot = null
  }
  static isProperty = (key: string) =>
    key !== 'children' && !MyReactDOM.isEvent(key)
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
      .filter(MyReactDOM.isEvent)
      .filter(
        (key) =>
          !(key in nextProps) || MyReactDOM.isNew(prevProps, nextProps)(key),
      )
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2)
        dom.removeEventListener(eventType, prevProps[name])
      })

    // Remove old properties
    Object.keys(prevProps)
      .filter(MyReactDOM.isProperty)
      .filter(MyReactDOM.isGone(prevProps, nextProps))
      .forEach((name) => {
        const domAsAny: any = dom as any
        domAsAny[name] = ''
      })
    // Set new or changed properties
    Object.keys(nextProps)
      .filter(MyReactDOM.isProperty)
      .filter(MyReactDOM.isNew(prevProps, nextProps))
      .forEach((name) => {
        const domAsAny: any = dom as any
        domAsAny[name] = nextProps[name]
      })

    // Add event listeners
    Object.keys(nextProps)
      .filter(MyReactDOM.isEvent)
      .filter(MyReactDOM.isNew(prevProps, nextProps))
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
      MyReactDOM.updateDom(fiber.dom, fiber.alternate?.props || {}, fiber.props)
    } else if (fiber.effectTag === 'DELETION') {
      MyReactDOM.commitDeletion(fiber, domParent)
    }

    MyReactDOM.commitWork(fiber.child)
    MyReactDOM.commitWork(fiber.sibling)
  }
  static commitDeletion(fiber: NextUnitOfWork, domParent: HTMLElement | Text) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom)
    } else {
      if (!fiber.child) {
        throw new Error('No child found')
      }
      MyReactDOM.commitDeletion(fiber.child, domParent)
    }
  }
  static render(element: MyReactElement, container: HTMLElement | Text) {
    MyReactDOM.wipRoot = {
      dom: container,
      type: null,
      parent: null,
      sibling: null,
      child: null,
      alternate: MyReactDOM.currentRoot,
      props: {
        children: [element],
      },
      effectTag: null,
      hooks: [],
    }

    MyReactDOM.deletions = []

    // define next unit of work
    MyReactDOM.nextUnitOfWork = MyReactDOM.wipRoot
  }

  // create microtasks to not interrupt browser
  static nextUnitOfWork: NextUnitOfWork | null = null
  static wipRoot: NextUnitOfWork | null = null
  static currentRoot: NextUnitOfWork | null = null
  static deletions: NextUnitOfWork[] = []
  static workLoop(deadline: IdleDeadline) {
    let shouldYield = false
    while (MyReactDOM.nextUnitOfWork && !shouldYield) {
      // perform work
      MyReactDOM.nextUnitOfWork = MyReactDOM.performUnitOfWork(
        MyReactDOM.nextUnitOfWork,
      )
      // check if we have time to do more work
      shouldYield = deadline.timeRemaining() < 1
    }

    if (!MyReactDOM.nextUnitOfWork && MyReactDOM.wipRoot) {
      MyReactDOM.commitRoot()
    }

    // if we have no more work, schedule the next unit of work
    requestIdleCallback(MyReactDOM.workLoop)
  }
  static wipFiber: NextUnitOfWork | null = null
  static hookIndex: number | null = null
  static updateFunctionComponent(fiber: NextUnitOfWork) {
    MyReactDOM.wipFiber = fiber
    MyReactDOM.hookIndex = 0
    MyReactDOM.wipFiber.hooks = []

    const functionComponent: Function = fiber.type as Function
    const children: MyReactElement = functionComponent(fiber.props)
    const childrens: MyReactElement[] = [children]
    MyReactDOM.reconcileChildren(fiber, childrens)
  }
  static updateHostComponent(fiber: NextUnitOfWork) {
    // add dom node
    if (!fiber.dom) {
      fiber.dom = MyReactDOM.createDom(fiber)
    }

    // create new fibers
    MyReactDOM.reconcileChildren(fiber, fiber.props.children)
  }
  static performUnitOfWork(nextUnitOfWork: NextUnitOfWork): any {
    const isFunctionComponent: boolean = nextUnitOfWork.type instanceof Function
    if (isFunctionComponent) {
      logger.debug(
        `performUnitOfWork ${(nextUnitOfWork.type as Function).name}`,
      )
      MyReactDOM.updateFunctionComponent(nextUnitOfWork)
    } else {
      logger.debug(`performUnitOfWork ${nextUnitOfWork.type}`)
      MyReactDOM.updateHostComponent(nextUnitOfWork)
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
          hooks: [],
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
          hooks: [],
        }
      }
      if (oldFiber && !sameType) {
        // delete the oldFiber's node
        oldFiber.effectTag = 'DELETION'
        MyReactDOM.deletions.push(oldFiber)
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

requestIdleCallback(MyReactDOM.workLoop)
