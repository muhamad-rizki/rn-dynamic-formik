import React from 'react';
import DynamicFormContext from './DynamicFormContext';

export type DynamicFormProviderProps = ({
  formats: Object,
  schemas: Object,
  templates: Object,
  types: Object,
});

export default class DynamicFormProvider extends React.Component<DynamicFormProviderProps> {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      formats,
      schemas,
      templates,
      types,
      children,
    } = this.props;
    return (
      <DynamicFormContext.Provider
        value={{
          formats,
          schemas,
          templates,
          types,
        }}
      >
        {children}
      </DynamicFormContext.Provider>
    );
  }
}