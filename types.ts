
export enum GameType {
  MATH = 'math',
  SPELLING = 'spelling'
}

export interface BubbleData {
  id: string;
  value: string;
  type: GameType;
  position: [number, number, number];
  speed: number;
  color: string;
}

export interface GameState {
  playing: boolean;
  mathLevel: number;
  spellingLevel: number;
  currentMathTarget: string;
  currentLetterTarget: string;
  score: number;
  magicMessage: string;
}

export const MATH_TARGETS = ['3', '7', '11', '15', '20', '25', '30'];
export const LETTER_TARGETS = ['E', 'V', 'A', 'S', 'U', 'P', 'E', 'R'];
