import React, { Component, Fragment } from 'react';
import {
  FlatList,
  View,
  Button,
  Text,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import withDynamicForm from './withDynamicForm';

export type QDynamicFormProps = ({
  schema: string,
  type: 'wizard' | 'single-form',
  storageKey: string,
});

const formPaths = (schema, initialValues, suffix) => {
  let newInitialValues = initialValues;
  const parrentKey = suffix.join('.');
  const keys = Object.keys(schema.properties);
  keys.forEach((k) => {
    if (schema.properties[k].properties) {
      const childSuffix = [...suffix, k];
      newInitialValues.push(`${childSuffix.join('.')}`);
      newInitialValues = newInitialValues.concat(formPaths(schema.properties[k], [], childSuffix));
    } else {
      newInitialValues.push(`${parrentKey}.${k}`);
    }
  });
  return newInitialValues;
};

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
  for (let i = 0; i < paths.length; i += 1) {
    if (current[paths[i]] === undefined) {
      return undefined;
    }
    current = current[paths[i]];
  }
  return current;
}

function deepSetValue(obj, value, path) {
  const stack = path.split('.');
  let newObj = Object.assign({}, obj);
  while (stack.length > 1) {
    newObj = newObj[stack.shift()];
  }
  newObj[stack.shift()] = value;
}

function getConfig(obj, key, defaultValue) {
  if (obj.config && obj.config[key]) return obj.config[key];
  return defaultValue;
}

const formValues = (schema, initialValues) => {
  const newInitialValues = initialValues;
  Object.keys(schema.properties).forEach((k) => {
    if (schema.properties[k].type === 'object') {
      newInitialValues[k] = formValues(schema.properties[k], {});
    } else {
      newInitialValues[k] = undefined;
    }
  });
  return newInitialValues;
};

const formEvents = (schema, initialValues) => {
  Object.keys(schema.properties).forEach((k) => {
    if (schema.properties[k].events) {
      initialValues.push(schema.properties[k].events);
    }
    if (schema.properties[k].type === 'object') {
      formEvents(schema.properties[k], initialValues);
    }
  });
  return initialValues;
};

const formValidations = (schema, initialValues) => {
  const newInitialValues = initialValues;
  Object.keys(schema.properties).forEach((k) => {
    if (schema.properties[k].type === 'object') {
      if (!schema.properties[k].config || !schema.properties[k].config.isHidden) {
        newInitialValues[k] = Yup.object().shape(formValidations(schema.properties[k], {}));
      }
    } else {
      newInitialValues[k] = Yup.string()
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
        });
    }
  });
  return newInitialValues;
};

class QDynamicFormComponent extends Component<QDynamicFormProps> {
  constructor(props) {
    super(props);
    props.updateSchema(props.schema, JSON.parse(JSON.stringify(props.schemas[props.schema])));
    this.type = props.type;
    this.schemaKey = props.schema;
    this.storageKey = !props.storageKey ? props.schemas[props.schema] : props.storageKey;
    this.currentSchema = props.schemas[this.schemaKey];
    this.initialize();
  }

  componentWillReceiveProps = (props) => {
    this.initialize(props);
  }

  initialize = (props) => {
    const {
      schemas,
      schema: key,
      formValues: values,
    } = !props ? this.props : props;
    this.currentSchema = schemas[key];
    this.schemaKey = key;
    const schema = schemas[key];
    this.initialValues = { ...formValues(schema, {}), ...values[this.storageKey] };
    this.initialPaths = formPaths(schema, [], []);
    this.formValidation = Yup.object().shape(formValidations(schema, [], []));
    this.events = formEvents(schema, []);
    this.itemHeights = {};
  }

  runValidation = (p) => {
    this.formValidation.validateAt(p, this.values)
      .then(() => this.setFieldError(p, undefined))
      .catch(err => this.setFieldError(p, err.message));
  }

  renderFormField = ({ item: p }) => {
    const { templates } = this.props;

    const _component = deepFind(this.currentSchema, `properties.${p.split('.').join('.properties.')}`);
    const _parentComponent = deepFind(this.currentSchema, `properties.${p.split('.').slice(0, p.split('.').length - 1).join('.properties.')}`);
    const isContainer = !!_component.properties;
    const template = _component.customTemplate && templates[_component.customTemplate]
      ? templates[_component.customTemplate]
      : templates.TextInput;

    if (
      (_component.config && _component.config.isHidden)
      || (_parentComponent && _parentComponent.config && _parentComponent.config.isHidden)
    ) return null;

    if (isContainer) {
      return (
        <View key={p} style={{ flex: 1 }} onLayout={(e) => { this.itemHeights[p] = e.nativeEvent.layout.height; }}>
          <Text>{_component.title}</Text>
        </View>
      );
    }

    const error = deepFind(this.errors, p);

    return (
      <View key={p} style={{ flex: 1 }} onLayout={(e) => { this.itemHeights[p] = e.nativeEvent.layout.height; }}>
        {
          template({
            ..._component,
            options: _component.enum,
            label: _component.title,
            onChange: (value) => {
              deepSetValue(this.values, value === '' ? undefined : value, p);
              this.setFieldValue(p, value === '' ? undefined : value);
              this.runValidation(p);
            },
            onBlur: () => {
              this.runValidation(p);
            },
            path: p,
            value: deepFind(this.values, p),
            error,
            hasError: !!error,
            config: !_component.config ? {} : _component.config,
          })
        }
      </View>
    );
  }

  sumObjectValue = (_object, keys) => {
    let sum = 0;
    keys.forEach((k, index) => {
      if (index < keys.length) {
        sum += _object[k] || 0;
      }
    });
    return sum;
  }

  renderForm = ({
    values,
    setFieldValue,
    errors,
    handleSubmit,
    validateForm,
    setFieldError,
  }) => {
    this.errors = errors;
    this.values = values;
    this.setFieldValue = setFieldValue;
    this.setFieldError = setFieldError;

    if (!this.currentSchema || Object.keys(this.currentSchema).length === 0) return null;

    return (
      <View style={{ flex: 1, }}>
        <FlatList
          data={this.initialPaths}
          renderItem={this.renderFormField}
          extraData={{ error: this.errors, values: this.values }}
          keyExtractor={item => item}
          ref={(v) => { this.container = v; }}
        />
        <Button
          onPress={() => {
            validateForm()
              .then((_errors) => {
                let scrollTo;
                let scrollToId;
                this.initialPaths.forEach((item, index) => {
                  const error = deepFind(_errors, item);
                  if (error && !scrollTo) {
                    scrollTo = item;
                    scrollToId = index;
                  }
                });
                console.log(scrollTo);
                console.log(this.itemHeights);
                console.log(this.initialPaths.slice(0, scrollTo + 1));
                console.log(this.sumObjectValue(this.itemHeights, this.initialPaths.slice(0, scrollTo + 1)));
                this.container.scrollToIndex({ animated: true, viewOffset: this.itemHeights[scrollTo], index: scrollToId, viewPosition: 0 });
              });
          }}
          title="Submit"
        />
      </View>
    );
  }

  render() {
    return (
      <Formik
        initialValues={this.initialValues}
        validationSchema={this.formValidation}
        validateOnBlur={false}
        validateOnChange={false}
        onSubmit={(values, action) => {
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
