



const blessed = require('blessed')
const contrib = require('blessed-contrib')



import { List } from 'immutable';

 
import React, {Component} from 'react';
import blessed from 'blessed';
import {
  render,
  box
} from 'react-blessed';
import { Blockchain, ContractEventEmitted, ContractFunctionCalled } from '../blockchain';




export class App extends Component {
  state = {
    logs: List()
  }

  componentDidMount() {
    // @ts-ignore
    let { chain } = this.props;

    // chain.events.on('event', (ev: ContractEventEmitted) => {
    //   console.log(ev)
    //   this.setState({
    //     logs: this.state.logs.push(
    //       [ ev.name, `${ev.evname}(${ev.ev.args.join(',')})` ]
    //     )
    //   })
    // });

    // chain.events.on('call', (ev: ContractFunctionCalled) => {
    //   this.setState({
    //     logs: this.state.logs.push(
    //       [ ev.name, `${ev.txdesc.name}(${ev.txdesc.args.join(',')})` ]
    //     )
    //   })
    // });
    
  }

  

  render() {
    return <box 
        border={{type: 'line'}}
        style={{border: {fg: 'blue'}}}>
        
        <listtable 
          pad={2}
          rows={this.state.logs}
        ></listtable>
      </box>
  }
}