import { CODES, Devices } from './devices';

function upTo(digit: number){
  while (Number.isInteger(digit/10) == false) digit++;
  return digit;
}

function SN() {
  return (Math.floor(Math.random() * (999999 - 100000)) + 100000).toString();
}

function luhn(line: string) {
  let sumEven = 0;
  const even: number[] = [];
  let sumOdd = 0;
  for(let i = 1; i < line.length; i=i+2){
    const num0 = Number(line[i - 1]);
    const num1 = Number(line[i]);
    if (Number.isNaN(num0) || Number.isNaN(num1)) {
      throw new Error(`Invalid input: ${line}.`);
    }
    even.push(num1 * 2);
    sumOdd = sumOdd + num0;
    if (i === 13) {
      break;
    }
  }
  for(let y = 0; y < even.length; y++){
    if (even[y] / 10 < 1) {
      sumEven = sumEven + even[y];
    } else {
      const st = Number(even[y].toString().charAt(0));
      const nd = Number(even[y].toString().charAt(1));
      sumEven = sumEven + st + nd;
    }
  }
  let luhnDigit = sumEven + sumOdd;
  luhnDigit = upTo(luhnDigit) - luhnDigit;
  return luhnDigit;
}

export function generateIMEI(device = Devices.MuMu, sn?: string) {
  const code = CODES[device];
  sn = sn || SN();
  const lu = luhn(code + sn);
  return `${code}${sn}${lu}`;
}
