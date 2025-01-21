const { command } = require("../lib");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fileType = require('file-type');
const FormData = require('form-data');
const fetch = require('node-fetch');

const MAX_FILE_SIZE_MB = 200;

async function uploadMedia(buffer) {
  try {
    const type = await fileType.fromBuffer(buffer);
    const ext = type ? type.ext : 'bin';
    const bodyForm = new FormData();
    bodyForm.append("fileToUpload", buffer, `file.${ext}`);  // Corrected string interpolation
    bodyForm.append("reqtype", "fileupload");

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: bodyForm,
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}: ${res.statusText}`);  // Corrected string interpolation
    }

    const data = await res.text();
    return data;
  } catch (error) {
    console.error("Error during media upload:", error);
    throw new Error('Failed to upload media.');
  }
}

async function handleMediaUpload(message) {
  try {
    const mediaBuffer = await downloadMediaMessage(message, 'buffer');
    const fileSizeMB = mediaBuffer.length / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return `File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`;  // Corrected string interpolation
    }

    const mediaUrl = await uploadMedia(mediaBuffer);
    return mediaUrl;
  } catch (error) {
    console.error("Error handling media upload:", error);
    return 'Error while processing media upload.';
  }
}

command(
  {
    pattern: "url",
    desc: "Upload media (image, sticker, video) to Catbox",
    fromMe: true,
    type: "utility",
  },
  async (message, match) => {
    try {
      if (
        !message.reply_message ||
        (!message.reply_message.image &&
          !message.reply_message.sticker &&
          !message.reply_message.video)
      ) {
        return await message.reply(
          "Please reply to a message containing an image, sticker, or video."
        );
      }

      const mediaUrl = await handleMediaUpload(message.reply_message);

      if (mediaUrl.startsWith("http")) {
        await message.reply(`Media uploaded successfully: ${mediaUrl}`);  // Corrected string interpolation
      } else {
        await message.reply(mediaUrl);
      }
    } catch (error) {
      console.error("Error in upload command:", error);
      await message.reply("Failed to upload the media. Please try again.");
    }
  }
);
