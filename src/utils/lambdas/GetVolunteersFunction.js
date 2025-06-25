import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-west-2" });

export async function handler(event, context) {

  try {
    const command = new ScanCommand({
      TableName: "SMUM_Volunteers"
    });

    const result = await client.send(command);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ volunteers: result.Items || [] })
    };

  } catch (error) {
    console.error("Error fetching volunteers:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "Failed to fetch volunteers" })
    };
  }
};