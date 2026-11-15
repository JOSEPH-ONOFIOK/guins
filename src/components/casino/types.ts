// What every casino game gets from the table around it.
export type GameProps = {
  // Current bet in chips
  bet: number;
  busy: boolean;
  // Takes the bet off the balance and locks the table. False if they can't afford it.
  start: () => boolean;
  // Pays out bet × mult (0 = lost, 1 = bet back) and unlocks the table
  settle: (mult: number, note: string) => void;
};
