import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, } from "@aws-sdk/lib-dynamodb";
import { generateUpdateExpression } from "../utils/dynamo-helpers";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class UserRepository {
  private tableName: string;

  constructor() {
    this.tableName = process.env.TABLE_NAME!;
  }

  async createUser(user: Record<string, any>): Promise<void> {
    await dynamoClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: user,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)", // Ensure unique user
      })
    );
  }

  async getUserByEmail(email: string): Promise<Record<string, any> | null> {
    const result = await dynamoClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: "USER", sk: email },
      })
    );
    return result.Item || null;
  }

  async updateUserVerification(email: string): Promise<void> {
    await dynamoClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: "USER", sk: email },
        UpdateExpression: "SET verified = :verified",
        ExpressionAttributeValues: { ":verified": true },
      })
    );
  }
}
