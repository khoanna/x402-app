export const storeSessionKey = (key: string) => {
  localStorage.setItem("sessionKey", key);
}

export const getSessionKey = (): string | null => {
  return localStorage.getItem("sessionKey");
}