import Form from "@/features/rjsf";
import validator from "@rjsf/validator-ajv8";
import { useMemo } from "react";
import { SchemaMethod } from "../contract/model";
import Linkify from "linkify-react";

interface SchemaFormProps {
  methodSchema: SchemaMethod;
  onSubmitted: (data: object, event: unknown) => void;
  isDisabled?: boolean;
  isSubmitting?: boolean;
}

export const SchemaForm = ({
  methodSchema,
  onSubmitted,
  isDisabled,
  isSubmitting,
}: SchemaFormProps) => {
  const postProcessed = useMemo(() => {
    if (methodSchema.Schema?.Tags === undefined) return;

    const tagSchema = methodSchema.Schema.Tags;
    const tagProperties = tagSchema.properties as Record<
      string,
      {
        title?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const?: any;
        maxLength?: number;
      }
    >;
    const tagPropertyKeys = Object.keys(tagProperties);
    const tagConstPropertyKeys = tagPropertyKeys.filter(
      (property) => tagProperties[property].const !== undefined,
    );

    // Created modified properties with default values addeed when const is specified
    const tagSchemaPropertiesModified = {
      ...tagSchema.properties,
      ...tagConstPropertyKeys.reduce(
        (acc, property) => ({
          ...acc,
          [property]: {
            ...tagProperties[property],
            ...(tagConstPropertyKeys.includes(property) && {
              default: tagProperties[property].const,
            }),
          },
        }),
        {},
      ),
    };

    // Get UI to hide const properties
    const uiSchema = tagPropertyKeys.reduce(
      (acc, property) => ({
        ...acc,
        [property]: {
          ...(tagProperties[property].title !== undefined && {
            "ui:title": tagProperties[property].title,
          }),
          ...(tagConstPropertyKeys.includes(property) && {
            "ui:widget": "hidden",
          }),
          ...(tagProperties[property].maxLength !== undefined &&
            tagProperties[property].maxLength >= 100 && {
              "ui:widget": "textarea",
              "ui:rows": 2,
            }),
        },
      }),
      methodSchema.NoSubmit
        ? {
            "ui:submitButtonOptions": { norender: true },
          }
        : {},
    );

    const schema = {
      ...tagSchema,
      properties: tagSchemaPropertiesModified,
    };

    return {
      schema,
      uiSchema,
    };
  }, [methodSchema.Schema?.Tags, methodSchema.NoSubmit]);

  if (postProcessed === undefined) {
    return (
      <div>
        <p className="text-primary font-Press-Start-2P tracking-tighter text-[0.85rem]">
          {methodSchema.Title}
        </p>
        <p className="text-22px text-secondary-foreground font-undead-pixel leading-none mt-2 whitespace-pre-wrap">
          <Linkify
            options={{
              target: "_blank",
              className: "text-blue-800 hover:underline break-words",
            }}
          >
            {methodSchema.Description}
          </Linkify>
        </p>
      </div>
    );
  }

  return (
    <div className={`${isSubmitting ? "animate-pulse" : ""}`}>
      <p className="text-primary font-Press-Start-2P tracking-tighter text-[0.85rem]">
        {methodSchema.Title}
      </p>
      <p className="text-22px text-secondary-foreground font-undead-pixel leading-none mt-2">
        <Linkify
          options={{
            target: "_blank",
            className: "text-blue-800 hover:underline break-words",
          }}
        >
          {methodSchema.Description}
        </Linkify>
      </p>
      <Form
        className="mt-4"
        {...postProcessed}
        validator={validator}
        onSubmit={onSubmitted}
        onError={console.error}
        showErrorList={false}
        disabled={isDisabled}
      />
    </div>
  );
};
