import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  CalendarDaysIcon,
  CircleAlertIcon,
  EyeIcon,
  FilterIcon,
  FolderSyncIcon,
  GitBranchIcon,
  GitCommitVerticalIcon,
  GithubIcon,
  NotebookIcon,
  RepeatIcon,
  SettingsIcon,
  UserIcon,
} from '@/components/icons'

describe('Icon Components', () => {
  const icons = [
    { name: 'CalendarDaysIcon', Component: CalendarDaysIcon },
    { name: 'CircleAlertIcon', Component: CircleAlertIcon },
    { name: 'EyeIcon', Component: EyeIcon },
    { name: 'FilterIcon', Component: FilterIcon },
    { name: 'FolderSyncIcon', Component: FolderSyncIcon },
    { name: 'GitBranchIcon', Component: GitBranchIcon },
    { name: 'GitCommitVerticalIcon', Component: GitCommitVerticalIcon },
    { name: 'GithubIcon', Component: GithubIcon },
    { name: 'NotebookIcon', Component: NotebookIcon },
    { name: 'RepeatIcon', Component: RepeatIcon },
    { name: 'SettingsIcon', Component: SettingsIcon },
    { name: 'UserIcon', Component: UserIcon },
  ]

  icons.forEach(({ name, Component }) => {
    describe(name, () => {
      it('renders without crashing', () => {
        const { container } = render(<Component />)
        expect(container.querySelector('svg')).toBeInTheDocument()
      })

      it('renders as SVG element', () => {
        const { container } = render(<Component />)
        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg?.tagName.toLowerCase()).toBe('svg')
      })

      it('has default dimensions of 24x24', () => {
        const { container } = render(<Component />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('width', '24')
        expect(svg).toHaveAttribute('height', '24')
      })

      it('accepts and applies custom props', () => {
        const { container } = render(
          <Component className="custom-class" data-testid="test-icon" />
        )
        const svg = container.querySelector('svg')
        expect(svg).toHaveClass('custom-class')
        expect(svg).toHaveAttribute('data-testid', 'test-icon')
      })

      it('accepts custom size props', () => {
        const { container } = render(<Component width="32" height="32" />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('width', '32')
        expect(svg).toHaveAttribute('height', '32')
      })

      it('has stroke-based styling', () => {
        const { container } = render(<Component />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('stroke', 'currentColor')
        expect(svg).toHaveAttribute('fill', 'none')
      })

      it('has correct SVG namespace', () => {
        const { container } = render(<Component />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
      })

      it('applies aria attributes when provided', () => {
        const { container } = render(
          <Component aria-label={`${name} icon`} role="img" />
        )
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('aria-label', `${name} icon`)
        expect(svg).toHaveAttribute('role', 'img')
      })

      it('applies custom stroke width', () => {
        const { container } = render(<Component strokeWidth="3" />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('strokeWidth', '3')
      })

      it('applies custom color via style prop', () => {
        const { container } = render(<Component style={{ color: 'red' }} />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveStyle({ color: 'red' })
      })
    })
  })

  describe('Icon accessibility', () => {
    it('icons are focusable when tabIndex is provided', () => {
      const { container } = render(<GithubIcon tabIndex={0} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('tabIndex', '0')
    })

    it('icons can have aria-hidden attribute', () => {
      const { container } = render(<GithubIcon aria-hidden="true" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Icon rendering performance', () => {
    it('renders multiple icons without issues', () => {
      const { container } = render(
        <div>
          <GithubIcon />
          <CalendarDaysIcon />
          <SettingsIcon />
          <UserIcon />
          <GitBranchIcon />
        </div>
      )

      const svgs = container.querySelectorAll('svg')
      expect(svgs).toHaveLength(5)
    })
  })
})
