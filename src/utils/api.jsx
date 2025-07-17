import { generateVolunteerId } from './generateVolunteerId';

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

    const volunteerId = await generateVolunteerId(email, telephone);
    const response = await fetch(`${API_BASE}/volunteers`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            "volunteerId": volunteerId, 
            "fullName": firstName + " " + lastName, 
            "telephone": telephone, 
            "email": email, 
            "programId": programId 
        })
    });

    const data = await response.json();
    if (!response.ok) 
        throw new Error(data.message || "Failed to register");
    else
        // return data;
        return {id: volunteerId, regComplete: complete};
    }

/*
    In
        volunteerId
        attrs
    Out
        attrs

    Sets attributes of the specified volunteer, currently only the regComplete attribute.
*/
export async function setVolunteerAttrs(volunteerId, attrs) {
    // XXX call API to set updated attributes
    return attrs;
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
    const programId = 0; // XXX lambda function should get this from volunteer's current program
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