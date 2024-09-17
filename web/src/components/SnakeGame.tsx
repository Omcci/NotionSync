import { useState, useEffect, useRef } from 'react'

const BOARD_SIZE = 18
const CONTROLS = {
  LEFT: ['ArrowLeft', 'q', 'Q'],
  UP: ['ArrowUp', 'z', 'Z'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  DOWN: ['ArrowDown', 's', 'S'],
}
const COLORS = {
  GAME_OVER: '#FF007F',
  FRUIT: '#00FF00',
  HEAD: '#FFD700',
  BODY: '#FF69B4',
  BOARD: '#00008B',
}

const SnakeGame = () => {
  const [board, setBoard] = useState(
    Array(BOARD_SIZE).fill(Array(BOARD_SIZE).fill(false)),
  )
  const [snake, setSnake] = useState([{ x: 12, y: 8 }])
  const [direction, setDirection] = useState(CONTROLS.LEFT)
  const [fruit, setFruit] = useState({ x: 5, y: 5 })
  const [isGameOver, setIsGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem('highScore')) || 0,
  )

  const directionRef = useRef(direction)

  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  const resetFruit = () => {
    const newFruit = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    }
    setFruit(newFruit)
  }

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (CONTROLS.LEFT.includes(e.key)) {
        if (directionRef.current !== CONTROLS.RIGHT) setDirection(CONTROLS.LEFT)
      } else if (CONTROLS.UP.includes(e.key)) {
        if (directionRef.current !== CONTROLS.DOWN) setDirection(CONTROLS.UP)
      } else if (CONTROLS.RIGHT.includes(e.key)) {
        if (directionRef.current !== CONTROLS.LEFT) setDirection(CONTROLS.RIGHT)
      } else if (CONTROLS.DOWN.includes(e.key)) {
        if (directionRef.current !== CONTROLS.UP) setDirection(CONTROLS.DOWN)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  useEffect(() => {
    if (isGameOver) {
      if (score > highScore) {
        setHighScore(score)
        localStorage.setItem('highScore', score.toString())
      }
      return
    }

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

      if (head.x === fruit.x && head.y === fruit.y) {
        setScore(score + 1)
        resetFruit()
      } else {
        newSnake.pop()
      }

      newSnake.unshift(head)
      setSnake(newSnake)
    }

    const interval = setInterval(moveSnake, 200)
    return () => clearInterval(interval)
  }, [snake, direction, isGameOver, score, highScore, fruit])

  const resetGame = () => {
    setSnake([{ x: 12, y: 8 }])
    setDirection(CONTROLS.LEFT)
    setFruit({ x: 5, y: 5 })
    setScore(0)
    setIsGameOver(false)
  }

  return (
    <div className="flex flex-col items-center ">
      <div
        className="grid border-neon-pink bg-black "
        style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
      >
        {board.map((row: boolean[], rowIndex: number) =>
          row.map((col: boolean, colIndex: number) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="w-6 h-6"
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
      {isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={resetGame}
            className="bg-lime-300 text-purple-700 font-extrabold italic py-4 px-6 rounded-full shadow-lg hover:bg-yellow-500 border-4 border-red-500 animate-bounce transform rotate-6 hover:rotate-12"
            style={{
              textShadow: '2px 2px 4px #ff0000',
              fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
              letterSpacing: '2px',
            }}
          >
            Restart
          </button>
        </div>
      )}
      <div className="p-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 font-mono text-lg">
        High Score: {highScore}
      </div>
      <div className="mt-4 text-pink-500 font-mono text-xl tracking-wide">
        Score: {score}
      </div>
      <div className="h-9 leading-9">
        {isGameOver && (
          <div className="flex flex-col items-center">
            <div
              className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-pulse"
              style={{
                textShadow:
                  '0 0 3px #FF007F, 0 0 2px #FF007F, 0 0 3px #FF007F, 0 0 0px #FF007F',
              }}
            >
              GAME OVER
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SnakeGame
