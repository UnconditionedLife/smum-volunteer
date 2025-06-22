const API_BASE = "https://hjfje6icwa.execute-api.us-west-2.amazonaws.com/prod";

export async function registerVolunteer(volunteerId, fullName, telephone, email, programId ) {

    console.log("volunteerId:", volunteerId, "fullName:", fullName, "telephone:", telephone, "programId:", programId )

    const response = await fetch(`${API_BASE}/volunteers`, {
        method: "PUT",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            "volunteerId": volunteerId, 
            "fullName": fullName, 
            "telephone": telephone, 
            "email": email, 
            "programId": programId 
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to register");
    return data;
    }

export async function logAction(volunteerId, action, activityId, programId) {

    console.log("volunteerId:", volunteerId, "action:", action, "activityId:", activityId, "programId:", programId )
    
    const timestamp = new Date().toISOString();
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
        programId
        })
    });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to log action");
  return data;
}

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