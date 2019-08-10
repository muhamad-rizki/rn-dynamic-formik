import React from 'react';

export const DynamicFormContext = React.createContext(
  {
    schemas: {},
    types: {},
    formats: {},
    templates: {},
    formValues: {},
    currentStep: 0,
    setCurrentStep: () => { },
    setFormValues: () => { },
    updateSchema: () => { },
  },
);

export default DynamicFormContext;
