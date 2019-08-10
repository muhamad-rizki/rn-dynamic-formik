import React from 'react';
import DynamicForm from './DynamicFormContext';

export default function withDynamicForm(Component) {
  return function DynamicFormComponent(props) {
    return (
      <DynamicForm.Consumer>
        {
          contexts => (
            <Component {...props} {...contexts} />
          )
        }
      </DynamicForm.Consumer>
    );
  };
}
