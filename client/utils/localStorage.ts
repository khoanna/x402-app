export const storeSessionPrivateKey = (key: string) => {
  localStorage.setItem("sessionPrivateKey", key);
}

export const getSessionPrivateKey = (): string | null => {
  return localStorage.getItem("sessionPrivateKey");
}

export const storeSessionPublicKey = (key: string) => {
  localStorage.setItem("sessionPublicKey", key);
}

export const getSessionPublicKey = (): string | null => {
  return localStorage.getItem("sessionPublicKey");
}

export const storeUsdcPerPay = (usdcPerPay: string) => {
  localStorage.setItem("usdcPerPay", usdcPerPay);
}

export const getUsdcPerPay = (): string | null => {
  return localStorage.getItem("usdcPerPay");
}