/** Cidades atendidas pelo site. A configuração de cada uma fica em `features/cities/config.ts`. */
export type CityId = "sp" | "recife";

export type Cinema = {
  id: string;
  /** Cidade em que o cinema fica. */
  city: CityId;
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
  /** Preço da inteira em reais (0 = gratuito). Não é exibido hoje. */
  fullPrice: number;
  /** Lado preferido do rótulo do pino no mapa (1 = direita, -1 = esquerda); se colidir, o mapa escolhe outro lado. */
  labelSide: 1 | -1;
  /** Site oficial do cinema (ou Instagram, quando não há site), destino do clique numa sessão. `null` = não mapeado. */
  website: string | null;
};
