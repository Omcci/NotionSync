import { SettingsIcon } from '../../../public/icon/SettingsIcon'
import { Button } from '../ui/button'
import ConfigSettingsForm from './ConfigSettingsForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'

const ConfigSettings = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant="outline">
          <SettingsIcon className="w-5 h-5" />
          Edit Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Configuration Settings</DialogTitle>
          <DialogDescription>
            Update your repository and token settings.
          </DialogDescription>
        </DialogHeader>
        <ConfigSettingsForm />
      </DialogContent>
    </Dialog>
  )
}

export default ConfigSettings
