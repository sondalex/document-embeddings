import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"

interface InputFileProps {
    name: string;
    id: string;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, filetype: FileType) => void;
}

// HACK: this is not clean 
type FileType = "Query" | "Corpus";



export function InputFile({ name, id, handleFileUpload }: InputFileProps) {
    
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e, name as FileType);
    }
    return (
        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label className="font-bold" htmlFor={id}>{name}</Label>
            <Input 
                id={id} 
                type="file" 
                onChange={onChange}
            />
        </div>
    );
}
export type {FileType};
