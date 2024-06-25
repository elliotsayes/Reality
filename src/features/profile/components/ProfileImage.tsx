import { fetchUrl } from "@/features/arweave/lib/arweave";

interface ProfileImageProps {
  profileImage?: string;
  size?: "small" | "large";
}

export default function ProfileImage({
  profileImage,
  size,
}: ProfileImageProps) {
  const hasProfileImage =
    profileImage && profileImage != "" && profileImage != "None";

  if (hasProfileImage) {
    return (
      <img
        src={fetchUrl(profileImage)}
        alt="Profile"
        className={`rounded-full ${size === "small" ? "w-8 h-8" : "w-14 h-14"}`}
      />
    );
  } else {
    return (
      <img
        src={"llamaland_profilePic.png"}
        alt="Profile"
        className={`rounded-full ${size === "small" ? "w-8 h-8" : "w-14 h-14"}`}
      />
    );
  }
}
