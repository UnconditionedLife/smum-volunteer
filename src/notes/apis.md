# Volunteer APIs

APIs for the **Volunteers App** and **Admin module** in [https://foodBank.click](https://foodBank.click).

---

## **BASE URL**
```
https://hjfje6icwa.execute-api.us-west-2.amazonaws.com/prod
```

---

## PUBLIC APIs *(No Authentication Required)*

These endpoints are used by the **Volunteer App** and do **not** require authentication.

---

### **PUT /volunteers (PRIVATE) AND /volunteers/public (PUBLIC) **

**Description:** Create a volunteer profile. Private and Public use same Lambda

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "telephone": "string",
  "email": "string",
  "programId": "string",
  "RegComplete": "boolean"
}
```

**Responses:**
- `200 { id: ###, regComplete: }` - Telephone and Email already exist.
- `201 { id: ### }` — Volunteer successfully created or updated.
- `400 Bad Request` — Missing required fields.
- `500 Internal Server Error`

---

### **UPDATE /volunteers/{id} (PRIVATE) AND /volunteers/public/{id} (PUBLIC) **

**Description:** Update a volunteer profile. Private and Public use same Lambda - accepts any number of fields

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "telephone": "string",
  "email": "string",
  "programId": "string",
  "RegComplete": "boolean"
}
```

**Responses:**
- `200 { id: ###, regComplete: t/f }` - Volunteer successfully updated.
- `400 { message: 'No updatable fields provided.' }` — Telephone and Email already exist.
- `404 { message: 'Volunteer not found.' }`
- `500 Internal Server Error`

---

### **PUT /shiftAction**

**Description:** Logs a volunteer's check-in or check-out.

**Request Body:**
```json
{
  "volunteerId": "string",
  "action": "check-in | check-out",
  "timestamp": "ISO-8601 datetime",
  "activityId": "string (optional)",
  "programId": "string (optional)"
}
```

**Responses:**
- `201 Created` — Check-in recorded.
- `200 OK` — Check-out recorded.
- `400 Bad Request` — Missing fields or invalid action.
- `404 Not Found` — No open shift found for check-out.
- `500 Internal Server Error`

---

## PRIVATE APIs *(Authentication Required)*

These endpoints are used by **Admin users** in the FoodBank.click dashboard and require authentication.

---

### **GET /volunteers**

**Description:** Retrieve the list of all volunteers.

**Responses:**
- `200 OK` — Returns a list of volunteers.
- `500 Internal Server Error`

---

### **GET /volunteers/{id}**

**Description:** Retrieve a specific volunteer by ID.

**Path Parameter:**
- `id` – Volunteer ID

**Responses:**
- `200 OK` — Returns the volunteer object.
- `400 Bad Request` — Missing ID.
- `404 Not Found` — Volunteer not found.
- `500 Internal Server Error`

---

### **GET /shiftByVolunteer**

**Description:** Fetch shift logs by volunteer ID and optional date range.

**Query Parameters:**
- `volunteerId` – (required) ID of the volunteer
- `startDate` – (optional) ISO date (inclusive)
- `endDate` – (optional) ISO date (inclusive)

**Responses:**
- `200 OK` — Returns shift items.
- `400 Bad Request` — Missing volunteerId.
- `500 Internal Server Error`

---

### **GET /shiftsByDate**

**Description:** Retrieve all shifts on a given date.

**Query Parameters:**
- `date` – (required) in `YYYY-MM-DD` format

**Responses:**
- `200 OK` — Returns shifts.
- `400 Bad Request` — Missing date.
- `500 Internal Server Error`

---

### **GET /shiftsByProgramOrActivity**

**Description:** Get shifts by either program ID or activity ID on a given date.

**Query Parameters:**
- `programId` — (optional) Program ID
- `activityId` — (optional) Activity ID
- `date` — (optional) Date in `YYYY-MM-DD`. Defaults to today if not provided.

> ⚠️ Either `programId` or `activityId` must be supplied.

**Responses:**
- `200 OK` — Returns shift items.
- `400 Bad Request` — Missing both programId and activityId.
- `500 Internal Server Error`

---

### **GET /shiftsAction/{id} (PRIVATE)**

**Description:** Partially update an existing shift log in SMUM_ShiftLogs. Only the fields you send are modified. Send a field as null to remove it. This is not an upsert—fails if the ShiftId doesn’t exist.

**Path Parameter:**
	•	id — Shift ID (UUID)

**Request Headers:**
	•	Content-Type: application/json

**Request Body (any subset):**
```json
{
  "Action": "string",                         // e.g., "check-in" | "check-out" | custom
  "ActivityId": "string",                     // stored as string
  "Date": "YYYY-MM-DD",
  "ProgramId": "string",                      // stored as string
  "TimestampIn": "ISO-8601 datetime",
  "TimestampOut": "ISO-8601 datetime",
  "VolunteerId": "string"
}
```

**Responses:**

•	200 OK — Returns the updated item:
```json
{
  "id": "string",
  "Action": "string",
  "ActivityId": "string",
  "Date": "YYYY-MM-DD",
  "ProgramId": "string",
  "TimestampIn": "ISO-8601",
  "TimestampOut": "ISO-8601",
  "VolunteerId": "string"
}
```
•	400 Bad Request — Missing/invalid JSON body or no updatable fields supplied.
•	404 Not Found — ShiftId does not exist.
•	500 Internal Server Error


### **POST /email (PUBLIC)**

**Description:** Send an email via the platform (front-end uses this to deliver messages such as confirmations or notifications).

**Request Body:**
```json
{
  "to": "string | string[]",
  "subject": "string",
  "text": "string (optional)",
  "html": "string (optional)"
}
```
At least one of text or html is required.

**Responses:**
- `200 OK` — { "messageId": "string" } Email accepted by the mail provider.
- `400 Bad Request` — Missing required fields or invalid payload (e.g., no to, neither text nor html).
- `429 Too Many Requests` — Too Many Requests — (Optional) Throttled if request rate is exceeded.
- `500 Internal Server Error` — Unexpected error sending the email.