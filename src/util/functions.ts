import { ParticipantPopulated } from "./types";

export function userIsConversationParticipant(
  participants: Array<ParticipantPopulated>,
  userId: String
): boolean {
  return !!participants.find((participant) => participant.userId === userId);
}
