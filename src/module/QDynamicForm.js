import React, { Component } from 'react';
import {
  View,
  Button,
  ScrollView,
} from 'react-native';
import { Formik } from 'formik';
import posed, { Transition } from 'react-native-pose';
import * as Yup from 'yup';
import withDynamicForm from './withDynamicForm';
import { nextItem } from './helper';

export type FormHeaderProps = ({});
export type FormFooterProps = ({});

export type QDynamicFormProps = ({
  schema: string,
  type: 'wizard' | 'single-form',
  storageKey: string,
  header: (props: FormHeaderProps) => React.Component,
  footer: (props: FormFooterProps) => React.Component,
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

const Container = posed.View({
  enter: { opacity: 1, delayChildren: 200, staggerChildren: 50 },
  exit: { opacity: 0 }
});

const Item = posed.View({
  enter: { opacity: 1 },
  exit: { opacity: 0 }
});

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

  componentDidUpdate = (nextProps) => {
    this.initialize(nextProps);
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
    this.itemHeights = [];
    this.steps = Object.keys(this.currentSchema.properties);
    this.stepIndex = [];
    this.steps.forEach((step) => {
      this.stepIndex.push(this.initialPaths.findIndex(p => p === step));
    });
  }

  runValidation = (p) => {
    this.formValidation.validateAt(p, this.values)
      .then(() => this.setFieldError(p, undefined))
      .catch(err => this.setFieldError(p, err.message));
  }

  renderFormField = (p, index) => {
    const { templates } = this.props;

    const _component = deepFind(this.currentSchema, `properties.${p.split('.').join('.properties.')}`);
    const _parentComponent = deepFind(this.currentSchema, `properties.${p.split('.').slice(0, p.split('.').length - 1).join('.properties.')}`);
    const isContainer = !!_component.properties;
    let template = isContainer ? templates.DefaultContainer : templates.TextInput;

    if (_component.customTemplate && templates[_component.customTemplate]) {
      template = templates[_component.customTemplate];
    }

    if (
      (_component.config && _component.config.isHidden)
      || (_parentComponent && _parentComponent.config && _parentComponent.config.isHidden)
    ) return null;

    const error = deepFind(this.errors, p);

    return (
      <Item
        key={p}
        style={{ flex: 1 }}
        onLayout={(e) => { this.itemHeights[index] = e.nativeEvent.layout.height; }}
      >
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
            config: {
              ..._component.config,
              accessibilityLabel: p.toLowerCase().replace(/(\.)/g, '_'),
            },
          })
        }
      </Item>
    );
  }

  renderHeaderForm = () => {
    const { header } = this.props;
    return (
      <View style={{ flex: 1 }}>
        {(header && header(this.props)) || undefined}
      </View>
    );
  }

  renderFooterForm = () => {
    const { footer } = this.props;
    return (
      <Item style={{ flex: 1 }} key="form_footer">
        {
          (footer && footer(this.props)) || (
            <Button
              disabled={this.isValidating}
              onPress={this.onFormSubmit}
              title="Submit"
            />
          )
        }
      </Item>
    );
  }

  formFieldKeyExtractor = item => item;

  setRefView = (v) => { this.container = v; }

  onFormSubmit = () => {
    this.validateForm()
      .then((_errors) => {
        const { type, currentStep, setCurrentStep } = this.props;
        if (Object.keys(_errors).length === 0) {
          return this.handleSubmit();
        }
        if (type === 'wizard') {
          if (!_errors[this.steps[currentStep]]) {
            this.resetForm(this.values);
            setCurrentStep(currentStep + 1,
              () => this.container.scrollTo({ animated: false, y: 0 }));
            return true;
          }
        }
        let scrollTo;
        if (type === 'single-form') {
          this.initialPaths.forEach((item, index) => {
            const error = typeof deepFind(_errors, item) === 'string';
            if (error && !scrollTo) {
              scrollTo = index;
            }
          });
        } else {
          this.initialPaths
            .slice(this.stepIndex[currentStep],
              nextItem(this.stepIndex, currentStep) === 0
                ? this.initialPaths.length
                : nextItem(this.stepIndex, currentStep))
            .forEach((item, index) => {
              const error = typeof deepFind(_errors, item) === 'string';
              if (error && !scrollTo) {
                scrollTo = index;
              }
            });
        }
        return this.container.scrollTo({
          animated: true,
          y: this.itemHeights.slice(0, scrollTo).reduce((a, b) => a + b, 0),
        });
      });
  }

  renderForm = ({
    values,
    setFieldValue,
    errors,
    handleSubmit,
    validateForm,
    setFieldError,
    isValidating,
    resetForm,
  }) => {
    this.resetForm = resetForm;
    this.errors = errors;
    this.values = values;
    this.setFieldValue = setFieldValue;
    this.setFieldError = setFieldError;
    this.validateForm = validateForm;
    this.handleSubmit = handleSubmit;
    this.isValidating = isValidating;

    const { type, currentStep } = this.props;

    if (type === 'wizard') {
      if (!this.currentSchema || Object.keys(this.currentSchema).length === 0) return null;
    }

    this.stepComponents = this.stepIndex.map(_indx => (
      <Container key={`container_form_wizard_step_${_indx + 1}`}>
        {
          this.initialPaths.slice(_indx,
            nextItem(this.stepIndex, currentStep) === 0
              ? this.initialPaths.length
              : nextItem(this.stepIndex, currentStep)).map(this.renderFormField)
        }
        {this.renderFooterForm()}
      </Container>
    ));

    return (
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        ref={this.setRefView}
      >
        <View style={{ flex: 1, }}>
          {this.renderHeaderForm()}
          {
            type !== 'wizard'
              ? (
                <Transition animateOnMount>
                  <Container key="container_form_non_wizard">
                    {
                      this.initialPaths.map(this.renderFormField)
                    }
                    {this.renderFooterForm()}
                  </Container>
                </Transition>
              )
              : (
                <Transition animateOnMount>
                  {
                    this.stepComponents[currentStep]
                  }
                </Transition>
              )
          }
        </View>
      </ScrollView>
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
