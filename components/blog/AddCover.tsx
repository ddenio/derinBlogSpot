"use client";

import { useEdgeStore } from "@/lib/edgestore";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AddCoverProps {
  setUploadedCover: (cover: string) => void;
  replaceUrl?: string;
  onUploadingChange?: (uploading: boolean) => void;
  variant?: "overlay" | "standalone";
}

const AddCover = ({
  setUploadedCover,
  replaceUrl,
  onUploadingChange,
  variant = "overlay",
}: AddCoverProps) => {
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { edgestore } = useEdgeStore();

  const handleButtonClick = () => imgInputRef.current?.click();

  useEffect(() => {
    let isMounted = true;

    const uploadImage = async () => {
      if (!file) return;
      setIsUploading(true);
      onUploadingChange?.(true);
      try {
        const res = await edgestore.publicFiles.upload({
          file,
          options: replaceUrl ? { replaceTargetUrl: replaceUrl } : undefined,
        });

        if (isMounted && res.url) {
          setUploadedCover(res.url);
        }
      } catch (error) {
        console.log("Upload failed:", error);
      } finally {
        if (isMounted) {
          setIsUploading(false);
          onUploadingChange?.(false);
        }
      }
    };

    uploadImage();

    return () => {
      isMounted = false;
    };
  }, [file]);

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        ref={imgInputRef}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isUploading}
        className={cn(
          "flex items-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
          variant === "standalone"
            ? "w-full justify-center border border-dashed border-border bg-background px-4 py-6 text-foreground hover:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
            : "bg-black/60 px-3 py-1.5 text-white backdrop-blur-sm hover:bg-black/80",
          "cursor-pointer",
        )}
      >
        <ImageIcon size={16} />
        <span className={cn(isUploading && "text-green-500")}>
          {isUploading
            ? "Uploading..."
            : !!replaceUrl
              ? "Change Cover Image"
              : "Add Cover Image"}
        </span>
      </button>
    </div>
  );
};

export default AddCover;
