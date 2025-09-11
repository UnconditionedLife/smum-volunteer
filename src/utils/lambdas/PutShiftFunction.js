// PutShiftFunction

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const ddb = new DynamoDBClient({ region: "us-west-2" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,PUT,POST"
};

const BUILD = "shift-2025-09-05-1"; // bump each deploy

export const handler = async (event) => {
  const VOLUNTEERS_TABLE = event.stageVariables?.volunteersTable ?? "SMUM_Volunteers";
  const SHIFTLOGS_TABLE = event.stageVariables?.shiftLogsTable ?? "SMUM_ShiftLogs";

  try {
    const body = JSON.parse(event.body);
    const {
      volunteerId,
      action, // "check-in" or "check-out"
      timestamp,
      activityId
    } = body;
    const date = timestamp.split('T')[0]; // e.g., "2025-06-24"

    if (!volunteerId || !action || !timestamp) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Missing required fields." })
      };
    }

    // Confirm volunteer exists
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
        body: JSON.stringify({ message: "Unknown volunteerId", id: volunteerId })
      };
    }

    const programIdFromVolunteer = 
      volunteerCheck.Item.ProgramId?.S?.trim() || "0";  // default to "0"

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
          ActivityId: { S: activityId },
          ProgramId: { S: programIdFromVolunteer }
        }
      };

      await ddb.send(new PutItemCommand(params));

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Check-in recorded.", shiftId, build: BUILD })
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

      // Update shift with TimestampOut
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
        body: JSON.stringify({ message: "Check-out recorded.", shiftId: openShift.ShiftId.S, build: BUILD })
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