import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

import { useState } from 'react';

interface ColumnChoice {
    choice1: string,
    choice2: string,
}

interface ColumnMapperProps {
  label: string;
  value1: string | undefined;
  value2: string | undefined;
  onChange: (value1: string, value2: string) => void;
  options: string[];
}

interface ColumnChoice {
  choice1: string;
  choice2: string;
}

export function ColumnMapper({
  label,
  value1,
  value2,
  onChange,
  options,
}: ColumnMapperProps) {
  const [values, setValues] = useState<ColumnChoice>({ choice1: value1 || '', choice2: value2 || '' });

  const onValueChange = (value: string, fieldType: string) => {
    const updatedValues = {
      ...values,
      [fieldType === 'Embeddings' ? 'choice2' : 'choice1']: value,
    };
    
    setValues(updatedValues);
    
    if (updatedValues.choice1 && updatedValues.choice2) {
      onChange(updatedValues.choice1, updatedValues.choice2);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div>
        <Label htmlFor="column">Column</Label>
        <Select onValueChange={(value) => onValueChange(value, 'Column')} value={value1}>
          <SelectTrigger id="column">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="embeddings">Embeddings</Label>
        <Select onValueChange={(value) => onValueChange(value, 'Embeddings')} value={value2}>
          <SelectTrigger id="embeddings">
            <SelectValue placeholder="Select embeddings" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

