
export const generateUpdateQuery = (fields: any) => {
    const exp: {
      UpdateExpression: string
      ExpressionAttributeNames: any
      ExpressionAttributeValues: any
    } = {
      UpdateExpression: 'set',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    }
    const settings = fields.settings
    if (settings) {
      delete fields.settings
      Object.entries(settings).forEach(([key]) => {
        exp.UpdateExpression += ` #settings.#${key} = :settings${key},`
        exp.ExpressionAttributeNames[`#${key}`] = key
        exp.ExpressionAttributeValues[`:settings${key}`] = settings[key]
      })
      exp.ExpressionAttributeNames['#settings'] = 'settings'
    }
  
    Object.entries(fields).forEach(([key, item]) => {
      exp.UpdateExpression += ` #${key} = :${key},`
      exp.ExpressionAttributeNames[`#${key}`] = key
      exp.ExpressionAttributeValues[`:${key}`] = item
    })
    exp.UpdateExpression = exp.UpdateExpression.slice(0, -1)
    return exp
  }
  
  
  
  export const generateRemoveQuery = (fields: [string]) => {
    const exp: {
      UpdateExpression: string
    } = {
      UpdateExpression: 'remove',
    }
    Object.entries(fields).forEach(([_key, item]) => {
      exp.UpdateExpression += ` ${item},`
    })
    exp.UpdateExpression = exp.UpdateExpression.slice(0, -1)
    return exp
  }
  