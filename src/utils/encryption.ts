import crypto from 'crypto';

const encryptionKey: string = process.env.ENC_KEY;
const iv: string = process.env.ENC_IV;

if (!encryptionKey || !iv) {
  throw new Error('Missing encryption environment variable(s). Please edit .env file');
}

const algorithm = 'aes-128-gcm';
const key = crypto.scryptSync(encryptionKey, 'salt', 16);
const iterations = 10;
const authTagLength = 16;

export const encrypt = (originalText: string): string => {
  const cipher = crypto.createCipheriv(algorithm, key, iv, { authTagLength });
  let encryptedText: Buffer = cipher.update(originalText);
  encryptedText = Buffer.concat([encryptedText, cipher.final()]);
  encryptedText = Buffer.concat([encryptedText, cipher.getAuthTag()]);

  return encryptedText.toString('hex');
};

export const decrypt = (encryptedText: string): string => {
  const encryptedTextBuffer = Buffer.from(encryptedText, 'hex');
  const authTag = encryptedTextBuffer.slice(0 - authTagLength);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  let decryptedText = decipher.update(encryptedTextBuffer.slice(0, 0 - authTagLength));
  decryptedText = Buffer.concat([decryptedText, decipher.final()]);

  return decryptedText.toString();
};

export const generateRandomString = (length: number): string => {
  const randomString = crypto.randomBytes(length).toString('hex');
  return randomString;
};

export const hashAndSaltPassword = (originalPassword: string, salt: string): string => {
  const passwordHash = crypto.pbkdf2Sync(originalPassword, salt, iterations, 64, 'sha512').toString('hex');

  return passwordHash;
};
