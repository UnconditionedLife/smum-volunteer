import { 
    DynamoDBClient,
    QueryCommand, 
    PutItemCommand 
} from "@aws-sdk/client-dynamodb";
import * as crypto from "crypto";

const ddb = new DynamoDBClient({ region: "us-west-2" });
const TABLE_NAME = "SMUM_Volunteers";
const TELEPHONE_EMAIL_INDEX = "telephone-email-index";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,PUT"
};

export const handler = async (event) => {
    // here to handle both test and live input
    let body = {};
    const id = crypto.randomUUID();

    try {
        body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch {
        body = event; // fallback in case no body wrapper is present
    }

    try {
        const { firstName, lastName, telephone, email, programId } = body;

        if (!firstName || !lastName || !telephone || !email) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Missing required fields." }),
            };
        }

        // Step 1: Check if volunteer exists using the telephone+email GSI
        const queryParams = {
        TableName: TABLE_NAME,
        IndexName: TELEPHONE_EMAIL_INDEX,
        KeyConditionExpression: "#t = :tel AND #e = :email",
        ExpressionAttributeNames: {
            "#t": "telephone",
            "#e": "email"
        },
        ExpressionAttributeValues: {
            ":tel":   { S: telephone },
            ":email": { S: email }
        },
        Limit: 1
        };

        const queryResult = await ddb.send(new QueryCommand(queryParams));

        if (queryResult.Count > 0) {
        const existing = queryResult.Items[0];
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
            id: existing.VolunteerId.S,
            regComplete: existing.RegComplete?.BOOL ?? false,
            }),
        };
        }

        // Step 2: Save new volunteer
        const params = {
        TableName: TABLE_NAME,
        Item: {
            VolunteerId: { S: id },
            firstName: { S: firstName },
            lastName: { S: lastName },
            ...(telephone ? { telephone: { S: telephone } } : {}),
            ...(email ? { email: { S: email } } : {}),
            ...(programId ? { ProgramId: { S: programId } } : {}),
            RegComplete: { BOOL: false }
        }
        };

        console.log("DynamoDB PutItem params:", JSON.stringify(params, null, 2));
        await ddb.send(new PutItemCommand(params));

        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({ id: id }),
        };
    } catch (err) {
        console.error("Error processing volunteer:", err.name, err.message, err.stack);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Server error." }),
        };
  }
};