// UpdateVolunteerFunction

import {
  DynamoDBClient,
  UpdateItemCommand,
  QueryCommand
} from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: "us-west-2" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,PATCH"
};

const normTel = (v) => (v ?? "").replace(/\D/g, "");
const normEmail = (v) => (v ?? "").trim().toLowerCase();

export const handler = async (event) => {
    const TABLE_NAME = event.stageVariables?.volunteersTable ?? "SMUM_Volunteers"
    const TELEPHONE_EMAIL_INDEX = "telephone-email-index";    
    
    try {
        const id = event.pathParameters?.id || event.queryStringParameters?.id;
        if (!id) {
            return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: "Missing id in path." }) };
        }

        // parse body
        let body = {};
        try {
            body = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
        } catch {
            body = event || {};
        }

        // collect updatable fields
        let { firstName, lastName, telephone, email, programId, regComplete } = body;

        // normalize if provided
        if (telephone != null) telephone = normTel(telephone);
        if (email != null) email = normEmail(email);

        // if telephone+email pair is being set/changed, ensure uniqueness
        if (telephone && email) {
        const exists = await ddb.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: TELEPHONE_EMAIL_INDEX,
            KeyConditionExpression: "#t = :tel AND #e = :email",
            ExpressionAttributeNames: { "#t": "telephone", "#e": "email" },
            ExpressionAttributeValues: {
            ":tel":   { S: telephone },
            ":email": { S: email }
            },
            Limit: 1
        }));

        if (exists.Count > 0) {
            const hit = exists.Items[0];
            const hitId = hit?.VolunteerId?.S;
            if (hitId && hitId !== id) {
                // another record already uses this (telephone,email)
                return {
                    statusCode: 409,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: "Conflict: telephone+email already used by another volunteer." })
                };
            }
        }
        }

        // build UpdateExpression dynamically
        const sets = [];
        const names = {};
        const values = {};

        const add = (attr, ddbValue) => {
        const nk = `#${attr}`;
        const vk = `:${attr}`;
        names[nk] = attr;
        values[vk] = ddbValue;
        sets.push(`${nk} = ${vk}`);
        };

        if (firstName != null) add("firstName", { S: String(firstName) });
        if (lastName  != null) add("lastName",  { S: String(lastName) });
        if (telephone != null) add("telephone", { S: telephone });
        if (email     != null) add("email",     { S: email });
        if (programId != null) add("ProgramId", { S: String(programId) });
        if (typeof regComplete === "boolean") add("RegComplete", { BOOL: regComplete });

        if (sets.length === 0) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: "No updatable fields provided." }) };
        }

        const cmd = new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { VolunteerId: { S: id } },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ConditionExpression: "attribute_exists(VolunteerId)", // 404 if not found
        ReturnValues: "ALL_NEW"
        });

        const { Attributes } = await ddb.send(cmd);

        // marshal a friendly response (only known fields)
        const resp = {
        VolunteerId: Attributes?.VolunteerId?.S,
        // firstName:   Attributes?.firstName?.S,
        // lastName:    Attributes?.lastName?.S,
        // telephone:   Attributes?.telephone?.S,
        // email:       Attributes?.email?.S,
        // ProgramId:   Attributes?.ProgramId?.S,
        RegComplete: Attributes?.RegComplete?.BOOL ?? false
        };

        return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(resp)
        };

    } catch (err) {
        if (err?.name === "ConditionalCheckFailedException") {
            return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ message: "Volunteer not found." }) };
        }
            console.error("Update error:", err);
            return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: "Server error." }) };
    }
};