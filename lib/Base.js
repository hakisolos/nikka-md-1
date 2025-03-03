
"use strict";
const fileType = require("file-type");
const config = require("../config");
const {
  isUrl,
  getBuffer,
  writeExifImg,
  writeExifVid,
  writeExifWebp,
  tiny,
  parseJid,
  getRandom,
  isNumber,
  decodeJid,
} = require(".");
const fs = require("fs");
const { connected } = require("process");
const {
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateWAMessage,
  prepareWAMessageMedia,
  proto,
  generateWAMessageContent,
} = require("@whiskeysockets/baileys");

class Base {
  constructor(client, msg) {
    Object.defineProperty(this, "client", { value: client });
    Object.defineProperty(this, "m", { value: msg });
  }

  _clone() {
    return Object.assign(Object.create(this), this);
  }

  _patch(data) {
    return data;
  }
}

class Video extends Base {
  constructor(client, data, msg) {
    super(client);
    if (data) this._patch(data, msg);
  }

  _patch(data, msg) {
    this.isGroup = data.isGroup;
    this.id = data.key.id === undefined ? undefined : data.key.id;
    this.jid = data.key.remoteJid;
    this.pushName = data.pushName;
    this.participant = data.sender;
    this.sudo = config.SUDO.split(",").includes(this.participant.split("@")[0]);
    this.caption = data.body;
    this.fromMe = data.key.fromMe;
    this.timestamp =
      typeof data.messageTimestamp === "object"
        ? data.messageTimestamp.low
        : data.messageTimestamp;
    this.key = data.key;
    this.message = data.message.videoMessage;
    if (data.quoted) {
      this.reply_message = data.quoted;
    } else {
      this.reply_message = false;
    }

    return super._patch(data);
  }
}

class Image extends Base {
  constructor(client, data, msg) {
    super(client);
    if (data) this._patch(data, msg);
  }

  _patch(data, msg) {
    this.isGroup = data.isGroup;
    this.id = data.key.id === undefined ? undefined : data.key.id;
    this.jid = data.key.remoteJid;
    this.pushName = data.pushName;
    this.participant = data.sender;
    this.sudo = config.SUDO.split(",").includes(this.participant.split("@")[0]);
    this.caption = data.body;
    this.fromMe = data.key.fromMe;
    this.timestamp =
      typeof data.messageTimestamp === "object"
        ? data.messageTimestamp.low
        : data.messageTimestamp;
    this.key = data.key;
    this.message = data.message.imageMessage;
    if (data.quoted) {
      this.reply_message = data.quoted;
    } else {
      this.reply_message = false;
    }

    return super._patch(data);
  }

  async reply(text, opt = { withTag: true }) {
    const nikk = {
      key: {
        remoteJid: 'status@broadcast',
        fromMe: false,
        participant: '0@s.whatsapp.net',
      },
      message: {
        listResponseMessage: {
          title: `𝞠𝞗𝙒𝞢𝞒𝞢𝘿 𝞑𝙔 𝞖𝞓𝞙𝞘 𝞦𝞢𝞒`,
        },
      },
    };

    return this.client.sendMessage(
      this.jid,
      {
        text: require("util").format(text),
        ...opt,
      },
      { ...opt, quoted: nikk }
    );
  }
}

