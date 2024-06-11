"use server"
import { cookies } from 'next/headers'

// // Inital retrieval of the API token associated with the user
// export async function getDiscordAccessData(code: string) {
//   'use server';
//   // Debug Log
//   console.log(`Attempting to retreive user access data with code ${code}...`)

//   const reqData = {
//     'grant_type': 'authorization_code',
//     'code': code,
//     'redirect_uri': process.env.NEXT_PUBLIC_REDIRECT_URI
//   }
//   const headers = {
//     'Content-Type': 'application/x-www-form-urlencoded'
//   }
// 	try {
//     // Send request to Discord API
// 		const res = await fetch(`${process.env.NEXT_PUBLIC_DISCORD_API_ENDPOINT}/oauth2/token`, {
//       method: "POST",
//       headers: headers,
//       body: JSON.stringify(reqData),
//     });
// 		const jsonData = await res.json();
// 		// Store Data locally
//     cookies().set("discord_access_token", jsonData.access_token);
//     cookies().set("discord_token_type", jsonData.token_type);
//     cookies().set("discord_expires_in", jsonData.expires_in);
//     cookies().set("discord_refresh_token", jsonData.refresh_token);
//     cookies().set("discord_scope", jsonData.scope);
//     // Return true
//     return true;
// 	} catch (err) {
// 		console.log(err);
// 	}
// };

// Refresh the API token associated with the user
export const refreshDiscordAPIToken = async () => {
  const reqData = {
    'grant_type': 'refresh_token',
    'refresh_token': cookies().get('discord_refresh_token'),
  }
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_DISCORD_API_ENDPOINT}/oauth2/token`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(reqData),
    });
		const jsonData = await res.json();
		// Store Data locally
    cookies().set("discord_access_token", jsonData.access_token);
    cookies().set("discord_token_type", jsonData.token_type);
    cookies().set("discord_expires_in", jsonData.expires_in);
    cookies().set("discord_refresh_token", jsonData.refresh_token);
    cookies().set("discord_scope", jsonData.scope);
    // Return true
    return true;
	} catch (err) {
		console.log(err);
	}
};

// Revoke the API token associated with the user
export const revokeDiscordAPIToken = async () => {
  const reqData = {
    'token_type_hint': 'access_token',
    'token': cookies().get('discord_access_token'),
  }
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_DISCORD_API_ENDPOINT}/oauth2/token/revoke`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(reqData),
    });
		const jsonData = await res.json();
		// Store Data locally
    cookies().delete("discord_access_token");
    cookies().delete("discord_token_type");
    cookies().delete("discord_expires_in");
    cookies().delete("discord_refresh_token");
    cookies().delete("discord_scope");
    // Return true
    return true;
	} catch (err) {
		console.log(err);
	}
};

// Retrieve user data from discord
export const getDiscordUserData = async () => {
  console.log("Attempting to get user data...")
	try {
    const headers = {
      'Authorization': `${cookies().get('discord_token_type')} ${cookies().get('discord_access_token')}`,
      "Content-Type": "application/x-www-form-urlencoded" 
    }
    console.log(headers); // DEBUG LOG
    // Send request to Discord API
		const res = await fetch(`https://discordapp.com/api/users/@me`, {
      method: "GET",
      headers: headers
    });
		const jsonData = await res.json();
    // Return user data
    return jsonData;
	} catch (err) {
		console.log(err);
	}
};

