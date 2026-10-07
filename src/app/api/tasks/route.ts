/**
 * GET /api/tasks — returns all tasks (public)
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('id, slug, title, description, points, icon, status')
    .neq('status', 'archived')
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
