export async function generateVolunteerId(email = '', phone = '') {
    const input = (email.trim().toLowerCase() || 'none') + '|' + (phone.trim() || 'none');
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
  
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.slice(0, 12); // return first 12 hex characters
    } catch (err) {
      console.error('Error generating volunteer ID:', err);
      return null;
    }
  }