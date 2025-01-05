export const generateUpdateExpression = (data: any, excludedKeys: any[]) => {
  const updatedAttributes = Object.entries(data)
    .filter(([key]) => !excludedKeys.includes(key))
    .reduce((acc, [key, value]) => { 
        acc.names[`#${key}`] = key;
        acc.values[`:${key}`] = value;
        return acc;
      },
      { names: {} as any, values: {} as any }
    );

  const updateExpression = `set ${Object.keys(updatedAttributes.names)
    .map((name, idx) => `${name} = ${Object.keys(updatedAttributes.values)[idx]}`)
    .join(", ")}`;

  return {
    updateExpression,
    attributeNames: updatedAttributes.names,
    attributeValues: updatedAttributes.values,
  };
}
