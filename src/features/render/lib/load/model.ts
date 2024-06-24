import { ProfileRegistryClient } from "@/features/profile/contract/profileRegistryClient";
import { VerseClient } from "@/features/verse/contract/verseClient";

export type VerseState = {
  info: Awaited<ReturnType<VerseClient["readInfo"]>>;
  parameters: Awaited<ReturnType<VerseClient["readParameters"]>>;
  entities: Awaited<ReturnType<VerseClient["readEntitiesStatic"]>>;
  profiles: Awaited<ReturnType<ProfileRegistryClient["readProfiles"]>>;
};
