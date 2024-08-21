export function generateInvoiceId(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetters = Array.from(
    { length: 2 },
    () => letters[Math.floor(Math.random() * letters.length)]
  ).join("");
  const randomNumbers = Math.floor(1000 + Math.random() * 9000).toString();
  return randomLetters + randomNumbers;
}
