import { ProfileRegistryClient } from "@/features/profile/contract/profileRegistryClient";
import { RealityClient } from "@/features/reality/contract/realityClient";

export type WorldState = {
  info: Awaited<ReturnType<RealityClient["readInfo"]>>;
  parameters: Awaited<ReturnType<RealityClient["readParameters"]>>;
  entities: Awaited<ReturnType<RealityClient["readEntitiesStatic"]>>;
  profiles: Awaited<ReturnType<ProfileRegistryClient["readProfiles"]>>;
};
