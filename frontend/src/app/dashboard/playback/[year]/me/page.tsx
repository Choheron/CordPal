
export default async function page({
  params,
}: {
  params: Promise<{ year: string }> 
}) {
  // Parse year from URL
  const { year } = (await params)

  return <p>{`dashboard/playback/${year}/me`}</p>
}
