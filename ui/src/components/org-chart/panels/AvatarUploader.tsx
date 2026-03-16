import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AgentAvatar } from "../AgentAvatar";

interface AvatarUploaderProps {
  icon: string | null;
  avatar: string | null;
  name: string;
  onUpload: (file: File) => Promise<void>;
}

export function AvatarUploader({ icon, avatar, name, onUpload }: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="relative cursor-pointer group shrink-0">
      <AgentAvatar icon={icon} avatar={avatar} name={name} size="md" />
      <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading ? (
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        ) : (
          <span className="text-white text-[10px]">Edit</span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </label>
  );
}