class Message extends Base {
  constructor(client, data, msg) {
    super(client, data);
    if (data) this._patch(data, msg);
  }
  _patch(data, msg) {
    this.user = decodeJid(this.client.user.id);
    this.key = data.key;
    this.isGroup = data.isGroup;
    this.prefix = data.prefix;
    this.id = data.key.id === undefined ? undefined : data.key.id;
    this.jid = data.key.remoteJid;
    this.message = { key: data.key, message: data.message };
    this.pushName = data.pushName;
    this.participant = data.sender;
    this.sudo = config.SUDO?.split(",").includes(this.jid.split("@")[0]);
    this.text = data.body;
    this.fromMe = data.key.fromMe;
    //this.message = data.me;
    this.timestamp =
      typeof data.messageTimestamp === "object"
        ? data.messageTimestamp.low
        : data.messageTimestamp;

    if (
      data.message.hasOwnProperty("extendedTextMessage") &&
      data.message.extendedTextMessage.hasOwnProperty("contextInfo") === true &&
      data.message.extendedTextMessage.contextInfo.hasOwnProperty(
        "mentionedJid"
      )
    ) {
      this.mention = data.message.extendedTextMessage.contextInfo.mentionedJid;
    } else {
      this.mention = false;
    }

    if (
      data.message.hasOwnProperty("extendedTextMessage") &&
      data.message.extendedTextMessage.hasOwnProperty("contextInfo") === true &&
      data.message.extendedTextMessage.contextInfo.hasOwnProperty(
        "quotedMessage"
      )
    ) {
      this.reply_message = new ReplyMessage(
        this.client,
        data.message.extendedTextMessage.contextInfo,
        data
      );
      this.reply_message.type = data.quoted.type || "extendedTextMessage";
      this.reply_message.mtype = data.quoted.mtype;
      this.reply_message.mimetype = data.quoted.text.mimetype || "text/plain";
      this.reply_message.key = data.quoted.key;
      this.reply_message.message = data.quoted.message;
    } else {
      this.reply_message = false;
    }

    return super._patch(data);
  }
  async log() {
    console.log(this.data);
  }
  async sendFile(content, options = {}) {
    let { data } = await this.client.getFile(content);
    let type = await fileType.fromBuffer(data);
    return this.client.sendMessage(
      this.jid,
      { [type.mime.split("/")[0]]: data, ...options },
      { ...options }
    );
  }
  
