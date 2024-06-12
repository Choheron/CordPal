// "use server"

// // Revoke the API token associated with the user
// export const revokeDiscordAPIToken = async () => {
//   const reqData = {
//     'token_type_hint': 'access_token',
//     'token': cookies().get('discord_access_token'),
//   }
//   const headers = {
//     'Content-Type': 'application/x-www-form-urlencoded'
//   }
// 	try {
// 		const res = await fetch(`${process.env.NEXT_PUBLIC_DISCORD_API_ENDPOINT}/oauth2/token/revoke`, {
//       method: "POST",
//       headers: headers,
//       body: JSON.stringify(reqData),
//     });
// 		const jsonData = await res.json();
// 		// Store Data locally
//     cookies().delete("discord_access_token");
//     cookies().delete("discord_token_type");
//     cookies().delete("discord_expires_in");
//     cookies().delete("discord_refresh_token");
//     cookies().delete("discord_scope");
//     // Return true
//     return true;
// 	} catch (err) {
// 		console.log(err);
// 	}
// };

// // Retrieve user data from discord
// export const getDiscordUserData = async () => {
//   console.log("Attempting to get user data...")
// 	try {
//     const headers = {
//       'Authorization': `${cookies().get('discord_token_type')} ${cookies().get('discord_access_token')}`,
//       "Content-Type": "application/x-www-form-urlencoded" 
//     }
//     console.log(headers); // DEBUG LOG
//     // Send request to Discord API
// 		const res = await fetch(`https://discordapp.com/api/users/@me`, {
//       method: "GET",
//       headers: headers
//     });
// 		const jsonData = await res.json();
//     // Return user data
//     return jsonData;
// 	} catch (err) {
// 		console.log(err);
// 	}
// };

