interface ControlsProbe {
  getYaw: () => number;
  getSpeed: () => number;
  setKeys: (codes: string[]) => void;
  setSteer: (value: number) => void;
}

interface Window {
  __controlsTest?: ControlsProbe;
}
