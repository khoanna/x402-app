export type Sender = "user" | "bot" | "system";

export interface Message {
  id: number;
  text: string;
  sender: Sender;
  cost: number;
}
