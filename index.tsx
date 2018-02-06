import { IAugmentedJQuery, IComponentOptions } from 'angular'
import * as React from 'react'
import { bindActionCreators } from 'redux'
import { render, unmountComponentAtNode } from 'react-dom'

export interface INgRedux {
  dispatch(action: any): any
  getState(): any
  subscribe(listener: Function): Function
}

export interface NgReactComponent<Props> extends React.ComponentClass<Props> {
  data?: (state: any) => {}
  methods?: () => {}
}

export function reangudux<Props>(
  Class: NgReactComponent<Props>,
  bindingNames: (keyof Props)[] | null = null,
): IComponentOptions {
  const names = bindingNames || (Class.propTypes && Object.keys(Class.propTypes)) || []

  const bindings = names.reduce((obj: any, key) => {
    obj[key] = '<'
    return obj
  }, {})

  class NgClass {
    public props: Partial<Props> = {} as Partial<Props>

    private reduxUnsubscribe: Function

    constructor(private $element: IAugmentedJQuery, private $ngRedux: INgRedux) {}

    $onInit() {
      this.setActions()
      this.setState()
      this.setBoundProps()
      this.render()

      this.reduxUnsubscribe = this.$ngRedux.subscribe(() => {
        this.setState()
        this.render()
      })
    }

    render() {
      render(<Class {...this.props as any} />, this.$element[0])
    }

    setState() {
      if (!Class.data) return
      const state = this.$ngRedux.getState()
      this.props = Object.assign({}, this.props, Class.data(state))
    }

    setActions() {
      if (!Class.methods) return
      const boundActions = bindActionCreators(Class.methods(), this.$ngRedux.dispatch)
      this.props = Object.assign({}, this.props, boundActions)
    }

    setBoundProps() {
      if (!names.length) return
      const boundProps = names.reduce((obj: any, key) => {
        obj[key] = this[key]
        return obj
      }, {})
      this.props = Object.assign({}, this.props, boundProps)
    }

    $onDestroy() {
      this.reduxUnsubscribe()
      unmountComponentAtNode(this.$element[0])
    }
  }

  return {
    bindings,
    controller: NgClass,
  }
}
