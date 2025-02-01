"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface DefaultFile {
  value: string;
  label: string;
}

enum FileType {
  FILE = "file",
  DEFAULT = "default",
}

interface FileSelectorProps {
  defaultFiles: DefaultFile[];
  label: string;
  onFileSelect: (file: File | string, type: FileType) => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({
  defaultFiles,
  label,
  onFileSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<string>("");
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setSelectedFile("");
      onFileSelect(file, FileType.FILE);
    }
  };

  const handleDefaultFileSelect = (value: string) => {
    setSelectedFile(value);
    setUploadedFile(null);
    onFileSelect(value, FileType.DEFAULT);
    setOpen(false);
  };

  return (
    <div className="grid w-full gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedFile
                ? defaultFiles.find((file) => file.value === selectedFile)
                    ?.label
                : uploadedFile
                ? uploadedFile.name
                : "Select file..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search files..." />
              <CommandList>
                <CommandEmpty>No file found.</CommandEmpty>
                <CommandGroup>
                  {defaultFiles.map((file) => (
                    <CommandItem
                      key={file.value}
                      value={file.value}
                      onSelect={handleDefaultFileSelect}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedFile === file.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {file.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>
    </div>
  );
};

export { FileSelector };
export { FileType };
