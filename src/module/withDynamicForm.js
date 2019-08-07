import React from 'react';
import DynamicFormContext from './DynamicFormContext';

export function withDynamicForm(Component) {
  return function DynamicFormComponent(props) {
    return (
      <DynamicFormContext.Consumer>
        {
          (contexts) => {
            return (
              <Component {...props} {...contexts} />
            );
          }
        }
      </DynamicFormContext.Consumer>
    )
  }
}