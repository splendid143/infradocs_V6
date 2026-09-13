import { ArrowLeft, Plus, MapPin, Server, Cpu } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { clsx } from 'clsx'
import { useCreateCable } from '@/hooks/useCables'
import { listEquipmentPorts, listPatchPorts } from '@/services/cableService'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

const cableSchema = z.object({
  cableId: z.string().min(1, 'Cable ID is required'),
  cableType: z.enum(['FIBER', 'COPPER', 'COAX', 'POWER', 'OTHER']),
  specification: z.string().min(1, 'Specification is required'),
  lengthM: z.coerce.number().min(0, 'Length must be positive').default(0),
  lengthFt: z.coerce.number().min(0, 'Length must be positive').default(0),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').default(1),
  status: z.enum(['PLANNED', 'INSTALLED', 'TESTED', 'VERIFIED', 'ISSUE', 'REMOVED', 'ARCHIVED']),
  notes: z.string().optional(),
  endpointAType: z.enum(['EQUIPMENT_PORT', 'PATCH_PORT']),
  endpointAEquipmentPort: z.string().optional(),
  endpointAPatchPort: z.string().optional(),
  endpointBType: z.enum(['EQUIPMENT_PORT', 'PATCH_PORT']),
  endpointBEquipmentPort: z.string().optional(),
  endpointBPatchPort: z.string().optional(),
})

type CableForm = z.infer<typeof cableSchema>

const selectClass = 'input'

