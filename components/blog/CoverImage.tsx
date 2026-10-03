"use client";

import Image from "next/image";
import AddCover from "./AddCover";
import { X } from "lucide-react";
import { useEdgeStore } from "@/lib/edgestore";
import { useState } from "react";

interface CoverImageProps {
  setUploadedCover: (cover: string | undefined) => void;
  url: string;
  isEditor?: boolean;
}

const CoverImage = ({ url, isEditor, setUploadedCover }: CoverImageProps) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { edgestore } = useEdgeStore();

  const handleRemoveCover = async (url: string) => {
    setIsRemoving(true);
    try {
      await edgestore.publicFiles.delete({ url });
      setUploadedCover(undefined);
    } catch (error) {
      console.log(error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="relative w-full h-[35vh] group rounded-xl overflow-hidden">
      <Image src={url} fill alt="Cover Image" className="object-cover" />
      {isEditor && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-x-2">
          <AddCover
            setUploadedCover={setUploadedCover}
            replaceUrl={url}
            onUploadingChange={setIsUploading}
          />
          <button
            className="flex items-center gap-2 rounded-md bg-black/60 text-white px-3 py-1.5 text-sm font-medium backdrop-blur-sm hover:bg-black/80 transition-colors"
            type="button"
            disabled={isRemoving}
            onClick={() => {
              handleRemoveCover(url);
            }}
          >
            <X size={16} />
            <span>Remove</span>
          </button>
        </div>
      )}
      {isRemoving && (
        <p className="absolute bottom-3 right-3 text-red-500 font-medium bg-black/60 rounded-md px-3 py-1.5 text-sm">
          Removing...
        </p>
      )}
      {isUploading && (
        <p className="absolute bottom-3 right-3 text-green-500 font-medium bg-black/60 rounded-md px-3 py-1.5 text-sm">
          Uploading...
        </p>
      )}
    </div>
  );
};

export default CoverImage;
