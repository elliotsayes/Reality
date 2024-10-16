import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProfileAssets, ProfileInfo } from "../contract/model";
import ProfileDetailsDropdown from "./ProfileDetailsDropdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProfileImage from "./ProfileImage";

interface ProfileButtonProps {
  profileInfo?: ProfileInfo;
  assets?: ProfileAssets;
}

export default function ProfileButton({ profileInfo, assets }: ProfileButtonProps) {
  return (
    <Popover>
      <PopoverTrigger>
        <ProfileImage profileImage={profileInfo?.ProfileImage} size="small" />
      </PopoverTrigger>
      <PopoverContent align="end">
        {profileInfo ? (
          <ProfileDetailsDropdown profileInfo={profileInfo} profileAssets={assets} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                <p className="text-xl font-bold">No Profile</p>
              </CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Go to{" "}
                <a
                  href="https://ao-bazar.arweave.dev/#/"
                  target="_blank"
                  className="underline"
                >
                  Bazar
                </a>{" "}
                to create your profile
              </p>
            </CardContent>
          </Card>
        )}
      </PopoverContent>
    </Popover>
  );
}
