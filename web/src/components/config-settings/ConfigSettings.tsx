import { SettingsIcon } from '../../../public/icon/SettingsIcon'
import { Button } from '../ui/button'
import ConfigSettingsForm from './ConfigSettingsForm'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'

const ConfigSettings = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 my-6">
      <Accordion type="single" collapsible>
        <AccordionItem value="settings">
          <AccordionTrigger className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Configuration Settings</h2>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end mb-2">
              <Button className="flex items-center gap-2" variant="outline">
                <SettingsIcon className="w-5 h-5" />
                Edit Settings
              </Button>
            </div>

            <ConfigSettingsForm />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default ConfigSettings
