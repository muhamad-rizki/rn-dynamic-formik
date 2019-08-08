import React, { Component } from 'react'
import { TextInput, ScrollView, View, Button, Text } from 'react-native'
import { withDynamicForm } from './withDynamicForm';
import { Formik, FastField, Form } from 'formik';
import * as Yup from 'yup';

export type QDynamicFormProps = ({
  schema: string,
  type: 'wizard' | 'single-form',
});

const formPaths = (schema, initialValues, suffix, isChild = false) => {
  Object.keys(schema.properties).forEach(k => {
    if (schema.properties[k].type === 'object') {
      if (!isChild) suffix.pop();
      suffix.push(k);
      initialValues.push(`${suffix.join('.')}`);
      initialValues = initialValues.concat(formPaths(schema.properties[k], [], suffix, true));
    } else {
      initialValues.push(`${suffix.join('.')}.${k}`);
    }
  })
  return initialValues;
}

function isRequired(field) {
  if (field.isRequired) {
    if (field.config && field.config.isHidden) {
      return false;
    }
    return true;
  }
  return false;
}

function deepFind(obj, path) {
  const paths = path.split('.');
  let current = obj;
  for (let i = 0; i < paths.length; ++i) {
    if (current[paths[i]] == undefined) {
      return undefined;
    } else {
      current = current[paths[i]];
    }
  }
  return current;
}

function getConfig(obj, key, defaultValue) {
  if (obj.config && obj.config[key]) return obj.config[key];
  return defaultValue;
}

const formValues = (schema, initialValues) => {
  Object.keys(schema.properties).forEach(k => {
    if (schema.properties[k].type === 'object') {
      initialValues[k] = formValues(schema.properties[k], {});
    } else {
      initialValues[k] = undefined;
    }
  })
  return initialValues;
}

const formValidations = (schema, initialValues) => {
  Object.keys(schema.properties).forEach(k => {
    if (schema.properties[k].type === 'object') {
      if (schema.properties[k].config && schema.properties[k].config.isHidden) return initialValues;
      initialValues[k] = Yup.object().shape(formValidations(schema.properties[k], {}));
    } else {
      initialValues[k] = Yup.string()
        .when('$rnform', (key, validation) => {
          if (schema.properties[k].minLength) {
            return validation.min(schema.properties[k].minLength, getConfig(schema.properties[k], 'minError', `Cannot be less than ${schema.properties[k].minLength} character(s)`));
          }
          return validation;
        })
        .when('$rnform', (key, validation) => {
          if (schema.properties[k].maxLength) {
            return validation.max(schema.properties[k].maxLength, getConfig(schema.properties[k], 'maxError', `Cannot be more than ${schema.properties[k].maxLength} character(s)`));
          }
          return validation;
        })
        .when('$rnform', (key, validation) => {
          if (isRequired(schema.properties[k])) {
            return validation.required('This field is required');
          }
          return validation.notRequired();
        })
    }
  });
  return initialValues;
}

class QDynamicFormComponent extends Component<QDynamicFormProps> {
  constructor(props) {
    super(props);
    this.schema = props.schemas[props.schema];
    this.type = props.type;
    this.initialValues = formValues(this.schema, {});
    this.initialPaths = formPaths(this.schema, [], []);
    this.formValidation = Yup.object().shape(formValidations(this.schema, [], []));
  }

  renderForm = ({ values, handleChange, errors, handleSubmit, setFieldTouched, isValid }) => {
    console.log('rnform', errors);
    return (
      <ScrollView nestedScrollEnabled>
        <View style={{ flex: 1, }}>
          {
            this.initialPaths.map(p => {
              const _component = deepFind(this.schema, `properties.${p.split('.').join('.properties.')}`);
              const _parentComponent = deepFind(this.schema, `properties.${p.split('.').slice(0, p.split('.').length - 1).join('.properties.')}`);
              const isContainer = !!_component.properties;

              if (
                (_component.config && _component.config.isHidden) ||
                (_parentComponent && _parentComponent.config && _parentComponent.config.isHidden)
              ) return null;

              if (isContainer) {
                return (
                  <View key={p}>
                    <Text>{_component.title}</Text>
                  </View>
                );
              }

              return (
                <TextInput
                  key={p}
                  value={deepFind(values, p)}
                  onChangeText={handleChange(p)}
                  onBlur={() => setFieldTouched(p)}
                  placeholder={p}
                />
              );
            })
          }
          <Button onPress={handleSubmit} title="Submit" disabled={!isValid} />
        </View>
      </ScrollView>
    );
  }

  render() {
    console.log('rnform', this.formValidation);
    return (
      <Formik
        initialValues={this.initialValues}
        validationSchema={this.formValidation}
        onSubmit={(values, actions) => {
          console.log('rnform', values);
        }}
      >
        {this.renderForm}
      </Formik>
    );
  }
}

const ReQDynamicForm = withDynamicForm(QDynamicFormComponent);

export default class QDynamicForm extends Component<QDynamicFormProps> {
  render() {
    return <ReQDynamicForm {...this.props} />;
  }
}
