import { useEffect, useState } from 'react';
import { subscribe, getState } from '../store/gameStore.js';

export function useGame() {
  const [state, setState] = useState(getState());
  useEffect(() => subscribe(setState), []);
  return state;
}
