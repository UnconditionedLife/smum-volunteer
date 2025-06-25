import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: "us-west-2" }); // Update region if needed
const TABLE_NAME = "SMUM_Volunteers";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,PUT"
};

export const handler = async (event) => {
  // here to handle both test and live input
  let body = {};
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch {
    body = event; // fallback in case no body wrapper is present
  }

  try {
    const { volunteerId, fullName, telephone, email, programId } = body;

    if (!volunteerId || !fullName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Missing required fields." }),
      };
    }

    const params = {
      TableName: TABLE_NAME,
      Item: {
        VolunteerId: { S: volunteerId },
        FullName: { S: fullName },
        ...(telephone ? { Telephone: { S: telephone } } : {}),
        ...(email ? { Email: { S: email } } : {}),
        ...(programId ? { ProgramId: { S: programId } } : {})
      }
    };

    console.log("DynamoDB PutItem params:", JSON.stringify(params, null, 2));
    await ddb.send(new PutItemCommand(params));

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Volunteer created." }),
    };
  } catch (err) {
    console.error("Error inserting volunteer:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Server error." }),
    };
  }
};