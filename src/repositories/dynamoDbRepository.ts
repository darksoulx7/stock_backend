import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, } from "@aws-sdk/lib-dynamodb";
import { generateServiceId } from "../models/dynamoDbTypes";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export class DynamoDbRepository {
  static async subscribeEmail(pk: string, sk: string): Promise<void> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Item: { pk, sk },
    };
    await docClient.send(new PutCommand(params));
  }

  static async getItem(pk: string, sk: string): Promise<any> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Key: { pk, sk },
    };
    const result = await docClient.send(new GetCommand(params));
    return result.Item;
  }

  static async createService(service: any): Promise<void> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Item: service,
    };
    await docClient.send(new PutCommand(params));
  }

  static async updateService(service: any): Promise<void> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Key: { pk: service.pk, sk: service.sk },
      UpdateExpression:
        "set #name = :name, description = :description, risk = :risk, category = :category, subcategory = :subcategory, price = :price",
      ExpressionAttributeNames: {
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":name": service.name,
        ":description": service.description,
        ":risk": service.risk,
        ":category": service.category,
        ":subcategory": service.subcategory,
        ":price": service.price,
      },
    };

    await docClient.send(new UpdateCommand(params));
  }

  static async deleteService(pk: string, sk: string): Promise<void> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Key: { pk, sk },
    };
    await docClient.send(new DeleteCommand(params));
  }

  static async getServices(limit: number): Promise<any[]> {
    let allItems: any[] = [];
    let lastEvaluatedKey: any;
  
    do {
      const result = await docClient.send(new QueryCommand({
        TableName: process.env.TABLE_NAME as string,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": "SERVICE",
        },
        Limit: limit, 
        ExclusiveStartKey: lastEvaluatedKey,
      }));
      allItems = allItems.concat(result.Items || []);
      lastEvaluatedKey = result.LastEvaluatedKey; 
    } while (lastEvaluatedKey);
  
    return allItems;
  }
}
