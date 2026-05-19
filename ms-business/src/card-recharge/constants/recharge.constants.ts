/** Montos predefinidos en COP (pesos enteros). */
export const PREDEFINED_RECHARGE_AMOUNTS_COP = [
  10_000, 20_000, 50_000, 100_000,
] as const;

export const MIN_RECHARGE_AMOUNT_COP = 5_000;
export const MAX_RECHARGE_AMOUNT_COP = 500_000;

/** Comisión ePayco por defecto (porcentaje). Configurable vía EPAYCO_FEE_PERCENT. */
export const DEFAULT_EPAYCO_FEE_PERCENT = 2.99;
