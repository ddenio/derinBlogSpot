"use client";

import "@blocknote/core/fonts/inter.css";
import {
  BlockNoteSchema,
  createCodeBlockSpec,
  defaultBlockSpecs,
  PartialBlock,
} from "@blocknote/core";
import { codeBlockOptions, syntaxHighlighter } from "@blocknote/code-block";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useEdgeStore } from "@/lib/edgestore";
import "@blocknote/mantine/style.css";
import "./editor.css";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeBlock: createCodeBlockSpec(codeBlockOptions),
  },
});

interface BlockNoteEditorProps {
  onChange?: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const BlockNoteEditor = ({
  onChange,
  initialContent,
  editable,
}: BlockNoteEditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  const handleImgUploads = async (file: File) => {
    const res = await edgestore.publicFiles.upload({ file });

    return res.url;
  };

  const editor = useCreateBlockNote({
    schema,
    extensions: [syntaxHighlighter],
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleImgUploads,
  });

  const [showImport, setShowImport] = useState(false);
  const [markdown, setMarkdown] = useState("");

  const handleImportMarkdown = () => {
    if (!markdown.trim()) return;

    const blocks = editor.tryParseMarkdownToBlocks(markdown);
    editor.replaceBlocks(editor.document, blocks);
    setMarkdown("");
    setShowImport(false);
  };

  return (
    <div>
      {editable !== false && (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setShowImport((prev) => !prev)}
            className="text-sm underline text-muted-foreground"
          >
            {showImport ? "Hide Markdown import" : "Import Markdown"}
          </button>
          {showImport && (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Paste Markdown here. This replaces the current editor content."
                className="h-48 w-full rounded-md border border-border bg-transparent p-2 font-mono text-sm"
              />
              <button
                type="button"
                onClick={handleImportMarkdown}
                className="self-start rounded-md border border-border px-3 py-1 text-sm"
              >
                Convert to blocks
              </button>
            </div>
          )}
        </div>
      )}
      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        className={editable === false ? "" : "rounded-md border border-border"}
        onChange={
          onChange
            ? () => {
                onChange(JSON.stringify(editor.document));
              }
            : () => {}
        }
        editable={editable}
      />
    </div>
  );
};

export default BlockNoteEditor;
