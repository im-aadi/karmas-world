import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PracticeLab } from '../src/components/PracticeLab'

afterEach(cleanup)

describe('safe practice simulations', () => {
  it('only returns fixed example output and refuses arbitrary commands', () => {
    render(<PracticeLab />)
    const input = screen.getByRole('textbox', { name: /enter a demo command/i })
    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.click(screen.getByRole('button', { name: /submit simulated command/i }))
    expect(screen.getByText(/available demo commands/i)).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'rm -rf /' } })
    fireEvent.click(screen.getByRole('button', { name: /submit simulated command/i }))
    expect(screen.getByText(/not part of this simulation/i)).toBeInTheDocument()
  })

  it('labels the Caesar cipher as a toy and can encode a sample', () => {
    render(<PracticeLab />)
    fireEvent.click(screen.getByRole('tab', { name: /cipher playground/i }))
    expect(screen.getByText(/must never be used to protect real information/i)).toBeInTheDocument()
    expect(screen.getByText('Phhw ph dw wkh oleudub')).toBeInTheDocument()
  })
})
