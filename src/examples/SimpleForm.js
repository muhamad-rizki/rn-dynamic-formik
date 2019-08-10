import React, { Component } from 'react';
import withDynamicForm from '../module/withDynamicForm';
import QDynamicForm from '../module/QDynamicForm';

class SimpleFormComponent extends Component {
  render() {
    return (
      <QDynamicForm
        schema="simpleform"
        type="wizard"
        staggerField
      />
    );
  }
}

const SimpleForm = withDynamicForm(SimpleFormComponent);

export default SimpleForm;
