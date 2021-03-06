import React from 'react';
import DynamicForm from './DynamicFormContext';
import TextInput from './templates/TextInput';
import DatePicker from './templates/DatePicker';
import CheckBox from './templates/CheckBox';
import RadioGroup from './templates/RadioGroup';
import DefaultContainer from './templates/DefaultContainer';

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
      schemas: props.schemas,
      currentStep: 0,
    };
  }

  setFormValues = (key, values) => {
    const { formValues } = this.state;
    const newFormValues = Object.assign({}, formValues);
    newFormValues[key] = values;
    this.setState({ formValues: newFormValues });
  }

  updateSchema = (key, currentSchema) => {
    const { schemas } = this.state;
    const newSchemas = JSON.parse(JSON.stringify(schemas));
    newSchemas[key] = currentSchema;
    this.setState({ schemas: newSchemas });
  }

  setCurrentStep = (currentStep, callback) => this.setState({ currentStep }, callback);

  render() {
    const {
      formats,
      templates,
      types,
      children,
    } = this.props;
    const {
      formValues,
      schemas,
      currentStep,
    } = this.state;
    return (
      <DynamicForm.Provider
        value={{
          formats,
          schemas,
          templates: {
            TextInput,
            DatePicker,
            CheckBox,
            RadioGroup,
            DefaultContainer,
            ...templates,
          },
          types,
          formValues,
          setFormValues: this.setFormValues,
          updateSchema: this.updateSchema,
          currentStep,
          setCurrentStep: this.setCurrentStep,
        }}
      >
        {children}
      </DynamicForm.Provider>
    );
  }
}
