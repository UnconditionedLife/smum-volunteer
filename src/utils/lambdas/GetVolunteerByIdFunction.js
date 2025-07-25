// index.mjs
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET"
};

export const handler = async (event) => {
  try {
    const id = event.pathParameters?.id;


    if (!id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Missing volunteer ID in path" }),
      };
    }

    const result = await client.send(new GetCommand({
      TableName: "SMUM_Volunteers",
      Key: { VolunteerId: id }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Volunteer not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result.Item),
    };
  } catch (err) {
    console.error("Error getting volunteer:", err);
    return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Failed to get volunteer" }),
    };
  }
};