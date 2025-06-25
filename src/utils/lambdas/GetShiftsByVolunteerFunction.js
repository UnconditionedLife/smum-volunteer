import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddb = new DynamoDBClient({ region: "us-west-2" });
const docClient = DynamoDBDocumentClient.from(ddb);

const TABLE_NAME = "SMUM_ShiftLogs";
const GSI_NAME = "VolunteerId-TimestampIn-index";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET"
};

export const handler = async (event) => {
  const volunteerId = event.queryStringParameters?.volunteerId;
  const startDate = event.queryStringParameters?.startDate;
  const endDate = event.queryStringParameters?.endDate;

  if (!volunteerId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Missing 'volunteerId' query parameter." })
    };
  }

  const expression = [];
  const values = {
    ":vid": volunteerId
  };

  let keyCondition = "VolunteerId = :vid";

  if (startDate) {
    keyCondition += " AND TimestampIn >= :startDate";
    values[":startDate"] = startDate;
  }

  if (endDate) {
    keyCondition += startDate
      ? " AND TimestampIn <= :endDate"
      : " AND TimestampIn <= :endDate"; // fallback if no startDate
    values[":endDate"] = endDate;
  }

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI_NAME,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: values
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