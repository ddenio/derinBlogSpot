"use client";

import { useEdgeStore } from "@/lib/edgestore";
import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AddCoverProps {
  setUploadedCover: (cover: string) => void;
  replaceUrl?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

const AddCover = ({
  setUploadedCover,
  replaceUrl,
  onUploadingChange,
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
        className="flex items-center gap-2 rounded-md bg-black/60 text-white px-3 py-1.5 text-sm font-medium backdrop-blur-sm hover:bg-black/80 transition-colors"
      >
        <ImageIcon size={16} />
        <span>{!!replaceUrl ? "Change Cover Image" : "Add Cover Image"}</span>
      </button>
    </div>
  );
};

export default AddCover;