export function CableNewPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { data: equipmentPorts = [] } = useQuery({
    queryKey: ['equipmentPorts', 'select'],
    queryFn: listEquipmentPorts,
    staleTime: 60_000,
  })
  const { data: patchPorts = [] } = useQuery({
    queryKey: ['patchPorts', 'select'],
    queryFn: listPatchPorts,
    staleTime: 60_000,
  })
  const isUuid = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CableForm>({
    resolver: zodResolver(cableSchema),
    defaultValues: {
      cableId: '',
      cableType: 'FIBER',
      specification: '',
      lengthM: undefined,
      lengthFt: undefined,
      quantity: 1,
      status: 'PLANNED',
      notes: '',
      endpointAType: 'EQUIPMENT_PORT',
      endpointAEquipmentPort: '',
      endpointAPatchPort: '',
      endpointBType: 'EQUIPMENT_PORT',
      endpointBEquipmentPort: '',
      endpointBPatchPort: '',
    },
  })

  const endpointAType = watch('endpointAType')
  const endpointBType = watch('endpointBType')

  const createCable = useCreateCable()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const onSubmit = async (data: CableForm) => {
    setLoading(true)
    setSubmitError(null)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth.user?.id || ''
      const cable = {
        cable_id: data.cableId,
        cable_type: data.cableType,
        specification: data.specification || null,
        length_m: data.lengthM ?? null,
        length_ft: data.lengthFt ?? null,
        quantity: data.quantity ?? 1,
        status: data.status,
        notes: data.notes || null,
        created_by: userId,
      }
      const endpointA =
        data.endpointAType === 'EQUIPMENT_PORT' && isUuid(data.endpointAEquipmentPort)
          ? { endpoint_type: 'EQUIPMENT_PORT' as const, equipment_port_id: data.endpointAEquipmentPort }
          : data.endpointAType === 'PATCH_PORT' && isUuid(data.endpointAPatchPort)
            ? { endpoint_type: 'PATCH_PORT' as const, patch_port_id: data.endpointAPatchPort }
            : null
      const endpointB =
        data.endpointBType === 'EQUIPMENT_PORT' && isUuid(data.endpointBEquipmentPort)
          ? { endpoint_type: 'EQUIPMENT_PORT' as const, equipment_port_id: data.endpointBEquipmentPort }
          : data.endpointBType === 'PATCH_PORT' && isUuid(data.endpointBPatchPort)
            ? { endpoint_type: 'PATCH_PORT' as const, patch_port_id: data.endpointBPatchPort }
            : null
      await createCable.mutateAsync({ cable, endpointA: endpointA as any, endpointB: endpointB as any })
      navigate('/cables', { replace: true })
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save cable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="New Cable"
        description="Create a new cable connection"
        action={
          <Link to="/cables" className="btn-ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-6" noValidate>
        {submitError && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{submitError}</div>
        )}
        <p className="text-sm text-surface-500">Endpoints are optional — you can connect ports later from the cable detail page.</p>
        <Card>
          <CardHeader>
            <CardTitle>Cable Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Cable ID</Label>
                <Input {...register('cableId')} placeholder="CBL-F-00125" error={!!errors.cableId} />
                {errors.cableId && <p className="mt-1 text-sm text-red-600">{errors.cableId.message}</p>}
              </div>
              <div>
                <Label>Cable Type</Label>
                <select {...register('cableType')} className={selectClass}>
                  <option value="FIBER">Fiber</option>
                  <option value="COPPER">Copper</option>
                  <option value="COAX">Coax</option>
                  <option value="POWER">Power</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <Label>Specification</Label>
                <Input {...register('specification')} placeholder="OM4 12C" error={!!errors.specification} />
                {errors.specification && <p className="mt-1 text-sm text-red-600">{errors.specification.message}</p>}
              </div>
              <div>
                <Label>Status</Label>
                <select {...register('status')} className={selectClass}>
                  <option value="PLANNED">Planned</option>
                  <option value="INSTALLED">Installed</option>
                  <option value="TESTED">Tested</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="ISSUE">Issue</option>
                  <option value="REMOVED">Removed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Length (meters)</Label>
                <Input type="number" step="0.1" {...register('lengthM')} placeholder="35" />
              </div>
              <div>
                <Label>Length (feet)</Label>
                <Input type="number" step="0.1" {...register('lengthFt')} placeholder="115" />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" min="1" {...register('quantity')} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea {...register('notes')} className="input min-h-[80px] resize-y" placeholder="Optional notes..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endpoint A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Connection Type</Label>
              <select {...register('endpointAType')} className={selectClass}>
                <option value="EQUIPMENT_PORT">Equipment Port</option>
                <option value="PATCH_PORT">Patch Panel Port</option>
              </select>
            </div>
            {endpointAType === 'EQUIPMENT_PORT' && (
              <div>
                <Label>Equipment Port</Label>
                <select {...register('endpointAEquipmentPort')} className={clsx(selectClass, errors.endpointAEquipmentPort && 'border-red-500 focus:ring-red-500')}>
                  <option value="">Select equipment port (optional)...</option>
                  {equipmentPorts.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                {errors.endpointAEquipmentPort && <p className="mt-1 text-sm text-red-600">{errors.endpointAEquipmentPort.message}</p>}
              </div>
            )}
            {endpointAType === 'PATCH_PORT' && (
              <div>
                <Label>Patch Panel Port</Label>
                <select {...register('endpointAPatchPort')} className={clsx(selectClass, errors.endpointAPatchPort && 'border-red-500 focus:ring-red-500')}>
                  <option value="">Select patch port (optional)...</option>
                  {patchPorts.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                {errors.endpointAPatchPort && <p className="mt-1 text-sm text-red-600">{errors.endpointAPatchPort.message}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endpoint B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Connection Type</Label>
              <select {...register('endpointBType')} className={selectClass}>
                <option value="EQUIPMENT_PORT">Equipment Port</option>
                <option value="PATCH_PORT">Patch Panel Port</option>
              </select>
            </div>
            {endpointBType === 'EQUIPMENT_PORT' && (
              <div>
                <Label>Equipment Port</Label>
                <select {...register('endpointBEquipmentPort')} className={clsx(selectClass, errors.endpointBEquipmentPort && 'border-red-500 focus:ring-red-500')}>
                  <option value="">Select equipment port (optional)...</option>
                  {equipmentPorts.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                {errors.endpointBEquipmentPort && <p className="mt-1 text-sm text-red-600">{errors.endpointBEquipmentPort.message}</p>}
              </div>
            )}
            {endpointBType === 'PATCH_PORT' && (
              <div>
                <Label>Patch Panel Port</Label>
                <select {...register('endpointBPatchPort')} className={clsx(selectClass, errors.endpointBPatchPort && 'border-red-500 focus:ring-red-500')}>
                  <option value="">Select patch port (optional)...</option>
                  {patchPorts.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                {errors.endpointBPatchPort && <p className="mt-1 text-sm text-red-600">{errors.endpointBPatchPort.message}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/cables" className="btn-secondary">
            Cancel
          </Link>
          <Button type="submit" loading={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Create Cable
          </Button>
        </div>
      </form>
    </div>
  )
}