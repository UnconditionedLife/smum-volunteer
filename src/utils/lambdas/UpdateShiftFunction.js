import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: "us-west-2" });

const TABLE_NAME = "SMUM_ShiftLogs";
const PK_NAME = "ShiftId";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,PATCH"
};

// ---- helpers ----
const toStrOrNull = (v) => (v === null || v === undefined ? null : String(v));

function parseBody(event) {
  const raw = event?.body ?? "";
  const text = event?.isBase64Encoded
    ? Buffer.from(raw, "base64").toString("utf8")
    : (typeof raw === "string" ? raw : JSON.stringify(raw ?? {}));
  return text ? JSON.parse(text) : {};
}

export const handler = async (event) => {
  try {
    // Preflight
    if (event?.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: corsHeaders, body: "" };
    }

    // id from path/query
    const id = event?.pathParameters?.id || event?.queryStringParameters?.id;
    if (!id) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: "Missing id in path." }) };
    }

    // Parse JSON body
    let body;
    try { body = parseBody(event); }
    catch { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: "Invalid JSON body." }) }; }

    // Collect updatable string fields (all stored as S in your table)
    let {
      Action,
      ActivityId,
      Date,
      ProgramId,
      TimestampIn,
      TimestampOut,
      VolunteerId
    } = body;

    // normalize to strings (or null for REMOVE)
    if (Action       !== undefined) Action       = toStrOrNull(Action);
    if (ActivityId   !== undefined) ActivityId   = toStrOrNull(ActivityId);
    if (Date         !== undefined) Date         = toStrOrNull(Date);
    if (ProgramId    !== undefined) ProgramId    = toStrOrNull(ProgramId);
    if (TimestampIn  !== undefined) TimestampIn  = toStrOrNull(TimestampIn);
    if (TimestampOut !== undefined) TimestampOut = toStrOrNull(TimestampOut);
    if (VolunteerId  !== undefined) VolunteerId  = toStrOrNull(VolunteerId);

    // Build UpdateExpression (SET + optional REMOVE)
    const sets = [];
    const removes = [];
    const names = {};
    const values = {};

    const addSet = (attr, av) => {
      const nk = `#${attr}`;
      const vk = `:${attr}`;
      names[nk] = attr;
      values[vk] = av;
      sets.push(`${nk} = ${vk}`);
    };
    const addRemove = (attr) => {
      const nk = `#${attr}`;
      names[nk] = attr;
      removes.push(nk);
    };
    const consider = (attr, val) => {
      if (val === undefined) return;            // not provided
      if (val === null) return addRemove(attr); // explicit null -> REMOVE
      addSet(attr, { S: String(val) });         // store as String
    };

    consider("Action",       Action);
    consider("ActivityId",   ActivityId);
    consider("Date",         Date);
    consider("ProgramId",    ProgramId);
    consider("TimestampIn",  TimestampIn);
    consider("TimestampOut", TimestampOut);
    consider("VolunteerId",  VolunteerId);

    if (sets.length === 0 && removes.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "No updatable fields provided. Send attributes to set, or null to remove." })
      };
    }

    let UpdateExpression = "";
    if (sets.length)    UpdateExpression += `SET ${sets.join(", ")}`;
    if (removes.length) UpdateExpression += `${UpdateExpression ? " " : ""}REMOVE ${removes.join(", ")}`;

    const ExpressionAttributeNames = { ...names, "#pk": PK_NAME };

    const cmd = new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: { S: id } },
      UpdateExpression,
      ExpressionAttributeNames,
      ...(Object.keys(values).length ? { ExpressionAttributeValues: values } : {}),
      ConditionExpression: "attribute_exists(#pk)",  // 404 if not found
      ReturnValues: "ALL_NEW"
    });

    const { Attributes } = await ddb.send(cmd);

    // Friendly response
    const resp = {
      id:             Attributes?.[PK_NAME]?.S,
      Action:         Attributes?.Action?.S,
      ActivityId:     Attributes?.ActivityId?.S,
      Date:           Attributes?.Date?.S,
      ProgramId:      Attributes?.ProgramId?.S,
      TimestampIn:    Attributes?.TimestampIn?.S,
      TimestampOut:   Attributes?.TimestampOut?.S,
      VolunteerId:    Attributes?.VolunteerId?.S
    };

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(resp)
    };

  } catch (err) {
    if (err?.name === "ConditionalCheckFailedException") {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ message: "ShiftAction not found." }) };
    }
    console.error("Update error:", err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: "Server error." }) };
  }
};