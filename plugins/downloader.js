const { command, isPrivate, getJson } = require("../lib/");

const apiKey = "nikka"; // API key for the search
const searchApi = "https://nikka-api.us.kg/search/yts?q="; // Search API URL
const downloadApi = "https://api.siputzx.my.id/api/d/ytmp3?url=https://youtube.com/watch?v="; // Download API URL
const imageUrl = "https://files.catbox.moe/flinnf.jpg"; // Developer image
const thumbnailUrl = "https://files.catbox.moe/cuu1aa.jpg"; // Thumbnail image

// Search command to find songs based on the user's query
command(
  {
    pattern: "song ?(.*)",
    fromMe: false,
    desc: "Search for songs using a keyword and download the first result",
    type: "downloader",
  },
  async (message, match) => {
    try {
      const query = match.trim();
      if (!query) return message.reply("Please provide a search query.\nExample: `.search Shape of You`");

      const apiUrl = `${searchApi}${encodeURIComponent(query)}&apiKey=${apiKey}`;
      const response = await getJson(apiUrl);

      const results = response?.data || [];
      if (results.length === 0) {
        return message.reply("No results found for your query.");
      }

      // Automatically get the first result's videoId
      const firstResult = results[0];
      const videoId = firstResult.videoId;

      // Send the search result with the image and thumbnail
      let responseMessage = `*Search Results for "${query}":*\n\n`;
      responseMessage += `1. *${firstResult.title}*\n   - Duration: ${firstResult.duration.timestamp}\n   - Views: ${firstResult.views.toLocaleString()} views\n   - By: ${firstResult.author.name}\n\n`;
      responseMessage += "Downloading the first result...";

      await message.client.sendMessage(message.jid, {
        image: { url: imageUrl },
        caption: responseMessage,
        contextInfo: {
          externalAdReply: {
            title: `Search Result: ${firstResult.title}`,
            body: "First Result",
            sourceUrl: "https://haki.us.kg", // Link to your website
            mediaUrl: "https://haki.us.kg", // Additional URL
            mediaType: 4,
            showAdAttribution: true,
            renderLargerThumbnail: false,
            thumbnailUrl: thumbnailUrl,
          },
        },
      });

      // Fetch the download URL for the first result
      const downloadUrl = `${downloadApi}${videoId}`;
      const downloadResponse = await getJson(downloadUrl);

      // Check if the download response is valid
      if (downloadResponse.status) {
        const audioUrl = downloadResponse.data.dl;
        const audioTitle = downloadResponse.data.title;

        // Send the audio file to the user
        await message.client.sendMessage(message.jid, {
          audio: { url: audioUrl },
          caption: `*${audioTitle}*`,
          mimetype: "audio/mpeg",
        });
      } else {
        return message.reply("Error downloading the song. Please try again.");
      }
    } catch (error) {
      console.error(error);
      return message.reply("An error occurred while searching or downloading. Please try again.");
    }
  }
);





