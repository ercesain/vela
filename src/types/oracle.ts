export type OracleId = 'luna' | 'nyx' | 'sol' | 'astra' | 'merc';

export interface OracleProfile {
  id: OracleId;
  name: string;
  /** Short specialty line, e.g. "Aşk • İlişkiler • Duygusal Bağ". */
  specialty: string;
  /** Signature accent used sparingly for this Oracle's world (dot, subtle tint). */
  accent: string;
  /**
   * Replaceable character artwork. Only Luna has final art today; the rest
   * use illustrated placeholders at the same path convention, e.g.
   *   require('@/assets/characters/nyx.png')
   */
  artwork: number;
}
