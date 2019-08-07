import React, { Component } from 'react';
import SimpleForm from './src/examples/SimpleForm';
import DynamicFormProvider from './src/module/DynamicFormProvider';

const simpleform = require('./src/examples/simpleform.json');

export default class App extends Component<Props> {
  render() {
    return (
      <DynamicFormProvider
        schemas={({
          simpleform,
        })}
      >
        <SimpleForm />
      </DynamicFormProvider>
    );
  }
}
