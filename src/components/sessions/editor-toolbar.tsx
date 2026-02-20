import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeXml,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Unlink,
  Image,
  Undo,
  Redo,
  Highlighter,
  RemoveFormatting,
  Minus,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
}

function ToolbarButton({
  pressed,
  onPressedChange,
  disabled,
  tooltip,
  children,
}: {
  pressed?: boolean;
  onPressedChange?: () => void;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={pressed}
          onPressedChange={onPressedChange}
          disabled={disabled}
          className="size-8 shrink-0 p-0"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const handleSetLink = useCallback(() => {
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setUrl("");
    setOpen(false);
  }, [editor, url]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={editor.isActive("link")}
              onPressedChange={() => {
                if (editor.isActive("link")) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  const previousUrl =
                    editor.getAttributes("link").href || "";
                  setUrl(previousUrl);
                  setOpen(true);
                }
              }}
              className="size-8 shrink-0 p-0"
            >
              {editor.isActive("link") ? (
                <Unlink className="size-4" />
              ) : (
                <Link className="size-4" />
              )}
            </Toggle>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {editor.isActive("link") ? "Remove link" : "Add link"}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 p-3" side="bottom" align="start">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium">URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSetLink();
                }
              }}
              placeholder="https://example.com"
              className="h-8 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <Button size="sm" className="h-8" onClick={handleSetLink}>
              Set
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ImagePopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const handleInsertImage = useCallback(() => {
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setUrl("");
    setOpen(false);
  }, [editor, url]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={false}
              onPressedChange={() => setOpen(true)}
              className="size-8 shrink-0 p-0"
            >
              <Image className="size-4" />
            </Toggle>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Insert image
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 p-3" side="bottom" align="start">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium">Image URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInsertImage();
                }
              }}
              placeholder="https://example.com/image.png"
              className="h-8 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <Button size="sm" className="h-8" onClick={handleInsertImage}>
              Insert
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 overflow-x-auto border-b bg-muted/30 px-2 py-1.5",
      )}
    >
      {/* History */}
      <ToolbarButton
        tooltip="Undo (Ctrl+Z)"
        disabled={!editor.can().undo()}
        onPressedChange={() => editor.chain().focus().undo().run()}
      >
        <Undo className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Redo (Ctrl+Y)"
        disabled={!editor.can().redo()}
        onPressedChange={() => editor.chain().focus().redo().run()}
      >
        <Redo className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      {/* Headings */}
      <ToolbarButton
        tooltip="Heading 1"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Heading 2"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Heading 3"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      {/* Inline formatting */}
      <ToolbarButton
        tooltip="Bold (Ctrl+B)"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Italic (Ctrl+I)"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Underline (Ctrl+U)"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Strikethrough"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Inline code"
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Highlight"
        pressed={editor.isActive("highlight")}
        onPressedChange={() =>
          editor.chain().focus().toggleHighlight().run()
        }
      >
        <Highlighter className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      {/* Lists */}
      <ToolbarButton
        tooltip="Bullet list"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() =>
          editor.chain().focus().toggleBulletList().run()
        }
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Ordered list"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() =>
          editor.chain().focus().toggleOrderedList().run()
        }
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      {/* Block-level */}
      <ToolbarButton
        tooltip="Blockquote"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() =>
          editor.chain().focus().toggleBlockquote().run()
        }
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Code block"
        pressed={editor.isActive("codeBlock")}
        onPressedChange={() =>
          editor.chain().focus().toggleCodeBlock().run()
        }
      >
        <CodeXml className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Horizontal rule"
        onPressedChange={() =>
          editor.chain().focus().setHorizontalRule().run()
        }
      >
        <Minus className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      {/* Text alignment */}
      <ToolbarButton
        tooltip="Align left"
        pressed={editor.isActive({ textAlign: "left" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
      >
        <AlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Align center"
        pressed={editor.isActive({ textAlign: "center" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
      >
        <AlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Align right"
        pressed={editor.isActive({ textAlign: "right" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
      >
        <AlignRight className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Justify"
        pressed={editor.isActive({ textAlign: "justify" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("justify").run()
        }
      >
        <AlignJustify className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      {/* Link & Image */}
      <LinkPopover editor={editor} />
      <ImagePopover editor={editor} />

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      {/* Clear formatting */}
      <ToolbarButton
        tooltip="Clear formatting"
        onPressedChange={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
      >
        <RemoveFormatting className="size-4" />
      </ToolbarButton>
    </div>
  );
}
