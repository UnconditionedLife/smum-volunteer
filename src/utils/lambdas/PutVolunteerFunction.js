// PutVolunteerFunction

import {
    DynamoDBClient,
    QueryCommand,
    PutItemCommand,
    GetItemCommand
} from "@aws-sdk/client-dynamodb";
import * as crypto from "crypto";

const ddb = new DynamoDBClient({ region: "us-west-2" });

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,PUT"
};

export const handler = async (event) => {

    console.log("STAGE VAR VOL TBL", event.stageVariables?.volunteersTable)

    const TABLE_NAME = event.stageVariables?.volunteersTable ?? 'SMUM_Volunteers';
    const TELEPHONE_EMAIL_INDEX = "telephone-email-index";

    // here to handle both test and live input
    let body = {};
    const id = crypto.randomUUID();

    try {
        body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch {
        body = event; // fallback in case no body wrapper is present
    }

    try {
        var { firstName, lastName, telephone, email, programId, time } = body;

        if (!firstName || !lastName) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Missing required fields." }),
            };
        }

        if (!telephone)
            telephone = "*EMPTY*"

        if (!email)
            email = "*EMPTY*"

        // Normalize Tel and Email
        const emailNorm = String(email).trim().toLowerCase();
        const telephoneNorm = String(telephone).replace(/\D+/g, "");

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
                ":tel": { S: telephoneNorm },
                ":email": { S: emailNorm }
            },
            Limit: 1
        };

        const queryResult = await ddb.send(new QueryCommand(queryParams));

        if (queryResult.Count > 0) {
            let existing = queryResult.Items[0];
            let returnedId = existing.VolunteerId.S;
            let regComplete = existing.RegComplete?.BOOL ?? false;

            if (existing.isDeleted?.BOOL === true && existing.RedirectTo?.S) {
                const redirectedCheck = await ddb.send(
                    new GetItemCommand({
                        TableName: TABLE_NAME,
                        Key: {
                            VolunteerId: { S: existing.RedirectTo.S }
                        }
                    })
                );
                if (redirectedCheck.Item && !redirectedCheck.Item.isDeleted?.BOOL) {
                    existing = redirectedCheck.Item;
                    returnedId = existing.VolunteerId.S;
                    regComplete = existing.RegComplete?.BOOL ?? false;
                }
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    id: returnedId,
                    regComplete,
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
                telephone: { S: telephoneNorm },
                email: { S: emailNorm },
                ...(programId ? { ProgramId: { S: programId } } : {}),
                ...(time ? { time: { S: time } } : {}),
                RegComplete: { BOOL: false }
            }
        }

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