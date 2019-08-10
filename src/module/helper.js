export function Masking() {

}

export function isEmpty(obj) {
  switch (typeof obj) {
    default:
      return obj === undefined || obj === null || Object.keys(obj).length === 0;
    case 'string':
      return obj.trim() === '';
  }
}

export function nextItem(arr, current) {
  if (!Array.isArray(arr)) throw Error('First args should be an array');
  let i = current + 1;
  i %= arr.length;
  return arr[i];
}

export function previousItem(arr, current) {
  if (!Array.isArray(arr)) throw Error('First args should be an array');
  let i = current;
  if (current === 0) {
    return undefined;
  }
  i -= 1;
  return arr[i];
}
