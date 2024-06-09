import Form from '@/features/rjsf';
import validator from '@rjsf/validator-ajv8';
import { useMemo } from 'react';
import { SchemaMethod } from '../contract/model';

interface SchemaFormProps {
  methodSchema: SchemaMethod
  onSubmitted: (data: object, event: unknown) => void
  isDisabled?: boolean
  isSubmitting?: boolean
}

export const SchemaForm = ({
  methodSchema,
  onSubmitted,
  isDisabled,
  isSubmitting,
}: SchemaFormProps) => {
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
    <div className={`${isSubmitting ? 'animate-pulse' : ''}`}>
      <p className=' text-xl text-primary'>{methodSchema.Title}</p>
      <p className=' text-md text-secondary-foreground'>{methodSchema.Description}</p>
      <Form
        className='mt-4'
        {...postProcessed}
        validator={validator}
        onSubmit={onSubmitted}
        onError={console.error}
        showErrorList={false}
        disabled={isDisabled}
      />
    </div>
  );
}


