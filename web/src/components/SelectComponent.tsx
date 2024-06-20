import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectComponentProps {
  options: SelectOption[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SelectComponent = ({
  options = [],
  placeholder,
  value,
  onChange,
  disabled,
}: SelectComponentProps) => {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Select defaultValue={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[180px]" disabled={disabled}>
        <SelectValue placeholder={placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option, idx) => {
          return (
            <SelectItem key={idx} value={option.value}>
              {option.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default SelectComponent;
