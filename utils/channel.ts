// utils/channel.ts
export function generateChatChannel(uid1: string, uid2: string) {
  return `chat-${[uid1, uid2].sort().join('-')}`; // hasilnya: chat-uidA-uidB
}
