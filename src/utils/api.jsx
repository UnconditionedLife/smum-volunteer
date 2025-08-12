const API_BASE = "https://hjfje6icwa.execute-api.us-west-2.amazonaws.com/prod"; // XXX need dev version too?

/*
    In
        firstName
        lastName
        telephone
        email
        programId
    Out
        id
        regComplete

    Always returns an id for the volunteer, either an existing one looked up by name, telephone,
    and email, or the id of a newly created volunteer entry. Also returns attributes of this
    volunteer (currently only regComplete, meaning the volunteer has accepted all conditions
    of volunteering).
*/
export async function registerVolunteer(firstName, lastName, telephone, email, programId) {
    const complete = (firstName == "Merlin"); // XXX return from Register API

    const response = await fetch(`${API_BASE}/volunteers/public`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            "firstName": firstName,
            "lastName": lastName, 
            "telephone": telephone, 
            "email": email,
            "programId": programId 
        })
    });

    const data = await response.json();
    if (!response.ok) 
        throw new Error(data.message || "Failed to register");
    else
        console.log(data)
        return data;
    }

/*
    In
        volunteerId
        attrs
    Out
        attrs

    Sets attributes of the specified volunteer, currently only the regComplete attribute.
*/
// export async function setVolunteerAttrs(volunteerId, attrs) {
//     // XXX call API to set updated attributes ––– TODO NEW API
//     return attrs;
// }

export async function updateVolunteer(volunteerId, updates = {}) {
    
    if (!volunteerId) throw new Error("Missing volunteer id");

    // Prepare a minimal body: only include provided fields
    const body = {};
    if (updates.firstName !== undefined) body.firstName = String(updates.firstName);
    if (updates.lastName  !== undefined) body.lastName  = String(updates.lastName);
    if (updates.telephone !== undefined) {
        // normalize like the Lambda does
        body.telephone = String(updates.telephone).replace(/\D/g, "");
    }
    if (updates.email !== undefined) {
        body.email = String(updates.email).trim().toLowerCase();
    }
    if (updates.programId !== undefined) body.programId = String(updates.programId);
    if (typeof updates.regComplete === "boolean") body.regComplete = updates.regComplete;

    if (Object.keys(body).length === 0) {
        throw new Error("No updatable fields provided");
    }

    const url = `${API_BASE}/volunteers/public/${encodeURIComponent(volunteerId)}`;

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    let data;
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const msg = data?.message || `Update failed (${response.status} ${response.statusText})`;
        throw new Error(msg);
    }

    // Example Lambda response shape:
    // { VolunteerId, firstName, lastName, telephone, email, ProgramId, RegComplete }
  return data;
}

/*
    In
        volunteerId
        action - "sign-in", "sign-out"
        activityId
    Out
        None

    Adds a record to the shift table reflecting the beginning or end of a volunteer shift.
    Program id is not included as an input parameter but should be saved in the shift
    record based on the volunteer's current program id at the time of call.
*/
export async function logAction(volunteerId, action, activityId) {
    console.log("volunteerId:", volunteerId, "action:", action, "activityId:", activityId)
    
    const timestamp = new Date().toISOString();
    const programId = 0; // XXX lambda function should get this from volunteer's current program // TODO GET PROGRAM FROM USER RECORD
    const response = await fetch(`${API_BASE}/shiftAction`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            volunteerId,
            action,
            timestamp,
            activityId,
            programId, 
        })
    });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to log action");
  return data;
}

/* Retrieve programs and activities */

export async function getPrograms() {
  const response = await fetch(`${API_BASE}/programs`);
  if (!response.ok) throw new Error("Failed to fetch programs");
  return await response.json();
}

export async function getActivities() {
  const response = await fetch(`${API_BASE}/activities`);
  if (!response.ok) throw new Error("Failed to fetch activities");
  return await response.json();
}

/* Manage client-side cookies */

export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

export function setCookie(name, value, days = 1) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

export function deleteCookie(name) {
    setCookie(name, '', -1);
}