  async sendSlide(jid, title, msgText, m, footer, slides) {
    try {
      const cards = await Promise.all(slides.map(async ([
        imageUrl,
        slideTitle,
        bodyText,
        footerText,
        buttonText,
        commandId,
        buttonType,
        buttonUrl
      ]) => {
        const buttonParams = this.buildButtonParams(buttonType, buttonText, commandId, buttonUrl);

        const mediaMessage = await prepareWAMessageMedia(
          { image: { url: imageUrl } },
          { upload: this.client.waUploadToServer }
        );

        return {
          body: proto.Message.InteractiveMessage.Body.fromObject({
            text: bodyText
          }),
          footer: proto.Message.InteractiveMessage.Footer.fromObject({
            text: footerText
          }),
          header: proto.Message.InteractiveMessage.Header.fromObject({
            title: slideTitle,
            hasMediaAttachment: true,
            ...mediaMessage
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [{
              name: buttonType,
              buttonParamsJson: JSON.stringify(buttonParams)
            }]
          })
        };
      }));

      const messageContent = {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
              body: proto.Message.InteractiveMessage.Body.fromObject({
                text: msgText
              }),
              footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: footer
              }),
              header: proto.Message.InteractiveMessage.Header.fromObject({
                title: title,
                subtitle: title,
                hasMediaAttachment: false
              }),
              carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                cards: cards
              }),
              contextInfo: {
                mentionedJid: m ? [m.sender] : [],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: '120363315875885444@newsletter',
                  newsletterName: "H4KI XER",
                  serverMessageId: 143
                }
              }
            })
          }
        }
      };

      const generatedMessage = generateWAMessageFromContent(
        jid,
        messageContent,
        {
          quoted: m,
          userJid: this.client.user.id
        }
      );

      await this.client.relayMessage(jid, generatedMessage.message, {
        messageId: generatedMessage.key.id
      });

      return generatedMessage;
    } catch (error) {
      console.error('Error in sendSlide:', error);
      throw error;
    }
  }

  buildButtonParams(buttonType, textCommand, command, url) {
    switch (buttonType) {
      case "cta_url":
        return {
          display_text: textCommand,
          url: url,
          merchant_url: url
        };
      case "cta_call":
      case "quick_reply":
        return {
          display_text: textCommand,
          id: command
        };
      case "cta_copy":
        return {
          display_text: textCommand,
          id: "",
          copy_code: command
        };
      case "cta_reminder":
      case "cta_cancel_reminder":
      case "address_message":
        return {
          display_text: textCommand,
          id: command
        };
      case "send_location":
        return {};
      default:
        return {};
    }
  }
  
  async reply(text, opt = {}) {
      const nik = {
        key: {
                remoteJid: 'status@broadcast',
                fromMe: false,
                participant: '0@s.whatsapp.net'
        },
        message: {
            listResponseMessage: {
            title: `𝞠𝞗𝙒𝞢𝞒𝞢𝘿 𝞑𝙔 𝞖𝞓𝞙𝞘 𝞦𝞢𝞒`
        }
    }
   }
    return this.client.sendMessage(
      this.jid,
      {
        text: require("util").format(text),
        ...opt,
      },
      { ...opt, quoted: nik }
    );
  }
  async sendPoll(jid, question, options, pollType = 0) {
  const pollMessage = {
    pollCreationMessage: {
      name: question,
      options: options.map((option) => ({ optionName: option })),
      selectableOptionsCount: pollType, // 0 for single choice, 1 for multiple choice
    },
  };
  const message = generateWAMessageFromContent(jid, proto.Message.fromObject(pollMessage), {
    userJid: this.client.user.id,
  });
  await this.client.relayMessage(jid, message.message, {
    messageId: message.key.id,
  });
  return message;
    }
  async send(jid, text, opt = {}) {
    return this.client.sendMessage(
      jid,
      {
        text: require("util").format(text),
        ...opt,
      },
      { ...opt }
    );
  }
  async sendMessage(
    content,
    opt = { packname: "Xasena", author: "X-electra" },
    type = "text"
  ) {
    switch (type.toLowerCase()) {
      case "text":
        {
          return this.client.sendMessage(
            this.jid,
            {
              text: content,
              ...opt,
            },
            { ...opt }
          );
        }
        break;
        case "react": {
        return await this.cient.sendMessage(
        this.jid,
        {
            react: {
                text: reactionText,
                key: (typeof messageObject === "object" ? messageObject : defaultKey).key,
            },
        },
        {
            messageId: this.messageId(),
        }
    );
}
    break;
      case "image":
        {
          if (Buffer.isBuffer(content)) {
            return this.client.sendMessage(
              this.jid,
              { image: content, ...opt },
              { ...opt }
            );
          } else if (isUrl(content)) {
            return this.client.sendMessage(
              this.jid,
              { image: { url: content }, ...opt },
              { ...opt }
            );
          }
        }
        break;
      case "video": {
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(
            this.jid,
            { video: content, ...opt },
            { ...opt }
          );
        } else if (isUrl(content)) {
          return this.client.sendMessage(
            this.jid,
            { video: { url: content }, ...opt },
            { ...opt }
          );
        }
      }
      break;
      case "audio":
        {
          if (Buffer.isBuffer(content)) {
            return this.client.sendMessage(
              this.jid,
              { audio: content, ...opt },
              { ...opt }
            );
          } else if (isUrl(content)) {
            return this.client.sendMessage(
              this.jid,
              { audio: { url: content }, ...opt },
              { ...opt }
            );
          }
        }
        break;
      case "template":
        let optional = await generateWAMessage(this.jid, content, opt);
        let message = {
          viewOnceMessage: {
            message: {
              ...optional.message,
            },
          },
        };
        await this.client.relayMessage(this.jid, message, {
          messageId: optional.key.id,
        });
        case "react": {
            return await this.client.sendMessage(this.jid, {
            react: {
            text: reactionText,
            key: messageKey,
        },
    });
}

        break;
      case "sticker":
        {
          let { data, mime } = await this.client.getFile(content);
          if (mime == "image/webp") {
            let buff = await writeExifWebp(data, opt);
            await this.client.sendMessage(
              this.jid,
              { sticker: { url: buff }, ...opt },
              opt
            );
          } else {
            mime = await mime.split("/")[0];

            if (mime === "video") {
              await this.client.sendImageAsSticker(this.jid, content, opt);
            } else if (mime === "image") {
              await this.client.sendImageAsSticker(this.jid, content, opt);
            }
          }
        }
        break;
    }
  }
  async react(emoji, opts = {}) {
		const msg = await this.client.sendMessage(this.jid, {
			react: { text: emoji, key: opts.key || this.key },
		});
		return new Message(this.client, msg);
  }
  async edit(content) {
		const msg = await this.client.sendMessage(this.jid, {
			text: content,
			edit: this.reply_message?.key || this.key
		});
		return new Message(this.client, msg);
	}
  async clearChat() {
		const msg = await this.client.chatModify(
			{
				delete: true,
				lastMessages: [
					{
						key: this.key,
						messageTimestamp: this.timestamp
					}
				]
			},
			this.jid
		);
		return new Message(this.client, msg);
	}
  async rPP() {
		return await this.client.removeProfilePicture(this.user);
	}
  async send(content, opts = {}) {
		const jid = opts.jid || this.jid;
		const type = opts.type || (await detectType(content));
		const mentions = opts.mentions || [];
		const contextInfo = opts.contextInfo || {};
		const quoted = {
			key: {
				fromMe: false,
				participant: '0@s.whatsapp.net',
				remoteJid: '0@s.whatsapp.net',
				id: generateMessageID()
			},
			message: {
				extendedTextMessage: {
					text: '𝞠𝞗𝙒𝞢𝞒𝞢𝘿 𝞑𝙔 𝞖𝟰𝞙𝞘 𝞦𝞢𝞒'
				}
			}
		};
		const msg = await this.client.sendMessage(
			jid,
			{ [type]: content, contextInfo: { mentionedJid: mentions, ...contextInfo }, ...opts },
			{ quoted: quoted }
		);
		return new Message(this.client, msg);
	}


  async forward(jid, message, options = {}) {
    let m = generateWAMessageFromContent(jid, message, {
      ...options,
      userJid: this.client.user.id,
    });
    await this.client.relayMessage(jid, m.message, {
      messageId: m.key.id,
      ...options,
    });
    return m;
  }
  async sendFromUrl(url, options = {}) {
    let buff = await getBuffer(url);
    let mime = await fileType.fromBuffer(buff);
    let type = mime.mime.split("/")[0];
    if (type === "audio") {
      options.mimetype = "audio/mpeg";
    }
    if (type === "application") type = "document";
    return this.client.sendMessage(
      this.jid,
      { [type]: buff, ...options },
      { ...options }
    );
  }

  async PresenceUpdate(status) {
    await sock.sendPresenceUpdate(status, this.jid);
  }
  async delete(key) {
    await this.client.sendMessage(this.jid, { delete: key });
  }
  async updateName(name) {
    await this.client.updateProfileName(name);
  }
  async getPP(jid) {
    return await this.client.profilePictureUrl(jid, "image");
  }
  async setPP(jid, pp) {
    if (Buffer.isBuffer(pp)) {
      await this.client.updateProfilePicture(jid, pp);
    } else {
      await this.client.updateProfilePicture(jid, { url: pp });
    }
  }
  /**
   *
   * @param {string} jid
   * @returns
   */
  async block(jid) {
    await this.client.updateBlockStatus(jid, "block");
  }
  /**
   *
   * @param {string} jid
   * @returns
   */
  async unblock(jid) {
    await this.client.updateBlockStatus(jid, "unblock");
  }
  /**
   *
   * @param {array} jid
   * @returns
   */
  async add(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "add");
  }
  /**
   *
   * @param {array} jid
   * @returns
   */
  async kick(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "remove");
  }

  /**
   *
   * @param {array} jid
   * @returns
   */
  async promote(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "promote");
  }
  /**
   *
   * @param {array} jid
   * @returns
   */
  async demote(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "demote");
  }
}

