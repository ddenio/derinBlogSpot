"use client";

import dynamic from "next/dynamic";

const BlockNoteEditor = dynamic(() => import("./BlockNoteEditor"), {
  ssr: false,
});

interface BlogContentViewerProps {
  content: string;
}

const BlogContentViewer = ({ content }: BlogContentViewerProps) => {
  return <BlockNoteEditor editable={false} initialContent={content} />;
};

export default BlogContentViewer;
