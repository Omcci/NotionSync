import { useState, useEffect, useRef } from 'react'

const BOARD_SIZE = 18
const CONTROLS = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 }
const COLORS = {
  GAME_OVER: '#D24D57',
  FRUIT: '#EC644B',
  HEAD: '#336E7B',
  BODY: '#C8F7C5',
  BOARD: '#86B5BD',
}

const SnakeGame = () => {
  const [board, setBoard] = useState(
    Array(BOARD_SIZE).fill(Array(BOARD_SIZE).fill(false)),
  )
  const [snake, setSnake] = useState([{ x: 8, y: 8 }])
  const [direction, setDirection] = useState(CONTROLS.LEFT)
  const [fruit, setFruit] = useState({ x: 5, y: 5 })
  const [isGameOver, setIsGameOver] = useState(false)
  const [score, setScore] = useState(0)

  const directionRef = useRef(direction)

  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  useEffect(() => {
    const handleKeydown = (e) => {
      const currentDirection = directionRef.current
      switch (e.keyCode) {
        case CONTROLS.LEFT:
          if (currentDirection !== CONTROLS.RIGHT) setDirection(CONTROLS.LEFT)
          break
        case CONTROLS.UP:
          if (currentDirection !== CONTROLS.DOWN) setDirection(CONTROLS.UP)
          break
        case CONTROLS.RIGHT:
          if (currentDirection !== CONTROLS.LEFT) setDirection(CONTROLS.RIGHT)
          break
        case CONTROLS.DOWN:
          if (currentDirection !== CONTROLS.UP) setDirection(CONTROLS.DOWN)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  useEffect(() => {
    if (isGameOver) return

    const moveSnake = () => {
      const newSnake = [...snake]
      const head = { ...newSnake[0] }

      if (direction === CONTROLS.LEFT) head.x -= 1
      if (direction === CONTROLS.UP) head.y -= 1
      if (direction === CONTROLS.RIGHT) head.x += 1
      if (direction === CONTROLS.DOWN) head.y += 1

      if (
        head.x < 0 ||
        head.x >= BOARD_SIZE ||
        head.y < 0 ||
        head.y >= BOARD_SIZE ||
        newSnake.some((part) => part.x === head.x && part.y === head.y)
      ) {
        setIsGameOver(true)
        return
      }

      newSnake.unshift(head)
      newSnake.pop()
      setSnake(newSnake)
    }

    const interval = setInterval(moveSnake, 200)
    return () => clearInterval(interval)
  }, [snake, direction, isGameOver])

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Snake Game</h2>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
      >
        {board.map((row, rowIndex) =>
          row.map((col, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="w-5 h-5"
              style={{
                backgroundColor: snake.some(
                  (part) => part.x === colIndex && part.y === rowIndex,
                )
                  ? COLORS.HEAD
                  : fruit.x === colIndex && fruit.y === rowIndex
                    ? COLORS.FRUIT
                    : COLORS.BOARD,
              }}
            />
          )),
        )}
      </div>
      {isGameOver && <p className="text-red-600 font-bold mt-4">Game Over!</p>}
    </div>
  )
}

export default SnakeGame
