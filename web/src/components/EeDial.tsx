import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import SnakeGame from './SnakeGame'

type EeDialProps = {
  triggerEe: boolean
  setTriggerEe: (open: boolean) => void
}

const EeDial = ({ triggerEe, setTriggerEe }: EeDialProps) => {
  const handleDialogChange = (open: boolean) => {
    setTriggerEe(open)
  }

  return (
    <Dialog open={triggerEe} onOpenChange={handleDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-5xl font-bold bg-gradient-to-r from-purple-400 via-green-400 to-pink-500 text-transparent bg-clip-text animate-bounce shadow-[3px_3px_0px_#ff0000,6px_6px_0px_#00ff00,9px_9px_0px_#0000ff]">
            SNAKE GAME
          </DialogTitle>
          <DialogDescription className="text-center text-lg font-impact text-lime-500 animate-pulse shadow-[0_0_8px_#00ff00,0_0_12px_#ff00ff,0_0_16px_#ffff00]">
            Enjoy the game!
          </DialogDescription>
        </DialogHeader>
        <SnakeGame />
      </DialogContent>
    </Dialog>
  )
}

export default EeDial
