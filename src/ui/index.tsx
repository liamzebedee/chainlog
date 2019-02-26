declare global {
    namespace JSX {
       interface IntrinsicElements {
           box: any,
           listtable: any
       }
   }
  }

  import React, {Component} from 'react';


const blessed = require('blessed')
const contrib = require('blessed-contrib')

// Creating our screen
const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    title: 'react-blessed hello world'
});

// Adding a way to quit the program
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

import { App } from './App';
import {
  render,
  box
} from 'react-blessed';
/* @jsx render */

export function renderTerminalUI(state) {
    // Rendering the React app using our screen
    render(<App {...state}/>, screen);
}