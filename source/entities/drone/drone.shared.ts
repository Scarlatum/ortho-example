export type DroneWTO = {
  width: number;
  height: number;
  pos: Float32Array,
  vec: Float32Array,
}

export const DRONE_PHY_BUFFER_SIZE = Float32Array.BYTES_PER_ELEMENT * 3;