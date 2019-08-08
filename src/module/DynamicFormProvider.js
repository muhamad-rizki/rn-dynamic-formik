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
    this.state = {
      formValues: {},
    }
  }

  setFormValues = (key, values) => {
    const { formValues } = this.state;
    const newFormValues = Object.assign({}, formValues);
    newFormValues[key] = values;
    this.setState({ formValues: newFormValues });
  }

  render() {
    const {
      formats,
      schemas,
      templates,
      types,
      children,
    } = this.props;
    const {
      formValues,
    } = this.state;
    return (
      <DynamicFormContext.Provider
        value={{
          formats,
          schemas,
          templates,
          types,
          formValues,
          setFormValues: this.setFormValues,
        }}
      >
        {children}
      </DynamicFormContext.Provider>
    );
  }
}