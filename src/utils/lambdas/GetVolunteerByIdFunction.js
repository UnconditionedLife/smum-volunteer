// GetVolunteerByIdFunction

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
  const TABLE_NAME = event.stageVariables?.volunteersTable ?? 'SMUM_Volunteers';

  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
      },
        body: JSON.stringify({ message: "Missing volunteer ID in path" }),
      };
    }

    const result = await client.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { VolunteerId: id }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
      },
        body: JSON.stringify({ message: "Volunteer not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
  },
      body: JSON.stringify(result.Item),
    };
  } catch (err) {
    console.error("Error getting volunteer:", err);
    return {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "Failed to get volunteer" }),
    };
  }
};