command(
    {
        pattern: "apk",
        desc: "Downloads APKs",
        fromMe: isPrivate,
        type: "downloader",
    },
    async (message, match) => {
      const query = match.trim();
        if (!query) {
            return await message.sendMessage("Please provide the app name to search.");
        }

        try {
            // Fetch APK details from the API
            const res = await getJson(
                `https://api.nexoracle.com/downloader/apk?apikey=free_key@maher_apis&q=${encodeURIComponent(query)}`
            );

            // Debugging API response
            console.log("API Response:", res);

            // Validate response
            if (!res || !res.result) {
                return await message.sendMessage(
                    "Could not find the APK details. Please check the app name and try again."
                );
            }

            const { name, lastup, size, dllink, icon } = res.result || {};

            // Check mandatory fields
            if (!dllink || !name || !size) {
                return await message.sendMessage(
                    "The APK details for the provided app are unavailable. Please try another app."
                );
            }

            const lastUpdate = lastup || "Not available";
            const apkIcon = icon || "https://files.catbox.moe/cuu1aa.jpg"; // Default icon

            // Prepare the response text
            const text = `
*📥 APK Downloader*

*Name:* ${name}
*Last Updated:* ${lastUpdate}
*Size:* ${size}

_Downloading the file. This may take some time._
            `;

            // Send the message with APK details
            await message.client.sendMessage(message.jid, {
                image: { url: apkIcon },
                caption: text.trim(),
                contextInfo: {
                    externalAdReply: {
                        title: "APK Download Service",
                        body: "Powered by Nikka-MD",
                        sourceUrl: "https://haki.us.kg", // Change this to your site
                        mediaUrl: "https://haki.us.kg",  // Change this to your site
                        mediaType: 4,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                        thumbnail: { url: apkIcon }, // Thumbnail for externalAdReply
                    },
                },
            });

            // Send the APK file
            await message.client.sendMessage(
                message.jid,
                {
                    document: { url: dllink },
                    fileName: `${name}.apk`,
                    mimetype: "application/vnd.android.package-archive",
                },
                { quoted: message }
            );
        } catch (error) {
            console.error("Error fetching APK:", error);

            // Send user-friendly error message
            await message.sendMessage(
                "An error occurred while fetching the APK. Please try again later or contact support."
            );
        }
    }
);
command(
    {
        pattern: "rwfw",
        desc: "Downloading media",
        type: "downloader",
        fromMe: isPrivate,
    },
    async (message, match) => {
      const query = match.trim();
        try {
            if (!query) {
                return await message.reply("Provide a media query.");
            }

            const response = await getJson(`https://api.giftedtech.my.id/api/search/yts?apikey=king_haki-k7gjd8@gifted_api&query=${query}`);
            
            // Check if results exist
            if (!response || !response.results || response.results.length === 0) {
                return await message.reply("No media found for the given query.");
            }

            const res = response.results[0];
            
            const responsedl = await getJson(`https://api.giftedtech.my.id/api/download/ytmp3?apikey=king_haki-k7gjd8@gifted_api&url=${res.url}`);

            // Check if download URL exists
            if (!responsedl || !responsedl.result) {
                return await message.reply("Failed to retrieve download URL.");
            }

            const resdl = responsedl.result; // Corrected this line

            const text = `
Nikka MD Media Downloader

*Name*: ${res.title}
*Description*: ${res.description}
*URL*: ${res.url}
            `;

            // Send the image with the text as a caption
            await message.client.sendMessage(message.jid, {
                image: { url: res.image }, // Image URL from API response
                caption: text, // Text as caption
            });
            
            // Send the audio with the caption
            await message.client.sendMessage(message.jid, {
                audio: { url: `${resdl.download_url}` }, // Directly using resdl
                caption: `*${res.title}*`,
                mimetype: "audio/mpeg",
            });
        } catch (error) {
            console.error(error);
            await message.reply("if your seeing this error, jusr redo the command it will work");
        }
    }
);
command(
    {
        pattern: "vid",
        desc: "Downloading media",
        type: "downloader",
        fromMe: isPrivate,
    },
    async (message, match) => {
      const query = match.trim();
        try {
            if (!query) {
                return await message.reply("Provide a media query.");
            }

            const response = await getJson(`https://api.giftedtech.my.id/api/search/yts?apikey=king_haki-k7gjd8@gifted_api&query=${query}`);
            
            // Check if results exist
            if (!response || !response.results || response.results.length === 0) {
                return await message.reply("No media found for the given query.");
            }

            const res = response.results[0];
            
            const responsedl = await getJson(`https://api.giftedtech.my.id/api/download/ytmp4?apikey=king_haki-k7gjd8@gifted_api&url=${res.url}`);

            // Check if download URL exists
            if (!responsedl || !responsedl.result) {
                return await message.reply("Failed to retrieve download URL.");
            }

            const resdl = responsedl.result; // Corrected this line

            const text = `
Nikka MD Media Downloader

*Name*: ${res.title}
*Description*: ${res.description}
*URL*: ${res.url}
            `;

            // Send the image with the text as a caption
            await message.client.sendMessage(message.jid, {
                image: { url: res.image }, // Image URL from API response
                caption: text, // Text as caption
            });
            
            // Send the audio with the caption
            await message.client.sendMessage(message.jid, {
                video: { url: `${resdl.download_url}` }, // Directly using resdl
                caption: `*${res.title}*`,
                mimetype: "video/mp4",
            });
        } catch (error) {
            console.error(error);
            asait
            await message.reply(error);
        }
    }
);
/*const { command } = require("../lib");
const axios = require("axios"); */

