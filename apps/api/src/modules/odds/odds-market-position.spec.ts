import { detectarPosicionMercado } from './odds-market-position';

describe('detectarPosicionMercado', () => {
  it('marca favorite y underdog según moneyline', () => {
    const result = detectarPosicionMercado(
      'Kansas City Chiefs',
      'Buffalo Bills',
      -250,
      210,
    );

    expect(result.home).toBe('favorito');
    expect(result.away).toBe('underdog');
    expect(result.favorite).toMatchObject({
      team: 'Kansas City Chiefs',
      odds: -250,
    });
    expect(result.underdog).toMatchObject({
      team: 'Buffalo Bills',
      odds: 210,
    });
    expect(result.favorite?.impliedProbability).toBe(71.43);
    expect(result.underdog?.impliedProbability).toBe(32.26);
  });

  it('detecta even cuando las cuotas son equivalentes', () => {
    const result = detectarPosicionMercado('A', 'B', 100, -100);
    expect(result.home).toBe('even');
    expect(result.away).toBe('even');
    expect(result.favorite).toBeUndefined();
  });

  it('no inventa posición si falta un lado', () => {
    expect(detectarPosicionMercado('A', 'B', -110)).toEqual({});
  });
});
