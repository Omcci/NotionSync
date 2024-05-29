import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const SelectComponent = ({ options= [], placeholder, value, onChange }) => {
  return (
    <Select defaultValue={value}  onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option, idx) => {
          return (
            <SelectItem key={idx} value={option}>
              {option}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default SelectComponent;
