import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AvatarSelectorProps {
  currentAvatar?: string | null;
  onSelect: (avatar: string) => void;
}

const ANIMAL_AVATARS = [
  { emoji: "🐶", name: "Dog" },
  { emoji: "🐱", name: "Cat" },
  { emoji: "🐭", name: "Mouse" },
  { emoji: "🐹", name: "Hamster" },
  { emoji: "🐰", name: "Rabbit" },
  { emoji: "🦊", name: "Fox" },
  { emoji: "🐻", name: "Bear" },
  { emoji: "🐼", name: "Panda" },
  { emoji: "🐨", name: "Koala" },
  { emoji: "🐯", name: "Tiger" },
  { emoji: "🦁", name: "Lion" },
  { emoji: "🐮", name: "Cow" },
  { emoji: "🐷", name: "Pig" },
  { emoji: "🐸", name: "Frog" },
  { emoji: "🐵", name: "Monkey" },
  { emoji: "🐔", name: "Chicken" },
  { emoji: "🐧", name: "Penguin" },
  { emoji: "🐦", name: "Bird" },
  { emoji: "🐤", name: "Chick" },
  { emoji: "🦆", name: "Duck" },
  { emoji: "🦅", name: "Eagle" },
  { emoji: "🦉", name: "Owl" },
  { emoji: "🦇", name: "Bat" },
  { emoji: "🐺", name: "Wolf" },
  { emoji: "🐗", name: "Boar" },
  { emoji: "🐴", name: "Horse" },
  { emoji: "🦄", name: "Unicorn" },
  { emoji: "🐝", name: "Bee" },
  { emoji: "🐛", name: "Caterpillar" },
  { emoji: "🦋", name: "Butterfly" },
  { emoji: "🐌", name: "Snail" },
  { emoji: "🐞", name: "Ladybug" },
  { emoji: "🐢", name: "Turtle" },
  { emoji: "🐍", name: "Snake" },
  { emoji: "🦎", name: "Lizard" },
  { emoji: "🐙", name: "Octopus" },
  { emoji: "🦑", name: "Squid" },
  { emoji: "🦀", name: "Crab" },
  { emoji: "🐡", name: "Pufferfish" },
  { emoji: "🐠", name: "Tropical Fish" },
  { emoji: "🐟", name: "Fish" },
  { emoji: "🐬", name: "Dolphin" },
  { emoji: "🐳", name: "Whale" },
  { emoji: "🦈", name: "Shark" },
  { emoji: "🦭", name: "Seal" },
  { emoji: "🦦", name: "Otter" },
  { emoji: "🦥", name: "Sloth" },
  { emoji: "🦘", name: "Kangaroo" },
  { emoji: "🦒", name: "Giraffe" },
  { emoji: "🐘", name: "Elephant" },
  { emoji: "🦏", name: "Rhino" },
  { emoji: "🦛", name: "Hippo" },
  { emoji: "🐆", name: "Leopard" },
  { emoji: "🦓", name: "Zebra" },
  { emoji: "🦍", name: "Gorilla" },
  { emoji: "🦧", name: "Orangutan" },
  { emoji: "🐪", name: "Camel" },
  { emoji: "🐫", name: "Two-Hump Camel" },
  { emoji: "🦙", name: "Llama" },
  { emoji: "🦌", name: "Deer" },
];

export default function AvatarSelector({ currentAvatar, onSelect }: AvatarSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || "🐶");

  const handleSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    onSelect(avatar);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="space-y-2">
        <Label>Profile Avatar</Label>
        <div className="flex items-center gap-4">
          <div className="text-6xl">{selectedAvatar}</div>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-change-avatar">
              Change Avatar
            </Button>
          </DialogTrigger>
        </div>
      </div>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
          <DialogDescription>
            Select an animal avatar for your profile
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 sm:gap-4 py-4">
          {ANIMAL_AVATARS.map((avatar) => (
            <button
              key={avatar.emoji}
              onClick={() => handleSelect(avatar.emoji)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors ${
                selectedAvatar === avatar.emoji ? "bg-accent ring-2 ring-primary" : ""
              }`}
              title={avatar.name}
              data-testid={`avatar-${avatar.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="text-4xl">{avatar.emoji}</span>
              <span className="text-xs text-muted-foreground">{avatar.name}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
