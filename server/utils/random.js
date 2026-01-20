// Generates a random numeric card number, optionally prefixed with a timestamp
export const generateRandomCardNumber = (
  length = 6,
  appendTimestamp = true
) => {
  const digits = "0123456789";
  let cardNumber = "";

  for (let i = 0; i < length; i++) {
    cardNumber += digits[Math.floor(Math.random() * digits.length)];
  }

  return appendTimestamp ? `${Date.now()}-${cardNumber}` : cardNumber;
};
