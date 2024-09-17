import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import SnakeGame from './SnakeGame'
import { Card, CardContent } from './ui/card'

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
          <DialogTitle className="text-center text-5xl font-bold text-gray-500 ">
            SNAKE GAME
          </DialogTitle>
          <DialogTitle
            className="absolute top-4 left-0 right-0 text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-500 to-green-600 animate-pulse"
            style={{
              textShadow:
                '2px 0 6px #fff, 0 10px 10px #00ff00, 10px 0 10px #00ffff, 10px 0 15px #00ff00',
            }}
          >
            {' '}
            SNAKE GAME
          </DialogTitle>
          <div className="w-full flex justify-center">
            <Card className="flex justify-center m-0 p-2 bg-gray-100 rounded-md shadow-sm text-gray-800 max-w-max">
              <CardContent className="p-0 text-center text-xs">
                <p className="font-bold">Controls</p>
                <ul className="list-none m-0 text-left ">
                  <li>
                    ← or <span className="font-bold">&apos;Q&apos;</span>: Move
                    Left
                  </li>
                  <li>
                    ↑ or <span className="font-bold">&apos;Z&apos;</span>: Move
                    Up
                  </li>
                  <li>
                    → or <span className="font-bold">&apos;D&apos;</span>: Move
                    Right
                  </li>
                  <li>
                    ↓ or <span className="font-bold">&apos;S&apos;</span>: Move
                    Down
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </DialogHeader>
        <SnakeGame />
      </DialogContent>
    </Dialog>
  )
}

export default EeDial
