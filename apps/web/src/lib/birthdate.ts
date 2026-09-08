export const BIRTHDATE_RANGE_MESSAGE =
  'No pueden registrarse personas menores de edad';

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function birthDateBounds(today = new Date()) {
  return {
    min: toIsoDate(
      new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()),
    ),
    max: toIsoDate(
      new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()),
    ),
  };
}

export function isEligibleBirthDate(value: string, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime()) || toIsoDate(birthDate) !== value) {
    return false;
  }

  const { min, max } = birthDateBounds(today);
  return value >= min && value <= max;
}
