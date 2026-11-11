import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CyberGames } from '../src/components/CyberGames'

describe('cyber learning games', () => {
  it('runs a fictional phishing game and gives a final score', () => {
    render(<CyberGames />)
    fireEvent.click(screen.getAllByRole('button', { name: /play game/i })[0])

    const answers = [
      /use the company’s official app/i,
      /check with the coworker through a separate/i,
      /the domain matches the service’s known official domain/i,
    ]
    for (let round = 0; round < answers.length; round += 1) {
      fireEvent.click(screen.getByLabelText(answers[round]))
      fireEvent.click(screen.getByRole('button', { name: /check choice/i }))
      expect(screen.getByRole('status')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: round === answers.length - 1 ? /see your result/i : /next clue/i }))
    }

    expect(screen.getByText('3 of 3')).toBeInTheDocument()
  })
})
