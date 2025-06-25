import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddb = new DynamoDBClient({ region: "us-west-2" });
const docClient = DynamoDBDocumentClient.from(ddb);

const TABLE_NAME = "SMUM_ShiftLogs";
const GSI_PROGRAM = "ProgramId-Date-index";
const GSI_ACTIVITY = "ActivityId-Date-index";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET"
};

export const handler = async (event) => {
  const query = event.queryStringParameters || {};
  const { programId, activityId, date } = query;

  if (!programId && !activityId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Missing 'programId' or 'activityId' parameter." })
    };
  }

  const dateVal = date || new Date().toISOString().split("T")[0];

  const useProgram = !!programId;

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: useProgram ? GSI_PROGRAM : GSI_ACTIVITY,
      KeyConditionExpression: `${useProgram ? "ProgramId" : "ActivityId"} = :id AND #dt = :dateVal`,
      ExpressionAttributeNames: {
        "#dt": "Date"
      },
      ExpressionAttributeValues: {
        ":id": useProgram ? programId : activityId,
        ":dateVal": dateVal
      }
    })
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ items: result.Items })
  };
};