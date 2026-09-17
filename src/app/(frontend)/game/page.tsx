import type { Metadata } from 'next'
import { MatchingGame } from './MatchingGame'
import './game.css'

export const metadata: Metadata = { title: '气象配对挑战', description: '南科大气象社百团大战配对小游戏，挑战五组气象题目，记录通关用时。' }
export default function GamePage() { return <MatchingGame /> }
