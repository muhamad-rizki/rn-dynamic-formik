import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { withDynamicForm } from './withDynamicForm';

export type QDynamicFormProps = ({
  schema: string,
  type: 'wizard' | 'single-form',
});

class QDynamicFormComponent extends Component<QDynamicFormProps> {
  constructor(props) {
    super(props);
    this.schema = props.schemas[props.schema];
    this.type = props.type;
    console.log('rnform', props)
  }

  render() {
    return (
      <View>
        <Text> textInComponent </Text>
      </View>
    )
  }
}

const ReQDynamicForm = withDynamicForm(QDynamicFormComponent);

export default class QDynamicForm extends Component<QDynamicFormProps> {
  render() {
    return <ReQDynamicForm {...this.props} />;
  }
}
