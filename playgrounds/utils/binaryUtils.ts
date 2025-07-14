import BN from 'bn.js';

// 将16位无符号整数转换为字节数组
export function u16ToBytes(num: number): Uint8Array {
  const arr = new ArrayBuffer(2);
  const view = new DataView(arr);
  view.setUint16(0, num, false);
  return new Uint8Array(arr);
}

// 将16位整数转换为字节数组
export function i16ToBytes(num: number): Uint8Array {
  const arr = new ArrayBuffer(2);
  const view = new DataView(arr);
  view.setInt16(0, num, false);
  return new Uint8Array(arr);
}

// 将32位无符号整数转换为字节数组
export function u32ToBytes(num: number): Uint8Array {
  const arr = new ArrayBuffer(4);
  const view = new DataView(arr);
  view.setUint32(0, num, false);
  return new Uint8Array(arr);
}

// 将32位整数转换为字节数组
export function i32ToBytes(num: number): Uint8Array {
  const arr = new ArrayBuffer(4);
  const view = new DataView(arr);
  view.setInt32(0, num, false);
  return new Uint8Array(arr);
}

// 找出位图中最高位的1的位置
export function leadingZeros(bitNum: number, data: BN): number {
  let i = 0;
  for (let j = bitNum - 1; j >= 0; j--) {
    if (!data.testn(j)) {
      i++;
    } else {
      break;
    }
  }
  return i;
}

// 找出位图中最低的0的位置
export function trailingZeros(bitNum: number, data: BN): number {
  let i = 0;
  for (let j = 0; j < bitNum; j++) {
    if (!data.testn(j)) {
      i++;
    } else {
      break;
    }
  }
  return i;
}

// 检查位图是否为空
export function isZero(bitNum: number, data: BN): boolean {
  for (let i = 0; i < bitNum; i++) {
    if (data.testn(i)) return false;
  }
  return true;
}

// 找出位图中最高位的1的位置
export function mostSignificantBit(bitNum: number, data: BN): number | null {
  if (isZero(bitNum, data)) return null;
  else return leadingZeros(bitNum, data);
}

// 找出位图中最低的1的位置
export function leastSignificantBit(bitNum: number, data: BN): number | null {
  if (isZero(bitNum, data)) return null;
  else return trailingZeros(bitNum, data);
}
