// types/transport.ts

export interface ApplicationPeriod {
  begin: string // Format YYYYMMDDTHHmmss
  end: string
}

export interface ImpactedSection {
  lineId: string // ex: "line:IDFM:C01378"
  from?: { name: string }
  to?: { name: string }
}

export interface TransportIncident {
  id: string
  cause: string
  severity: string // BLOQUANTE, PERTURBEE, INFORMATION
  title: string
  message: string
  lastUpdate: string
  applicationPeriods: ApplicationPeriod[]
  impactedSections?: ImpactedSection[]
}
