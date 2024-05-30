import { ProfileClient } from "@/features/profile/contract/profileClient";
import { VerseClient } from "@/features/verse/contract/verseClient";

export type VerseState = {
  info: Awaited<ReturnType<VerseClient['readInfo']>>,
  parameters: Awaited<ReturnType<VerseClient['readParameters']>>,
  entities: Awaited<ReturnType<VerseClient['readAllEntities']>>,
  profiles: Awaited<ReturnType<ProfileClient['readProfiles']>>,
}
