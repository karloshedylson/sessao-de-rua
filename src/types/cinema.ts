export type Cinema = {
  id: string;
  /** Nome completo, usado em títulos e rótulos de acessibilidade. */
  name: string;
  /** Nome curto, usado em pinos e listas compactas. */
  short: string;
  bairro: string;
  addr: string;
  lat: number;
  lng: number;
  /** Classificação editorial exibida na etiqueta vermelha. */
  tag: string;
  /** Preço da inteira em reais (0 = gratuito). */
  fullPrice: number;
  /** Lado do rótulo do pino no mapa: 1 = direita, -1 = esquerda. */
  labelSide: 1 | -1;
  /** Site oficial do cinema, destino do clique numa sessão. `null` = ainda não mapeado. */
  website: string | null;
};
