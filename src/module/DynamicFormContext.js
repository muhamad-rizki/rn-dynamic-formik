import React from 'react';

export const DynamicFormContext = React.createContext(
  {
    schemas: {},
    types: {},
    formats: {},
    templates: {},
    formValues: {},
    setFormValues: () => { },
    updateSchema: () => { },
  },
);

export default DynamicFormContext;