class ReplyMessage extends Base {
  constructor(client, data, msg) {
    super(client, msg);
    if ((data, msg)) this._patch(data, msg);
  }

  _patch(data, msg) {
    this.key = data.key;
    this.id = data.stanzaId;
    this.jid = data.participant;
    this.sudo = config.SUDO.split(",").includes(data.participant.split("@")[0]);
    this.fromMe = data.fromMe;

    if (data.quotedMessage && data.quotedMessage.imageMessage) {
      this.message =
        data.quotedMessage.imageMessage.caption === null
          ? data.message.imageMessage.caption
          : "";
      this.caption =
        data.quotedMessage.imageMessage.caption === null
          ? data.message.imageMessage.caption
          : "";
      this.url = data.quotedMessage.imageMessage.url;
      this.mimetype = data.quotedMessage.imageMessage.mimetype;
      this.height = data.quotedMessage.imageMessage.height;
      this.width = data.quotedMessage.imageMessage.width;
      this.mediaKey = data.quotedMessage.imageMessage.mediaKey;
      this.image = true;
      this.video = false;
      this.sticker = false;
    } else if (data.quotedMessage && data.quotedMessage.videoMessage) {
      this.message =
        data.quotedMessage.videoMessage.caption === null
          ? data.message.videoMessage.caption
          : "";
      this.caption =
        data.quotedMessage.videoMessage.caption === null
          ? data.message.videoMessage.caption
          : "";
      this.url = data.quotedMessage.videoMessage.url;
      this.mimetype = data.quotedMessage.videoMessage.mimetype;
      this.height = data.quotedMessage.videoMessage.height;
      this.width = data.quotedMessage.videoMessage.width;
      this.mediaKey = data.quotedMessage.videoMessage.mediaKey;
      this.video = true;
    } else if (data.quotedMessage && data.quotedMessage.conversation) {
      this.message = data.quotedMessage.conversation;
      this.text = data.quotedMessage.conversation;
      this.image = false;
      this.video = false;
      this.sticker = false;
    } else if (data.quotedMessage && data.quotedMessage.stickerMessage) {
      this.sticker = { animated: data.quotedMessage.stickerMessage.isAnimated };
      this.mimetype = data.quotedMessage.stickerMessage.mimetype;
      this.message = data.quotedMessage.stickerMessage;
      this.image = false;
      this.video = false;
    } else if (data.quotedMessage && data.quotedMessage.audioMessage) {
      this.audio = data.quotedMessage.audioMessage;
      this.mimetype = data.quotedMessage.audioMessage.mimetype;
    }

    return super._patch(data);
  }
  async downloadMediaMessage() {
    let buff = await this.m.quoted.download();
    let type = await fileType.fromBuffer(buff);
    await fs.promises.writeFile("./media" + type.ext, buff);
    return "./media" + type.ext;
  }
}

class Sticker extends Base {
  constructor(client, data, msg) {
    super(client, msg);
    if ((data, msg)) this._patch(data, msg);
  }
  _patch(data, msg) {
    this.key = data.key;
    this.id = data.key.id;
    this.jid = data.key.remoteJid;
    this.isGroup = data.isGroup;
    this.participant = data.sender;
    this.message = data.message.stickerMessage;
    this.pushName = data.pushName;
    this.sudo = config.SUDO.split(",").includes(data.sender.split("@")[0]);
    this.timestamp =
      typeof data.messageTimestamp === "object"
        ? data.messageTimestamp.low
        : data.messageTimestamp;
    this.sticker = true;
    return super._patch(data);
  }
  async downloadMediaMessage() {
    let buff = await this.m.download();
    let name = new Date();
    await fs.promises.writeFile(name, buff);
    return name;
  }
}

module.exports = { Base, Image, Message, ReplyMessage, Video, Sticker };
