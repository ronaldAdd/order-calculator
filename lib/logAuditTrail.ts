// lib/logAuditTrail.ts
import AuditTrail from '@/models/audit-trail-ts'

type LogAuditParams = {
  actorId: string
  actorName: string
  actionType: string
  targetEntityType: string
  targetEntityId: string
  description: string
  details?: Record<string, unknown>
}

export async function logAuditTrail(params: LogAuditParams) {
  try {
    if (!params.actorId || !params.actionType || !params.targetEntityId) {
      console.warn('⚠️ Skipping audit log due to missing required fields:', params)
      return
    }

    await AuditTrail.create({
      timestamp: new Date(),
      actorId: params.actorId,
      actorName: params.actorName || 'Unknown',
      actionType: params.actionType,
      targetEntityType: params.targetEntityType,
      targetEntityId: params.targetEntityId,
      description: params.description,
      details: params.details ?? {},
      createdBy: params.actorId,
    })
  } catch (err) {
    console.error('❌ Failed to log audit trail:', err)
  }
}
