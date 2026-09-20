export interface ResultadoReconocimiento {
  persona_id?: number | null
  persona_nombre?: string | null
  similitud?: number
  distancia?: number
  umbral?: number
  coincide?: boolean
  probabilidad_calibrada?: number | null
  historial_id?: number | null
}

export interface RegistroReconocimiento {
  id: number
  persona_id: number | null
  persona_nombre: string | null
  similitud: number
  distancia: number | null
  umbral: number
  coincide: boolean
  probabilidad_calibrada: number | null
  created_at: string
}

export interface PersonaProbabilidad {
  persona_id: number
  persona_nombre: string
  promedio: number
  mejor: number
  umbral: number
  probabilidad?: number
}