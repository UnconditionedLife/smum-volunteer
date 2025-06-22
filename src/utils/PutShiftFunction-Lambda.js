import {
    DynamoDBClient,
    PutItemCommand,
    GetItemCommand
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
  
      if (!volunteerId || !action || !timestamp) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Missing required fields." })
        };
      }
  
      // ✅ Check if volunteer exists
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
  
      // ✅ Proceed with log
      const logId = randomUUID();
  
      const params = {
        TableName: SHIFTLOGS_TABLE,
        Item: {
          ShiftId: { S: logId },
          VolunteerId: { S: volunteerId },
          Action: { S: action },
          Timestamp: { S: timestamp },
          ...(activityId ? { ActivityId: { S: activityId } } : {}),
          ...(programId ? { ProgramId: { S: programId } } : {})
        }
      };
  
      await ddb.send(new PutItemCommand(params));
  
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Action logged.", logId })
      };
    } catch (err) {
      console.error("Error logging action:", err);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Server error." })
      };
    }
  };