import React from 'react';

export const DynamicFormContext = React.createContext(
  {
    schemas: {},
    types: {},
    formats: {},
    templates: {}
  },
);

export default DynamicFormContext;