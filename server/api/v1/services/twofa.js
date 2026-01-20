import twofactor from "node-2fa";
import qrcode from "qrcode";

/**
 * Generates a new 2FA secret and corresponding QR code
 */
export const generate2FASecret = async (username) => {
  // Generate TOTP secret bound to app name and username
  const secret = twofactor.generateSecret({
    name: "WorkHub",
    account: username,
  });

  // Convert otpauth URI to base64 QR image
  const qr = await qrcode.toDataURL(secret.uri);

  return {
    secret: secret.secret, 
    uri: secret.uri,       
    qr,                    
  };
};

/**
 * Verifies a user-provided 2FA token
 */
export const verify2FAToken = (secret, token) => {
  return twofactor.verifyToken(secret, token);
};
