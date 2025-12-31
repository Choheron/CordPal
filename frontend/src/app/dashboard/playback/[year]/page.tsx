
export default async function page({
  params,
}: {
  params: Promise<{ year: number }> 
}) {
  // Parse year from URL
  const { year } = (await params)

  return <p>{`dashboard/playback/${year}`}</p>
}