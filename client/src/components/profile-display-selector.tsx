import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Character } from "@shared/schema";

interface ProfileDisplaySelectorProps {
  currentAvatar: string;
  currentCharacter: Character | undefined;
  currentDisplayPreference: string;
  customProfileImage: string | null;
  onDisplayPreferenceChange: (preference: "avatar" | "character" | "custom") => void;
  onCustomImageChange: (imageData: string) => void;
}

export default function ProfileDisplaySelector({
  currentAvatar,
  currentCharacter,
  currentDisplayPreference,
  customProfileImage,
  onDisplayPreferenceChange,
  onCustomImageChange,
}: ProfileDisplaySelectorProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(customProfileImage);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size must be less than 2MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        onCustomImageChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const getPreviewContent = () => {
    switch (currentDisplayPreference) {
      case "avatar":
        return (
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">
            {currentAvatar || "🐶"}
          </div>
        );
      case "character":
        return currentCharacter ? (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <img
              src={currentCharacter.ipfsLink}
              alt={currentCharacter.title}
              className="w-16 h-16 object-cover rounded-full"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
            No character
          </div>
        );
      case "custom":
        return imagePreview ? (
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
            <img
              src={imagePreview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Profile Display</Label>
        <p className="text-sm text-gray-500 mt-1">
          Choose what to show as your profile picture
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {getPreviewContent()}
        </div>
        <div className="flex-1">
          <RadioGroup
            value={currentDisplayPreference}
            onValueChange={(value) => onDisplayPreferenceChange(value as any)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="avatar" id="display-avatar" />
              <Label htmlFor="display-avatar" className="font-normal cursor-pointer">
                Animal Avatar {currentAvatar && `(${currentAvatar})`}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="character"
                id="display-character"
                disabled={!currentCharacter}
              />
              <Label
                htmlFor="display-character"
                className={`font-normal ${!currentCharacter ? "text-gray-400" : "cursor-pointer"}`}
              >
                Purchased Character {currentCharacter ? `(${currentCharacter.title})` : "(None owned)"}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="display-custom" />
              <Label htmlFor="display-custom" className="font-normal cursor-pointer">
                Custom Image
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {currentDisplayPreference === "custom" && (
        <div className="space-y-2">
          <Label htmlFor="custom-image-upload" className="text-sm">
            Upload Profile Picture
          </Label>
          <div className="flex items-center gap-2">
            <input
              id="custom-image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("custom-image-upload")?.click()}
              data-testid="button-upload-image"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Image
            </Button>
            <span className="text-sm text-gray-500">Max 2MB, JPG/PNG</span>
          </div>
        </div>
      )}
    </div>
  );
}
