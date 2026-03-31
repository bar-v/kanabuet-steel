import { supabase } from '@/lib/supabaseClient'

export default async function TestSupabase() {
  const { data, error } = await supabase
    .from('projects')   // ganti dengan nama tabelmu
    .select('*')

  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <h1>Data dari Supabase</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}