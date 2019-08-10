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