command(
  {
    pattern: "fb",
    fromMe: true,
    desc: "Download Facebook reels",
    type: "downloader",
  },
  async (message, match) => {
    try {
      let url = match;
      if (!url && message.reply_message) {
        url = message.reply_message.text.match(/https?:\/\/[^\s]+/g)?.[0];
      }

      if (!url) {
        return await message.reply("Please provide a valid Facebook reel URL.");
      }

      const apiUrl = `https://api.nexoracle.com/downloader/facebook?apikey=free_key@maher_apis&url=${url}`;
      const response = await axios.get(apiUrl);

      if (!response.data || !response.data.result || !response.data.result.HD) {
        return await message.reply("Failed to fetch the video. Please check the URL or try again.");
      }

      const videoUrl = response.data.result.HD;

      await message.sendFromUrl(videoUrl, {
        mimetype: "video/mp4",
        caption: "Here's your Facebook reel!",
      });
    } catch (error) {
      console.error("Error in fbdown command:", error.message);
      await message.reply("An error occurred while downloading the Facebook reel.");
    }
  }
);
command(
    {
        pattern: "tiktok",
        desc: "TikTok video downloader",
        type: "downloader",
        fromMe: isPrivate,
    },
    async (message, match) => {
      
        if (!match) {
            return await message.sendMessage("Please provide a TikTok URL.");
        }

        // Improved TikTok URL validation
        const tiktokRegex = /^(https?:\/\/)?(www\.)?(tiktok\.com\/|vm\.tiktok\.com\/).+/;
        if (!tiktokRegex.test(match.trim())) {
            return await message.sendMessage("Invalid TikTok URL provided.");
        }

       // await message.react("⏳️");

        try {
            // Fetch video data from API
            const apiUrl = `https://nikka-api.us.kg/dl/tiktok?apiKey=nikka&url=${encodeURIComponent(match.trim())}`;
            const response = await getJson(apiUrl);

            // Check for a successful response
            if (!response || !response.data) {
                throw new Error("Failed to fetch video data.");
            }

            const videoUrl = response.data;

            // Send video to the user
            await message.client.sendMessage(message.jid, {
                video: { url: videoUrl },
                caption: "> Powered by Nikka Botz",
                mimetype: "video/mp4",
            });

           // await message.react("✅️");
        } catch (error) {
            // Handle errors gracefully
            await message.sendMessage(`Failed to download video. Error: ${error.message}`);
            await message.react("❌️");
        }
    }
);


command(
  {
    pattern: "yts",
    fromMe: true,
    desc: "Search YouTube and fetch video details",
    type: "search",
  },
  async (message, match) => {
    try {
      if (!match) {
        await message.react("❌️");
        return await message.reply("Please provide a search term.");
      }

      await message.react("⏳️");

      // Parse query and optional limit
      const [query, limit] = match.split(",").map((item) => item.trim());
      const maxResults = limit && !isNaN(limit) ? parseInt(limit) : null;

      const response = await getJson(`https://nikka-api.us.kg/search/yts?apiKey=nikka&q=${query}`);

      if (!response || !response.data || response.data.length === 0) {
        await message.react("❌️");
        return await message.reply("No results found for your query.");
      }

      // Limit results if a valid limit is provided
      const results = response.data.slice(0, maxResults || response.data.length).map((res, index) => {
        return `
📌 **Result ${index + 1}:**
> **Title:** ${res.title || "N/A"}
> **Description:** ${res.description || "N/A"}
> **URL:** ${res.url || "N/A"}
        `;
      }).join("\n\n");

      await message.client.sendMessage(
        message.jid,
        {
          text: `🎥 **YouTube Search Results:**\n\n${results}`,
        }
      );

      await message.react("✅️");
    } catch (error) {
      console.error("Error in yts command:", error);
      await message.react("❌️");
      await message.reply("An error occurred while fetching YouTube search results.");
    }
  }
);
command(
  {
    pattern: "ytmp3",
    fromMe: true,
    desc: "Download YouTube audio",
    type: "download",
  },
  async (message, match) => {
    if (!match)
      return await message.reply("❌ Please provide a YouTube URL.");

    const apiUrl = `https://api.giftedtech.my.id/api/download/ytaudio?apikey=gifted&url=${match}`;

    try {
      await message.react("⏳"); // Reacting to show process has started

      const response = await getJson(apiUrl);

      if (response.status !== 200 || !response.success)
        return await message.reply("❌ Failed to fetch audio. Please try again.");

      const { title, download_url } = response.result;

      await message.reply(`Now downloading: *${title}*...`);
      await message.client.sendMessage(message.jid, {
        audio: { url: download_url },
        mimetype: "audio/mpeg",
        caption: `🎶 *${title}* - Downloaded successfully!`,
      });

      await message.react("✅"); // Reacting to show success
    } catch (error) {
      console.error("Error in ytmp3 command:", error);
      await message.reply("❌ An error occurred while processing your request.");
      await message.react("❌"); // Reacting to show failure
    }
  }
);



