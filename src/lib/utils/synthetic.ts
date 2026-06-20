// Regla de dominio: excluir autores sinteticos del pipeline (ruido).
// google_trends + author 'MX' nunca son voces reales. Espeja la regla del
// audit usada en toda la pantalla Voces. Vive en utils (no en un componente)
// para no romper fast-refresh y poder reusarla sin acoplar a CriticsTable.
import type { TopAuthor } from '../api/types'

export function isSyntheticAuthor(a: TopAuthor): boolean {
  if (!a.author || a.author === 'MX') return true
  if ((a.platforms ?? []).every((p) => p === 'google_trends')) {
    return (a.platforms ?? []).length > 0
  }
  return false
}
