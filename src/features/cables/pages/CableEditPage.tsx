import { ArrowLeft, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { clsx } from 'clsx'

const cableSchema = z.object({
  cableId: z.string().min(1, 'Cable ID is required'),
  cableType: z.enum(['FIBER', 'COPPER', 'COAX', 'POWER', 'OTHER']),
  specification: z.string().min(1, 'Specification is required'),
  lengthM: z.number().min(0, 'Length must be positive').default(0),
  lengthFt: z.number().min(0, 'Length must be positive').default(0),
  quantity: z.number().min(1, 'Quantity must be at least 1').default(1),
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

export function CableEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CableForm>({
    resolver: zodResolver(cableSchema),
    defaultValues: {
      cableId: 'CBL-F-00125',
      cableType: 'FIBER',
      specification: 'OM4 12C',
      lengthM: 35,
      lengthFt: 115,
      quantity: 1,
      status: 'VERIFIED',
      notes: 'Spine to leaf interconnect',
      endpointAType: 'EQUIPMENT_PORT',
      endpointAEquipmentPort: '1',
      endpointAPatchPort: '',
      endpointBType: 'EQUIPMENT_PORT',
      endpointBEquipmentPort: '3',
      endpointBPatchPort: '',
    },
  })

  const endpointAType = watch('endpointAType')
  const endpointBType = watch('endpointBType')

  const onSubmit = async (data: CableForm) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    navigate('/cables', { replace: true })
  }

  return (
    <div>
      <PageHeader
        title="Edit Cable"
        description="CBL-F-00125"
        action={
          <Link to="/cables" className="btn-ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Cable Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Cable ID</Label>
                <Input {...register('cableId')} error={!!errors.cableId} />
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
                <Input {...register('specification')} error={!!errors.specification} />
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
                <Input type="number" step="0.1" {...register('lengthM')} />
              </div>
              <div>
                <Label>Length (feet)</Label>
                <Input type="number" step="0.1" {...register('lengthFt')} />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" min="1" {...register('quantity')} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea {...register('notes')} className="input min-h-[80px] resize-y" />
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
                <select {...register('endpointAEquipmentPort')} className={selectClass}>
                  <option value="">Select equipment port...</option>
                  <option value="1">SPINE-SW-01 - Port 48</option>
                  <option value="2">SPINE-SW-01 - Port 47</option>
                  <option value="3">LEAF-SW-03 - Port 48</option>
                </select>
              </div>
            )}
            {endpointAType === 'PATCH_PORT' && (
              <div>
                <Label>Patch Panel Port</Label>
                <select {...register('endpointAPatchPort')} className={selectClass}>
                  <option value="">Select patch port...</option>
                  <option value="1">FPP-L01-001 - Port 1</option>
                  <option value="2">FPP-L01-001 - Port 2</option>
                </select>
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
                <select {...register('endpointBEquipmentPort')} className={selectClass}>
                  <option value="">Select equipment port...</option>
                  <option value="1">SPINE-SW-01 - Port 48</option>
                  <option value="2">SPINE-SW-01 - Port 47</option>
                  <option value="3">LEAF-SW-03 - Port 48</option>
                </select>
              </div>
            )}
            {endpointBType === 'PATCH_PORT' && (
              <div>
                <Label>Patch Panel Port</Label>
                <select {...register('endpointBPatchPort')} className={selectClass}>
                  <option value="">Select patch port...</option>
                  <option value="1">FPP-L01-001 - Port 1</option>
                  <option value="2">FPP-L01-001 - Port 2</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to={`/cables/${id}`} className="btn-secondary">
            Cancel
          </Link>
          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}