command(
  {
    pattern: "ytmp4",
    fromMe: true,
    desc: "Download YouTube video",
    type: "download",
  },
  async (message, match) => {
    if (!match)
      return await message.reply("❌ Please provide a YouTube URL.");

    const apiUrl = `https://api.giftedtech.my.id/api/download/ytvideo?apikey=gifted&url=${match}`;

    try {
      await message.react("⏳"); // Reacting to show process has started

      const response = await getJson(apiUrl);

      if (response.status !== 200 || !response.success)
        return await message.reply("❌ Failed to fetch video. Please try again.");

      const { title, download_url } = response.result;

      await message.reply(`Now downloading: *${title}*...`);
      await message.client.sendMessage(message.jid, {
        video: { url: download_url },
        mimetype: "video/mp4",
        caption: `🎬 *${title}* - Downloaded successfully!`,
      });

      await message.react("✅"); // Reacting to show success
    } catch (error) {
      console.error("Error in ytmp4 command:", error);
      await message.reply("❌ An error occurred while processing your request.");
      await message.react("❌"); // Reacting to show failure
    }
  }
);
command(
  {
    pattern: "sendfile ?(.*)",
    fromMe: true,
    desc: "Send media from a direct URL",
    type: "download",
  },
  async (message, match) => {
    const url = match.trim();

    if (!url) {
      await message.react("❌");
      return await message.reply("*_Please provide a valid URL to send media._*");
    }

    try {
      await message.react("⏳"); // React with "pending"
      await message.sendFromUrl(url);
      await message.react("✅"); // React with "successful"
      
    } catch (err) {
      await message.react("❌"); // React with "error"
      console.error(err);
      await message.reply("*_Failed to send media. Please check the URL and try again._*");
    }
  }
);

command(
    {
        pattern: "play",
        desc: "Plays music",
        type: "downloader",
        fromMe: true
    },
    async (message, match) => {
        if (!match) return await message.reply("Provide a song query.");

        try {
            await message.react("⏳️");

            // Fetch data from API
            const response = await getJson(`https://nikka-api.us.kg/search/yts?q=${match}&apiKey=nikka`);

            const results = response.data;

            // Check if data is available
            if (!results || !Array.isArray(results) || results.length === 0) {
                return await message.reply("No results found for your query. Please try again.");
            }

            // Pick the first result
            const res = results[0];

            // Check if necessary fields are present
            if (!res.url || !res.title || !res.author || !res.thumbnail) {
                return await message.reply("Could not fetch the song details. Please try again.");
            }

            const aud = `https://ironman.koyeb.app/ironman/dl/yta?url=${res.url}`;
            const text = `_*NOW DOWNLOADING ${res.title} by ${res.author.name}*_`;

            await message.client.sendMessage(message.jid, {
                audio: { url: aud },
                mimetype: "audio/mpeg",
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: res.title,
                        body: "Powered by Nikka Botz",
                        sourceUrl: "https://whatsapp.com/channel/0029VaoLotu42DchJmXKBN3L",
                        mediaUrl: res.url,
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: true,
                        thumbnailUrl: res.thumbnail
                    }
                }
            });

            await message.react("✅️");
        } catch (error) {
            console.error("Error:", error);
            await message.react("❌️");
            await message.reply("An error occurred while processing your request.");
        }
    }
);
command(
  {
    pattern: 'spot',
    desc: 'Download music from Spotify',
    fromMe: true,
    type: 'utility',
  },
  async (message, match) => {
    if (!match) {
      return await message.reply(
        'Please provide a search query. Example:\nspot fly me to the moon'
      );
    }

    const apiKey = 'nikka'; // Replace with your actual API key
    const apiUrl = `https://nikka-api.us.kg/dl/spotify?q=${encodeURIComponent(
      match
    )}&apiKey=${apiKey}`;

    try {
      await message.react("⌛"); // React with loading icon

      const response = await axios.get(apiUrl);
      const { data } = response;

      if (!data?.data?.status) {
        await message.react("⛔"); // React with failure icon
        return await message.reply('Failed to fetch the Spotify download URL.');
      }

      const { title, artist, downloadUrl } = data.data.result;

      if (!downloadUrl) {
        await message.react("⛔"); // React with failure icon
        return await message.reply('No download URL available for this song.');
      }

      // React with success before sending the audio
      await message.react("✅");

      // Send the song details and the download URL
      await message.reply(
        `🎵 *Title:* ${title}\n👤 *Artist:* ${artist}\n\nDownloading...`
      );

      // Send the audio file
      await message.sendFromUrl(downloadUrl);
    } catch (error) {
      console.error('Error in Spotify downloader command:', error);
      await message.react("⛔"); // React with failure icon
      await message.reply(
        'An error occurred while processing your request. Please try again later.'
      );
    }
  }
);
