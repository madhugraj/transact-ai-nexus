
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MappingProfile } from "@/types/inventoryMapping";
import { Save, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MappingProfileSelectorProps {
  profiles: MappingProfile[];
  selectedProfile: string | null;
  onSelectProfile: (profileId: string) => void;
}

export function MappingProfileSelector({
  profiles,
  selectedProfile,
  onSelectProfile,
}: MappingProfileSelectorProps) {
  if (profiles.length === 0) {
    return null;
  }

  const selectedProfileName = selectedProfile
    ? profiles.find((p) => p.id === selectedProfile)?.name
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Save className="h-4 w-4 mr-2" />
          {selectedProfileName ? selectedProfileName : "Load Profile"}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px] bg-white">
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => onSelectProfile(profile.id)}
            className="cursor-pointer hover:bg-gray-100"
          >
            <div className="flex flex-col w-full">
              <span className="font-medium truncate" title={profile.name}>{profile.name}</span>
              <div className="flex justify-between items-center w-full text-xs text-muted-foreground mt-1">
                <span>{profile.targetSystem}</span>
                <span>
                  {profile.createdAt
                    ? formatDistanceToNow(new Date(profile.createdAt), {
                        addSuffix: true,
                      })
                    : "Unknown date"}
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
