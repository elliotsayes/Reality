import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { useMemo } from 'react';
import { ApiSchemaMethod } from '../contract/model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const log = (type: any) => console.log.bind(console, type);


interface ApiFormProps {
  methodSchema: ApiSchemaMethod
  onSubmitted: (data: object, event: unknown) => void
}

export const ApiForm = ({
  methodSchema,
  onSubmitted,
}: ApiFormProps) => {
  const postProcessed = useMemo(() => {
    const tagSchema = methodSchema.Schema.Tags;
    const tagProperties = tagSchema.properties as Record<string, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const?: any
    }>
    const tagConstProperties = Object.keys(tagProperties)
      .filter((property) => tagProperties[property].const !== undefined)

    // Created modified properties with default values addeed when const is specified
    const tagSchemaPropertiesModified = {
      ...tagSchema.properties,
      ...tagConstProperties.reduce((acc, property) => ({
        ...acc,
        [property]: {
          ...tagProperties[property],
          ...(
            tagConstProperties.includes(property) && {
              default: tagProperties[property].const,
            }
          )
        },
      }), {}),
    }

    // Get UI to hide const properties
    const uiSchema = tagConstProperties.reduce((acc, property) => ({
      ...acc,
      [property]: {
        'ui:widget': 'hidden',
      },
    }), {});
    
    const schema = {
      ...tagSchema,
      properties: tagSchemaPropertiesModified,
    }

    return {
      schema,
      uiSchema,
    }
  }, [methodSchema.Schema.Tags])

  return (
    <div>
      <h1>{methodSchema.Title}</h1>
      <h2>{methodSchema.Description}</h2>
      <Form
        {...postProcessed}
        validator={validator}
        onChange={log('changed')}
        onSubmit={onSubmitted}
        onError={log('errors')}
        showErrorList={false}
      />
    </div>
  );
}


