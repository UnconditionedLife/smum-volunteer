import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddb = new DynamoDBClient({ region: "us-west-2" });
const docClient = DynamoDBDocumentClient.from(ddb);

const TABLE_NAME = "SMUM_ShiftLogs";
const GSI_NAME = "Date-TimestampIn-index";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET"
};

export const handler = async (event) => {
  const date = event.queryStringParameters?.date;

  if (!date) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Missing 'date' query parameter (YYYY-MM-DD)" })
    };
  }

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI_NAME,
        KeyConditionExpression: "#d = :dateVal",
        ExpressionAttributeNames: {
          "#d": "Date"
        },
        ExpressionAttributeValues: {
          ":dateVal": date
        }
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ items: result.Items })
    };
  } catch (err) {
    console.error("Query failed:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};