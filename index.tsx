import { IAugmentedJQuery, IComponentOptions } from 'angular'
import * as React from 'react'
import { bindActionCreators } from 'redux'
import { render, unmountComponentAtNode } from 'react-dom'

export interface INgRedux {
  dispatch(action: any): any
  getState(): any
  subscribe(listener: Function): Function
}

export interface NgReactComponent extends React.ComponentClass {
  data?: (state: any) => {}
  methods?: () => {}
}

export function reangudux(Class: NgReactComponent): IComponentOptions {
  class NgClass<Props extends { [k: string]: any } = {}> {
    public props: Partial<Props> = {} as Partial<Props>

    private reduxUnsubscribe: Function

    constructor(private $element: IAugmentedJQuery, private $ngRedux: INgRedux) {}

    $onInit() {
      this.setActions()
      this.setState()
      this.render()

      this.reduxUnsubscribe = this.$ngRedux.subscribe(() => {
        this.setState()
        this.render()
      })
    }

    render() {
      render(<Class {...this.props} />, this.$element[0])
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

    $onDestroy() {
      this.reduxUnsubscribe()
      unmountComponentAtNode(this.$element[0])
    }
  }

  return {
    controller: NgClass,
  }
}
