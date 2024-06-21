import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Input } from '../ui/input'
import { FilterIcon } from '../../../public/icon/FilterIcon'
import { Button } from '../ui/button'
import { Filter } from './CommitLog'

type CommitLogFiltersProps = {
  filters: Filter[]
}

const CommitLogFilters = ({ filters }: CommitLogFiltersProps) => {
  return (
    <div className="flex items-center gap-4">
      <Input
        className="bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 text-sm"
        placeholder="Search commits..."
        type="search"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex items-center gap-2" variant="outline">
            <FilterIcon className="w-5 h-5" />
            Filters
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Filters</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filters.map((filter) => (
            <DropdownMenuCheckboxItem key={filter.name}>
              <filter.icon className="w-5 h-5 mr-1" />
              <span>{filter.name}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default CommitLogFilters
