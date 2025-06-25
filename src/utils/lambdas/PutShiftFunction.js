import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const ddb = new DynamoDBClient({ region: "us-west-2" });
const VOLUNTEERS_TABLE = "SMUM_Volunteers";
const SHIFTLOGS_TABLE = "SMUM_ShiftLogs";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,PUT"
};

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const {
      volunteerId,
      action, // "check-in" or "check-out"
      timestamp,
      activityId,
      programId
    } = body;
    const date = timestamp.split('T')[0]; // e.g., "2025-06-24"

    if (!volunteerId || !action || !timestamp) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Missing required fields." })
      };
    }

    // ✅ Confirm volunteer exists
    const volunteerCheck = await ddb.send(
      new GetItemCommand({
        TableName: VOLUNTEERS_TABLE,
        Key: {
          VolunteerId: { S: volunteerId }
        }
      })
    );

    if (!volunteerCheck.Item) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Unknown volunteerId" })
      };
    }

    if (action === "check-in") {
      // ✅ Insert new shift record
      const shiftId = randomUUID();
      const params = {
        TableName: SHIFTLOGS_TABLE,
        Item: {
          ShiftId: { S: shiftId },
          VolunteerId: { S: volunteerId },
          Action: { S: action },
          TimestampIn: { S: timestamp },
          Date: { S: date },
          ...(activityId ? { ActivityId: { S: activityId } } : {}),
          ...(programId ? { ProgramId: { S: programId } } : {})
        }
      };

      await ddb.send(new PutItemCommand(params));

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Check-in recorded.", shiftId })
      };

    } else if (action === "check-out") {
        const result = await ddb.send( 
          new QueryCommand({
            TableName: SHIFTLOGS_TABLE,
            IndexName: "VolunteerId-TimestampIn-index",
            KeyConditionExpression: "VolunteerId = :vid",
            ExpressionAttributeValues: {
              ":vid": { S: volunteerId }
            },
            FilterExpression: "attribute_not_exists(TimestampOut)",
            ScanIndexForward: false, // Newest first
            Limit: 1
        })
      );

      const openShift = result.Items?.[0];
      if (!openShift) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ message: "No open shift found for volunteer." })
        };
      }

      // ✅ Update shift with TimestampOut
      await ddb.send(
        new UpdateItemCommand({
          TableName: SHIFTLOGS_TABLE,
          Key: {
            ShiftId: openShift.ShiftId
          },
          UpdateExpression: "SET TimestampOut = :tso",
          ExpressionAttributeValues: {
            ":tso": { S: timestamp }
          }
        })
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Check-out recorded.", shiftId: openShift.ShiftId.S })
      };
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Invalid action." })
      };
    }
  } catch (err) {
    console.error("Error handling shift action:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Server error." })
    };
  }
};