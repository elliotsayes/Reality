import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileInfo } from "../contract/model";
import ProfileImage from "./ProfileImage";

interface ProfileDetailsDropdownProps {
  profileInfo: ProfileInfo;
}

export default function ProfileDetailsDropdown({
  profileInfo,
}: ProfileDetailsDropdownProps) {
  const hasDescription =
    profileInfo.Description && profileInfo.Description != "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row gap-2">
            <ProfileImage profileImage={profileInfo.ProfileImage} />
            <div className="flex flex-grow flex-col">
              <p className="text-xl font-bold">{profileInfo.DisplayName}</p>
              <p className="text-sm text-gray-500">@{profileInfo.Username}</p>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start text-left">
          {hasDescription ? (
            <p className="text-center">{profileInfo.Description}</p>
          ) : (
            <p className="text-center text-gray-500 italic">No bio</p>
          )}
          <p className="mt-4 text-sm text-gray-400 italic">
            Edit your profile on{" "}
            <a
              href="https://ao-bazar.arweave.dev/#/"
              target="_blank"
              className="underline"
            >
              Bazar
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
