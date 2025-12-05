import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('Example Test', () => {
  it('should render without crashing', () => {
    render(<div>Hello World</div>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
